"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getAuthHeaders } from "@/lib/clientAuth";

const emptyTask = {
  taskId: "",
  title: "",
  description: "",
  status: "Open",
  startDatetime: "",
  endDatetime: "",
};

const statusOptions = ["Open", "In Progress", "Completed", "Cancelled"];

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isActiveTask(task) {
  return !["Completed", "Cancelled"].includes(task?.status);
}

function formatDate(value) {
  if (!value) return "No due date";
  return new Date(value).toLocaleString("en-SG", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAssignmentTaskId(assignment) {
  return assignment?.task?.task_id ?? assignment?.task_id;
}

function scoreTaskRisk(task, assignmentCount) {
  const now = Date.now();
  const dueTime = task.end_datetime ? new Date(task.end_datetime).getTime() : null;
  const hoursToDue = dueTime ? (dueTime - now) / 36e5 : null;
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

  if (task.status === "In Progress") {
    score += 8;
    reasons.push("Work is already in progress.");
  }

  if (!cleanText(task.description)) {
    score += 6;
    reasons.push("Description is missing.");
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

  if (task.status === "Open") {
    score += 8;
  }

  const boundedScore = Math.min(100, score);
  const priority = boundedScore >= 76 ? "Urgent" : boundedScore >= 52 ? "High" : boundedScore >= 28 ? "Medium" : "Normal";

  return {
    priority,
    score: boundedScore,
    reasons: [...new Set(reasons)].slice(0, 3),
  };
}

export default function TaskManagement() {
  const taskFormRef = useRef(null);
  const [tasks, setTasks] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState(emptyTask);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [selectedAiTaskId, setSelectedAiTaskId] = useState("");
  const [aiWorking, setAiWorking] = useState("");
  const [aiResult, setAiResult] = useState(null);

  async function authHeaders() {
    return getAuthHeaders();
  }

  const assignmentCounts = useMemo(() => {
    const counts = new Map();

    assignments.forEach((assignment) => {
      const taskId = getAssignmentTaskId(assignment);
      if (taskId == null) return;
      counts.set(String(taskId), (counts.get(String(taskId)) ?? 0) + 1);
    });

    return counts;
  }, [assignments]);

  const analyzedTasks = useMemo(
    () =>
      tasks.map((task) => {
        const assignmentCount = assignmentCounts.get(String(task.task_id)) ?? 0;
        const risk = scoreTaskRisk(task, assignmentCount);

        return {
          task,
          assignmentCount,
          risk,
          priority: suggestPriority(task, risk),
        };
      }),
    [assignmentCounts, tasks],
  );

  const selectedAiTask = useMemo(
    () => tasks.find((task) => String(task.task_id) === String(selectedAiTaskId)) ?? null,
    [selectedAiTaskId, tasks],
  );

  const workspaceSummary = useMemo(() => {
    const active = tasks.filter(isActiveTask);
    const open = tasks.filter((task) => task.status === "Open");
    const inProgress = tasks.filter((task) => task.status === "In Progress");
    const completed = tasks.filter((task) => task.status === "Completed");
    const unassigned = analyzedTasks.filter((entry) => isActiveTask(entry.task) && entry.assignmentCount === 0);
    const highRisk = analyzedTasks.filter((entry) => entry.risk.level === "High");

    return {
      activeCount: active.length,
      openCount: open.length,
      inProgressCount: inProgress.length,
      completedCount: completed.length,
      unassignedCount: unassigned.length,
      highRiskCount: highRisk.length,
      assignmentCount: assignments.length,
    };
  }, [analyzedTasks, assignments.length, tasks]);

  async function loadWorkspace() {
    try {
      setError("");
      const headers = await authHeaders();
      const [tasksResponse, assignmentsResponse] = await Promise.all([
        fetch("/api/tasks", { headers }),
        fetch("/api/task-assignments", { headers }),
      ]);
      const [tasksResult, assignmentsResult] = await Promise.all([
        tasksResponse.json(),
        assignmentsResponse.json(),
      ]);

      if (!tasksResponse.ok) {
        throw new Error(tasksResult.error || "Could not load tasks.");
      }

      if (!assignmentsResponse.ok) {
        throw new Error(assignmentsResult.error || "Could not load task assignments.");
      }

      setTasks(tasksResult.tasks ?? []);
      setAssignments(assignmentsResult.assignments ?? []);
      setSelectedAiTaskId((current) => {
        if (current) return current;
        const firstActionable = (tasksResult.tasks ?? []).find(isActiveTask) ?? tasksResult.tasks?.[0];
        return firstActionable?.task_id ? String(firstActionable.task_id) : "";
      });
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadWorkspace();
    }, 0);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAiOpen) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsAiOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isAiOpen]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveTask(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/tasks", {
        method: form.taskId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify(form),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not save task.");
      }

      setMessage(form.taskId ? "Task updated." : "Task created.");
      setForm(emptyTask);
      await loadWorkspace();
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  async function deleteTask(taskId) {
    if (!window.confirm("Delete this task?")) {
      return;
    }

    try {
      setError("");
      const response = await fetch(`/api/tasks?taskId=${taskId}`, {
        method: "DELETE",
        headers: await authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not delete task.");
      }

      setMessage("Task deleted.");
      await loadWorkspace();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  function editTask(task) {
    setForm({
      taskId: task.task_id,
      title: task.title ?? "",
      description: task.description ?? "",
      status: task.status ?? "Open",
      startDatetime: task.start_datetime ? task.start_datetime.slice(0, 16) : "",
      endDatetime: task.end_datetime ? task.end_datetime.slice(0, 16) : "",
    });
    taskFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function runAutoAssign() {
    const taskId = selectedAiTaskId || tasks.find(isActiveTask)?.task_id;

    if (!taskId) {
      setAiResult({
        type: "error",
        title: "Auto assign needs a task",
        message: "Create or select an active task before running Optimus AI assignment.",
      });
      return;
    }

    setAiWorking("auto");
    setAiResult(null);

    try {
      const response = await fetch("/api/task-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ taskId, mode: "auto" }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Optimus AI could not assign this task.");
      }

      setAiResult({
        type: "auto",
        title: "Auto assignment complete",
        message: `${result.employee?.username ?? "Best match"} was assigned to ${selectedAiTask?.title ?? "the selected task"}.`,
        items: [
          { label: "Assigned employee", value: result.employee?.username ?? "Best match" },
          { label: "Confidence", value: `${result.recommendation?.confidence ?? result.evaluation?.score ?? 100}%` },
          { label: "Reason", value: result.recommendation?.summary ?? "Availability, conflict, and skill checks passed." },
        ],
      });
      setMessage("Optimus AI assigned the selected task.");
      await loadWorkspace();
    } catch (assignError) {
      setAiResult({
        type: "error",
        title: "Auto assignment blocked",
        message: assignError.message,
      });
    } finally {
      setAiWorking("");
    }
  }

  function runRiskPrediction() {
    const rows = analyzedTasks
      .filter((entry) => isActiveTask(entry.task))
      .sort((left, right) => right.risk.score - left.risk.score)
      .slice(0, 4);

    setAiResult({
      type: "risk",
      title: "Workload risk prediction",
      message: rows.length
        ? "Optimus AI ranked active tasks by deadline pressure, assignment coverage, and missing task details."
        : "No active tasks need workload risk analysis right now.",
      rows,
    });
  }

  function runPrioritySuggestion() {
    const rows = analyzedTasks
      .filter((entry) => isActiveTask(entry.task))
      .sort((left, right) => right.priority.score - left.priority.score)
      .slice(0, 5);

    setAiResult({
      type: "priority",
      title: "Suggested task priority",
      message: rows.length
        ? "Priority is estimated from risk, deadline window, status, and business-impact keywords."
        : "No active tasks are available for priority suggestions.",
      rows,
    });
  }

  function runWorkspaceSummary() {
    const insight =
      workspaceSummary.highRiskCount > 0
        ? "Review high-risk tasks first, then run Auto assign on unassigned open work."
        : workspaceSummary.unassignedCount > 0
          ? "The workspace is stable, but unassigned tasks should be routed next."
          : "The workspace is balanced with no immediate assignment gaps.";

    setAiResult({
      type: "summary",
      title: "Workspace summary",
      message: insight,
      items: [
        { label: "Active tasks", value: workspaceSummary.activeCount },
        { label: "Open", value: workspaceSummary.openCount },
        { label: "In progress", value: workspaceSummary.inProgressCount },
        { label: "Completed", value: workspaceSummary.completedCount },
        { label: "Assignments", value: workspaceSummary.assignmentCount },
        { label: "Unassigned", value: workspaceSummary.unassignedCount },
      ],
    });
  }

  function openCreateTask() {
    setForm(emptyTask);
    taskFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-6">
      <section className="optimus-task-command">
        <div>
          <p className="dashboard-eyebrow">Manager workspace</p>
          <h2>Task command center</h2>
          <p>
            Create tasks, monitor routing coverage, and ask Optimus AI to automate assignment decisions.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="optimus-ai-launch" onClick={() => setIsAiOpen(true)}>
            Optimus AI
          </button>
          <button type="button" className="dashboard-button" onClick={openCreateTask}>
            Add Task
          </button>
        </div>
      </section>

      {error ? <p className="dashboard-alert-error">{error}</p> : null}
      {message ? <p className="dashboard-alert-info">{message}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form ref={taskFormRef} onSubmit={saveTask} className="dashboard-card p-6">
          <h2 className="text-xl font-bold text-[#07183b]">
            {form.taskId ? "Update Task" : "Create Task"}
          </h2>
          <div className="mt-5 space-y-4">
            <input
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Task title"
              required
              className="dashboard-input"
            />
            <textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Description"
              className="dashboard-textarea"
            />
            <select
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
              className="dashboard-input"
            >
              {statusOptions.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={form.startDatetime}
              onChange={(event) => updateField("startDatetime", event.target.value)}
              className="dashboard-input"
            />
            <input
              type="datetime-local"
              value={form.endDatetime}
              onChange={(event) => updateField("endDatetime", event.target.value)}
              className="dashboard-input"
            />
          </div>
          <button className="dashboard-button mt-5">
            {form.taskId ? "Update Task" : "Create Task"}
          </button>
        </form>

        <section className="dashboard-card p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="dashboard-eyebrow">To-do</p>
              <h2 className="text-xl font-bold text-[#07183b]">Tasks</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="manager-pill">{workspaceSummary.openCount} open</span>
              <span className="manager-pill">{workspaceSummary.unassignedCount} unassigned</span>
              <span className="manager-pill">{workspaceSummary.highRiskCount} high risk</span>
            </div>
          </div>
          <div className="mt-5 grid gap-4">
            {tasks.length === 0 ? (
              <p className="manager-empty">No tasks yet. Create a task or use Optimus AI after tasks are added.</p>
            ) : null}
            {analyzedTasks.map(({ task, assignmentCount, risk, priority }) => (
              <article key={task.task_id} className="optimus-task-row">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3>{task.title}</h3>
                    <span className="optimus-task-status">{task.status}</span>
                    <span className={`optimus-risk-pill is-${risk.level.toLowerCase()}`}>{risk.level} risk</span>
                  </div>
                  <p>{task.description || "No description provided."}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    <span>Assigned: {assignmentCount}</span>
                    <span>Due: {formatDate(task.end_datetime)}</span>
                    <span>AI priority: {priority.priority}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button type="button" onClick={() => editTask(task)} className="account-detail-button rounded-full px-4 py-2 text-sm font-bold">
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTask(task.task_id)}
                    className="rounded-full bg-[#cf3033] px-4 py-2 text-sm font-bold text-white"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {isAiOpen ? (
        <OptimusAiModal
          tasks={tasks}
          selectedTaskId={selectedAiTaskId}
          onSelectedTaskChange={setSelectedAiTaskId}
          aiWorking={aiWorking}
          aiResult={aiResult}
          onClose={() => setIsAiOpen(false)}
          onAutoAssign={runAutoAssign}
          onPredictRisk={runRiskPrediction}
          onSuggestPriority={runPrioritySuggestion}
          onSummarizeWorkspace={runWorkspaceSummary}
        />
      ) : null}
    </div>
  );
}

function OptimusAiModal({
  tasks,
  selectedTaskId,
  onSelectedTaskChange,
  aiWorking,
  aiResult,
  onClose,
  onAutoAssign,
  onPredictRisk,
  onSuggestPriority,
  onSummarizeWorkspace,
}) {
  const features = [
    {
      key: "auto",
      title: "Auto assign",
      description: "Route the selected task to the strongest eligible employee.",
      action: onAutoAssign,
    },
    {
      key: "risk",
      title: "Predict workload risk",
      description: "Detect deadline pressure, unassigned work, and incomplete task data.",
      action: onPredictRisk,
    },
    {
      key: "priority",
      title: "Suggest task priority",
      description: "Recommend priority from due dates, status, risk, and task wording.",
      action: onSuggestPriority,
    },
    {
      key: "summary",
      title: "Summarize workspace",
      description: "Generate a compact operational summary for managers.",
      action: onSummarizeWorkspace,
    },
  ];

  return (
    <div className="optimus-ai-overlay">
      <button type="button" aria-label="Close Optimus AI" className="absolute inset-0 h-full w-full" onClick={onClose} />
      <section className="optimus-ai-modal" role="dialog" aria-modal="true" aria-labelledby="optimus-ai-title">
        <div className="optimus-ai-orb" aria-hidden="true" />
        <div className="optimus-ai-header">
          <div>
            <p>Optimus AI</p>
            <h2 id="optimus-ai-title">AI features</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close Optimus AI">
            x
          </button>
        </div>

        <div className="optimus-ai-body">
          <div className="optimus-ai-selector">
            <label htmlFor="optimus-task-select">Selected task for automation</label>
            <select
              id="optimus-task-select"
              value={selectedTaskId}
              onChange={(event) => onSelectedTaskChange(event.target.value)}
            >
              <option value="">Select task</option>
              {tasks.map((task) => (
                <option key={task.task_id} value={task.task_id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>

          <div className="optimus-ai-feature-grid">
            {features.map((feature) => (
              <button
                key={feature.key}
                type="button"
                onClick={feature.action}
                disabled={Boolean(aiWorking)}
                className={`optimus-ai-feature ${aiWorking === feature.key ? "is-running" : ""}`}
              >
                <span>{feature.title}</span>
                <small>{feature.description}</small>
              </button>
            ))}
          </div>

          <AiResultPanel result={aiResult} working={aiWorking} />
        </div>
      </section>
    </div>
  );
}

function AiResultPanel({ result, working }) {
  if (working) {
    return (
      <div className="optimus-ai-result is-loading">
        <p>Optimus AI is scanning task signals...</p>
        <div className="optimus-ai-scanbar">
          <span />
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="optimus-ai-result">
        <p>Select a feature above to generate an AI action plan for this workspace.</p>
      </div>
    );
  }

  if (result.type === "risk" || result.type === "priority") {
    return (
      <div className="optimus-ai-result">
        <h3>{result.title}</h3>
        <p>{result.message}</p>
        <div className="mt-4 grid gap-3">
          {result.rows.map(({ task, risk, priority }) => {
            const label = result.type === "risk" ? `${risk.level} risk` : priority.priority;
            const score = result.type === "risk" ? risk.score : priority.score;
            const reasons = result.type === "risk" ? risk.reasons : priority.reasons;

            return (
              <article key={task.task_id} className="optimus-ai-result-card">
                <div>
                  <h4>{task.title}</h4>
                  <p>{label}</p>
                </div>
                <span>{score}%</span>
                <ul>
                  {reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`optimus-ai-result ${result.type === "error" ? "is-error" : ""}`}>
      <h3>{result.title}</h3>
      <p>{result.message}</p>
      {result.items ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {result.items.map((item) => (
            <div key={item.label} className="optimus-ai-result-card">
              <div>
                <h4>{item.label}</h4>
                <p>{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
