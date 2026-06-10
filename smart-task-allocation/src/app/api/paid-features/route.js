import { NextResponse } from "next/server";
import { requireManager } from "@/lib/serverAuth";
import { getAccountForUser, getOrganizationIdForUser } from "@/lib/allocation";
import { generateOptimusActionNotes } from "@/lib/optimusAiServer";
import { PAID_FEATURES, isPaidTier, normalizeUserTier } from "@/lib/paidFeatures";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const ACTIVE_TASK_STATUSES = ["Open", "In Progress"];

function percent(part, total) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function buildInsights({ activeTasks, assignedTaskIds, completionRate, pendingRequests, employees, assignments }) {
  const activeUnassigned = activeTasks.filter((task) => !assignedTaskIds.has(String(task.task_id))).length;
  const suspendedEmployees = employees.filter((employee) => employee.account_status !== "Active").length;
  const paidEmployees = employees.filter((employee) => isPaidTier(employee.subscription_tier)).length;
  const averageLoad = employees.length ? (assignments.length / employees.length).toFixed(1) : "0.0";
  const insights = [];

  if (activeUnassigned > 0) {
    insights.push(`Run Smart allocation on ${activeUnassigned} active unassigned task${activeUnassigned === 1 ? "" : "s"}.`);
  } else {
    insights.push("Every active task currently has at least one assignment.");
  }

  if (pendingRequests > 0) {
    insights.push(`Review ${pendingRequests} pending employee request${pendingRequests === 1 ? "" : "s"} with paid approval checks.`);
  }

  if (completionRate < 60) {
    insights.push("Completion rate is below 60%; prioritize due tasks and rebalance workload.");
  } else {
    insights.push("Completion rate is healthy; keep monitoring upcoming deadlines.");
  }

  if (suspendedEmployees > 0) {
    insights.push(`${suspendedEmployees} employee profile${suspendedEmployees === 1 ? "" : "s"} cannot receive new work until reactivated.`);
  }

  insights.push(`${paidEmployees} employee${paidEmployees === 1 ? "" : "s"} have Paid Pro badges; average assignment load is ${averageLoad}.`);

  return insights;
}

async function loadPaidReport(supabase, organizationId) {
  let tasksQuery = supabase.from("task").select("*").order("created_at", { ascending: false });
  let assignmentsQuery = supabase
    .from("task_assignment")
    .select("assignment_id, assigned_at, status, user:user_id(user_id, username, email, subscription_tier), task:task_id!inner(task_id, title, organization_id, status)");
  let requestsQuery = supabase
    .from("task_assignment_request")
    .select("request_id, requested_at, status, user:user_id(user_id, username, email, subscription_tier), task:task_id!inner(task_id, title, organization_id, status)");
  let employeesQuery = supabase
    .from("user_account")
    .select("user_id, username, email, account_status, subscription_tier, role:role_id(role_name)");

  if (organizationId) {
    tasksQuery = tasksQuery.eq("organization_id", organizationId);
    assignmentsQuery = assignmentsQuery.eq("task.organization_id", organizationId);
    requestsQuery = requestsQuery.eq("task.organization_id", organizationId);
    employeesQuery = employeesQuery.eq("organization_id", organizationId);
  }

  const [{ data: tasks, error: tasksError }, { data: assignments, error: assignmentsError }, { data: requests, error: requestsError }, { data: employees, error: employeesError }] =
    await Promise.all([tasksQuery, assignmentsQuery, requestsQuery, employeesQuery]);

  const error = tasksError || assignmentsError || requestsError || employeesError;

  if (error) {
    throw new Error(error.message);
  }

  const taskRows = tasks ?? [];
  const assignmentRows = assignments ?? [];
  const requestRows = requests ?? [];
  const employeeRows = (employees ?? []).filter(
    (employee) => String(employee.role?.role_name ?? "").toLowerCase() === "employee",
  );
  const activeTasks = taskRows.filter((task) => ACTIVE_TASK_STATUSES.includes(task.status));
  const completedTasks = taskRows.filter((task) => task.status === "Completed");
  const assignedTaskIds = new Set(assignmentRows.map((assignment) => String(assignment.task?.task_id)).filter(Boolean));
  const pendingRequests = requestRows.filter((request) => request.status === "Pending").length;
  const employeeLoad = employeeRows
    .map((employee) => ({
      userId: employee.user_id,
      username: employee.username,
      tier: normalizeUserTier(employee.subscription_tier),
      assignedTasks: assignmentRows.filter((assignment) => assignment.user?.user_id === employee.user_id).length,
    }))
    .sort((left, right) => right.assignedTasks - left.assignedTasks);

  const completionRate = percent(completedTasks.length, taskRows.length);
  const assignmentCoverage = percent(
    activeTasks.filter((task) => assignedTaskIds.has(String(task.task_id))).length,
    activeTasks.length,
  );

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      totalTasks: taskRows.length,
      activeTasks: activeTasks.length,
      assignedActiveTasks: activeTasks.filter((task) => assignedTaskIds.has(String(task.task_id))).length,
      completedTasks: completedTasks.length,
      pendingRequests,
      employees: employeeRows.length,
      paidUsers: employeeRows.filter((employee) => isPaidTier(employee.subscription_tier)).length,
      freeUsers: employeeRows.filter((employee) => !isPaidTier(employee.subscription_tier)).length,
    },
    rates: {
      completionRate,
      assignmentCoverage,
    },
    employeeLoad,
    insights: buildInsights({
      activeTasks,
      assignedTaskIds,
      completionRate,
      pendingRequests,
      employees: employeeRows,
      assignments: assignmentRows,
    }),
  };
  const aiNotes = await generateOptimusActionNotes(report);

  return {
    ...report,
    insights: aiNotes.notes,
    aiProvider: aiNotes.provider,
  };
}

export async function GET(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, error: authError } = await requireManager(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const [account, organizationId] = await Promise.all([
      getAccountForUser(supabase, user),
      getOrganizationIdForUser(supabase, user),
    ]);
    const tier = normalizeUserTier(account?.subscription_tier);
    const isPaid = isPaidTier(tier);

    return NextResponse.json({
      tier,
      isPaid,
      features: PAID_FEATURES,
      report: isPaid ? await loadPaidReport(supabase, organizationId) : null,
      upgradeMessage: isPaid
        ? ""
        : "Upgrade to Paid Pro to unlock smart allocation, availability checks, request approval, AI recommendations, priority support, and custom reporting.",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
