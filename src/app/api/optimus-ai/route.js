import { NextResponse } from "next/server";
import { getOrganizationIdForUser } from "@/lib/allocation";
import { generateOptimusWorkspaceAction } from "@/lib/optimusAiServer";
import { requireManager } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const ACTIVE_STATUSES = ["Open", "In Progress"];

function isActiveTask(task) {
  return ACTIVE_STATUSES.includes(task?.status);
}

function taskId(value) {
  return value == null ? "" : String(value);
}

function scoreTaskRisk(task, assignmentCount) {
  const dueTime = task.end_datetime ? new Date(task.end_datetime).getTime() : null;
  const hoursToDue = dueTime ? (dueTime - Date.now()) / 36e5 : null;
  const reasons = [];
  let score = 0;

  if (isActiveTask(task) && assignmentCount === 0) {
    score += 32;
    reasons.push("No employee assigned yet.");
  }

  if (!task.start_datetime || !task.end_datetime) {
    score += 14;
    reasons.push("Timeline is incomplete.");
  }

  if (hoursToDue != null && hoursToDue < 0 && task.status !== "Completed") {
    score += 46;
    reasons.push("Due date has passed.");
  } else if (hoursToDue != null && hoursToDue <= 24 && task.status !== "Completed") {
    score += 34;
    reasons.push("Due within 24 hours.");
  } else if (hoursToDue != null && hoursToDue <= 72 && task.status !== "Completed") {
    score += 16;
    reasons.push("Due within three days.");
  }

  const boundedScore = Math.min(100, score);
  const level = boundedScore >= 60 ? "High" : boundedScore >= 32 ? "Medium" : "Low";

  return {
    score: boundedScore,
    level,
    reasons: reasons.length ? reasons : ["No immediate risk detected."],
  };
}

function suggestPriority(task, risk) {
  const text = `${task.title ?? ""} ${task.description ?? ""}`.toLowerCase();
  const dueTime = task.end_datetime ? new Date(task.end_datetime).getTime() : null;
  const hoursToDue = dueTime ? (dueTime - Date.now()) / 36e5 : null;
  let score = risk.score;
  const reasons = [...risk.reasons];

  if (/(urgent|vip|customer|escalation|premium|audit|closing)/i.test(text)) {
    score += 22;
    reasons.push("Task wording suggests business impact.");
  }

  if (hoursToDue != null && hoursToDue <= 24) {
    score += 18;
    reasons.push("Short deadline window.");
  }

  const boundedScore = Math.min(100, score);

  return {
    priority: boundedScore >= 76 ? "Urgent" : boundedScore >= 52 ? "High" : boundedScore >= 28 ? "Medium" : "Normal",
    score: boundedScore,
    reasons: [...new Set(reasons)].slice(0, 3),
  };
}

function buildLocalResult(action, tasks, assignments) {
  const assignmentCounts = assignments.reduce((counts, assignment) => {
    const id = taskId(assignment.task_id ?? assignment.task?.task_id);
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
    return counts;
  }, new Map());
  const activeTasks = tasks.filter(isActiveTask);
  const analyzedTasks = tasks.map((task) => {
    const assignmentCount = assignmentCounts.get(taskId(task.task_id)) ?? 0;
    const risk = scoreTaskRisk(task, assignmentCount);
    return { task, assignmentCount, risk, priority: suggestPriority(task, risk) };
  });

  if (action === "risk") {
    const rows = analyzedTasks
      .filter((entry) => isActiveTask(entry.task))
      .sort((left, right) => right.risk.score - left.risk.score)
      .slice(0, 4);

    return {
      title: "Workload risk prediction",
      message: rows.length
        ? "Optimus AI ranked active tasks by deadline pressure, assignment coverage, and missing task details."
        : "No active tasks need workload risk analysis right now.",
      items: rows.map((entry) => ({
        label: entry.task.title,
        value: `${entry.risk.level} risk · ${entry.risk.score}% · ${entry.risk.reasons[0]}`,
      })),
    };
  }

  if (action === "priority") {
    const rows = analyzedTasks
      .filter((entry) => isActiveTask(entry.task))
      .sort((left, right) => right.priority.score - left.priority.score)
      .slice(0, 5);

    return {
      title: "Suggested task priority",
      message: rows.length
        ? "Priority is estimated from risk, deadline window, status, and business-impact keywords."
        : "No active tasks are available for priority suggestions.",
      items: rows.map((entry) => ({
        label: entry.task.title,
        value: `${entry.priority.priority} · ${entry.priority.score}% · ${entry.priority.reasons[0]}`,
      })),
    };
  }

  const activeCount = activeTasks.length;
  const unassignedCount = activeTasks.filter((task) => !assignmentCounts.has(taskId(task.task_id))).length;
  const highRiskCount = analyzedTasks.filter((entry) => entry.risk.level === "High").length;

  return {
    title: "Workspace summary",
    message:
      highRiskCount > 0
        ? "Review high-risk tasks first, then run Auto assign on unassigned open work."
        : unassignedCount > 0
          ? "The workspace is stable, but unassigned tasks should be routed next."
          : "The workspace is balanced with no immediate assignment gaps.",
    items: [
      { label: "Active tasks", value: activeCount },
      { label: "Open", value: tasks.filter((task) => task.status === "Open").length },
      { label: "In progress", value: tasks.filter((task) => task.status === "In Progress").length },
      { label: "Completed", value: tasks.filter((task) => task.status === "Completed").length },
      { label: "Assignments", value: assignments.length },
      { label: "Unassigned", value: unassignedCount },
    ],
  };
}

export async function POST(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, error: authError } = await requireManager(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { action = "summary" } = await request.json();
    const organizationId = await getOrganizationIdForUser(supabase, user);
    let tasksQuery = supabase.from("task").select("*").order("created_at", { ascending: false });

    if (organizationId) {
      tasksQuery = tasksQuery.eq("organization_id", organizationId);
    }

    const { data: tasks, error: tasksError } = await tasksQuery;
    if (tasksError) {
      throw new Error(tasksError.message);
    }

    const taskIds = (tasks ?? []).map((task) => task.task_id);
    let assignments = [];

    if (taskIds.length) {
      const { data: assignmentRows, error: assignmentsError } = await supabase
        .from("task_assignment")
        .select("assignment_id, task_id, status, assigned_at")
        .in("task_id", taskIds);

      if (assignmentsError) {
        throw new Error(assignmentsError.message);
      }

      assignments = assignmentRows ?? [];
    }

    const localResult = buildLocalResult(action, tasks ?? [], assignments);
    const result = await generateOptimusWorkspaceAction({
      action,
      tasks: tasks ?? [],
      assignments,
      localResult,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
