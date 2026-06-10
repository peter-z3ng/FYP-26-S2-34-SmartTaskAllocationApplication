"use client";

import { useEffect, useMemo, useState } from "react";
import UserTierBadge from "@/components/UserTierBadge";
import { getAuthHeaders } from "@/lib/clientAuth";

const TASK_STATUSES = ["Open", "In Progress", "Completed", "Cancelled"];

function taskKey(value) {
  return value == null ? "" : String(value);
}

function formatDate(value) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleString();
}

function formatShortDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function isActiveTask(task) {
  return !["Completed", "Cancelled"].includes(task.status);
}

function statusClass(status) {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized === "completed") return "is-completed";
  if (normalized === "in progress") return "is-progress";
  if (normalized === "cancelled") return "is-cancelled";
  return "is-open";
}

function getProgressPercent(status) {
  if (status === "Completed") return 100;
  if (status === "In Progress") return 62;
  if (status === "Cancelled") return 12;
  return 28;
}

export default function ManagerHomeDashboard() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskBoardOpen, setIsTaskBoardOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setError("");
    setIsLoading(true);

    try {
      const headers = await getAuthHeaders();
      const [tasksResponse, employeesResponse, assignmentsResponse, requestsResponse] = await Promise.all([
        fetch("/api/tasks", { headers }),
        fetch("/api/employees", { headers }),
        fetch("/api/task-assignments", { headers }),
        fetch("/api/task-requests", { headers }),
      ]);

      const tasksResult = await tasksResponse.json();
      const employeesResult = await employeesResponse.json();
      const assignmentsResult = await assignmentsResponse.json();
      const requestsResult = await requestsResponse.json();

      if (!tasksResponse.ok) throw new Error(tasksResult.error || "Could not load tasks.");
      if (!employeesResponse.ok) throw new Error(employeesResult.error || "Could not load employees.");
      if (!assignmentsResponse.ok) throw new Error(assignmentsResult.error || "Could not load assignments.");
      if (!requestsResponse.ok) throw new Error(requestsResult.error || "Could not load task requests.");

      setTasks(tasksResult.tasks ?? []);
      setEmployees(employeesResult.employees ?? []);
      setAssignments(assignmentsResult.assignments ?? []);
      setRequests(requestsResult.requests ?? []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(loadData, 0);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!selectedTask && !isTaskBoardOpen) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") {
        setSelectedTask(null);
        setIsTaskBoardOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedTask, isTaskBoardOpen]);

  const dashboard = useMemo(() => {
    const assignedByTask = assignments.reduce((map, assignment) => {
      const id = taskKey(assignment.task?.task_id);
      if (!id) return map;
      map[id] = [...(map[id] ?? []), assignment];
      return map;
    }, {});

    const requestsByTask = requests.reduce((map, request) => {
      const id = taskKey(request.task?.task_id);
      if (!id) return map;
      map[id] = [...(map[id] ?? []), request];
      return map;
    }, {});

    const statusCounts = TASK_STATUSES.map((status) => ({
      status,
      count: tasks.filter((task) => task.status === status).length,
    }));

    const assignedTaskIds = new Set(Object.keys(assignedByTask));
    // eslint-disable-next-line react-hooks/purity -- Due-soon counts use a wall-clock snapshot for this dashboard view.
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const activeTasks = tasks.filter(isActiveTask);
    const dueSoonTasks = activeTasks.filter((task) => {
      if (!task.end_datetime) return false;
      const dueTime = new Date(task.end_datetime).getTime();
      return dueTime >= now && dueTime <= now + sevenDays;
    });

    const completedCount = tasks.filter((task) => task.status === "Completed").length;
    const completionRate = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
    const assignedActiveCount = activeTasks.filter((task) => assignedTaskIds.has(taskKey(task.task_id))).length;
    const assignmentRate = activeTasks.length ? Math.round((assignedActiveCount / activeTasks.length) * 100) : 0;

    const employeeLoad = employees.map((employee) => {
      const load = assignments.filter((assignment) => assignment.user?.user_id === employee.user_id).length;
      return {
        ...employee,
        load,
        capacity: Math.max(0, 3 - load),
      };
    });

    const maxLoad = Math.max(1, ...employeeLoad.map((employee) => employee.load));
    const sortedTasks = [...tasks].sort((left, right) => {
      const leftDate = new Date(left.end_datetime || left.start_datetime || left.created_at || 0).getTime();
      const rightDate = new Date(right.end_datetime || right.start_datetime || right.created_at || 0).getTime();
      return leftDate - rightDate;
    });

    return {
      activeTasks,
      assignedByTask,
      assignmentRate,
      dueSoonTasks,
      employeeLoad,
      maxLoad,
      requestsByTask,
      sortedTasks,
      statusCounts,
      stats: [
        { label: "Active tasks", value: activeTasks.length, detail: "in motion" },
        { label: "Unassigned", value: activeTasks.filter((task) => !assignedTaskIds.has(taskKey(task.task_id))).length, detail: "need action" },
        { label: "Due soon", value: dueSoonTasks.length, detail: "next 7 days" },
        { label: "Pending requests", value: requests.filter((request) => request.status === "Pending").length, detail: "to review" },
      ],
      completionRate,
    };
  }, [assignments, employees, requests, tasks]);

  function openTask(task) {
    setSelectedTask({
      ...task,
      assignments: dashboard.assignedByTask[taskKey(task.task_id)] ?? [],
      requests: dashboard.requestsByTask[taskKey(task.task_id)] ?? [],
    });
  }

  return (
    <div className="manager-dashboard space-y-6">
      {error ? <p className="dashboard-alert-error">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboard.stats.map((stat, index) => (
          <ManagerMetric key={stat.label} stat={stat} index={index} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <section className="manager-panel manager-task-overview">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="dashboard-eyebrow">Workflow summary</p>
              <h2 className="mt-1 text-2xl font-black text-white">Task Overview</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Click any task to inspect status, assignment, requests, and schedule details.
              </p>
            </div>
            <button type="button" onClick={() => setIsTaskBoardOpen(true)} className="manager-action-button">
              View all tasks
            </button>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <StatusChart statusCounts={dashboard.statusCounts} total={tasks.length} />
            <div className="space-y-3">
              {isLoading ? <p className="manager-empty">Loading task workflow...</p> : null}
              {!isLoading && dashboard.sortedTasks.length === 0 ? (
                <p className="manager-empty">No tasks have been created yet.</p>
              ) : null}
              {dashboard.sortedTasks.slice(0, 5).map((task, index) => (
                <TaskRow
                  key={task.task_id}
                  task={task}
                  assignments={dashboard.assignedByTask[taskKey(task.task_id)] ?? []}
                  requests={dashboard.requestsByTask[taskKey(task.task_id)] ?? []}
                  index={index}
                  onOpen={() => openTask(task)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="manager-panel">
          <p className="dashboard-eyebrow">Workflow summary</p>
          <h2 className="mt-1 text-2xl font-black text-white">Team Capacity</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Animated workload indicators based on current allocation history.
          </p>

          <div className="mt-6 grid gap-5">
            <RadialProgress
              label="Active assignment coverage"
              value={dashboard.assignmentRate}
              detail={`${dashboard.assignmentRate}% of active tasks have an assignment`}
            />
            <WorkloadChart employees={dashboard.employeeLoad} maxLoad={dashboard.maxLoad} />
          </div>
        </section>
      </div>

      <section className="manager-panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="dashboard-eyebrow">Deadline motion</p>
            <h2 className="mt-1 text-2xl font-black text-white">Upcoming Task Timeline</h2>
          </div>
          <span className="rounded-full border border-teal-200/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-teal-100">
            {dashboard.dueSoonTasks.length} due soon
          </span>
        </div>
        <TaskTimeline tasks={dashboard.sortedTasks.slice(0, 6)} onOpen={openTask} />
      </section>

      <TaskBoardDialog
        isOpen={isTaskBoardOpen}
        tasks={dashboard.sortedTasks}
        assignedByTask={dashboard.assignedByTask}
        requestsByTask={dashboard.requestsByTask}
        onClose={() => setIsTaskBoardOpen(false)}
        onOpenTask={openTask}
      />

      <TaskDetailDialog task={selectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  );
}

function ManagerMetric({ stat, index }) {
  return (
    <section className="manager-metric" style={{ "--metric-delay": `${index * 90}ms` }}>
      <p>{stat.label}</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <span>{stat.value}</span>
        <small>{stat.detail}</small>
      </div>
    </section>
  );
}

function StatusChart({ statusCounts, total }) {
  const maxCount = Math.max(1, ...statusCounts.map((entry) => entry.count));

  return (
    <div className="manager-chart-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-100">Status chart</p>
          <h3 className="mt-1 text-lg font-black text-white">{total} total tasks</h3>
        </div>
        <div className="manager-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="mt-5 space-y-4">
        {statusCounts.map((entry) => {
          const width = Math.max(8, Math.round((entry.count / maxCount) * 100));
          return (
            <div key={entry.status}>
              <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-[0.14em] text-slate-300">
                <span>{entry.status}</span>
                <span>{entry.count}</span>
              </div>
              <div className="manager-bar-track">
                <span className={`manager-bar-fill ${statusClass(entry.status)}`} style={{ "--bar-width": `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RadialProgress({ label, value, detail }) {
  return (
    <div className="manager-radial-card">
      <div className="manager-radial" style={{ "--progress": `${value}%` }}>
        <span>{value}%</span>
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-100">{label}</p>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-200">{detail}</p>
      </div>
    </div>
  );
}

function WorkloadChart({ employees, maxLoad }) {
  return (
    <div className="manager-chart-card">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-100">Team load</p>
      <div className="mt-5 space-y-4">
        {employees.length === 0 ? <p className="manager-empty">No employee records found.</p> : null}
        {employees.map((employee, index) => {
          const width = Math.max(10, Math.round((employee.load / maxLoad) * 100));
          return (
            <div key={employee.user_id} className="manager-load-row" style={{ "--row-delay": `${index * 100}ms` }}>
              <div className="mb-2 flex items-center justify-between gap-4">
                <span className="truncate text-sm font-black text-white">{employee.username}</span>
                <span className="text-xs font-bold text-slate-300">{employee.load} assigned</span>
              </div>
              <div className="manager-bar-track">
                <span className="manager-bar-fill is-load" style={{ "--bar-width": `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskRow({ task, assignments, requests, index, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid={`manager-task-${task.task_id}`}
      className="manager-task-row"
      style={{ "--row-delay": `${index * 85}ms` }}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3 text-left">
        <span className={`manager-status-dot ${statusClass(task.status)}`} />
        <div className="min-w-0">
          <h3 className="truncate text-base font-black text-white">{task.title}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-300">{task.description || "No description provided."}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`manager-pill ${statusClass(task.status)}`}>{task.status}</span>
            <span className="manager-pill">{assignments[0]?.user?.username ?? "Unassigned"}</span>
            {requests.length > 0 ? <span className="manager-pill">{requests.length} requests</span> : null}
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-teal-100">Due</p>
        <p className="mt-1 text-sm font-black text-white">{formatShortDate(task.end_datetime)}</p>
      </div>
    </button>
  );
}

function TaskTimeline({ tasks, onOpen }) {
  return (
    <div className="manager-timeline mt-6">
      {tasks.length === 0 ? <p className="manager-empty">No scheduled tasks yet.</p> : null}
      {tasks.map((task, index) => (
        <button
          key={task.task_id}
          type="button"
          onClick={() => onOpen(task)}
          className="manager-timeline-item"
          style={{ "--row-delay": `${index * 90}ms` }}
        >
          <span className={`manager-status-dot ${statusClass(task.status)}`} />
          <div>
            <p className="text-sm font-black text-white">{task.title}</p>
            <p className="mt-1 text-xs font-bold text-slate-300">
              {formatShortDate(task.start_datetime)} to {formatShortDate(task.end_datetime)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

function TaskBoardDialog({ isOpen, tasks, assignedByTask, requestsByTask, onClose, onOpenTask }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" data-testid="manager-task-board">
      <button type="button" aria-label="Close task board" onClick={onClose} className="absolute inset-0 bg-slate-950/75 backdrop-blur-md" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-board-title"
        className="manager-dialog relative max-h-[88vh] w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/20 bg-slate-950/95 text-white shadow-2xl"
      >
        <div className="relative flex flex-col gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="dashboard-eyebrow text-teal-200">Task board</p>
            <h2 id="task-board-title" className="mt-2 text-3xl font-black tracking-tight text-white">Every manager task</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Open any task below to inspect assignments, requests, and dates.</p>
          </div>
          <button type="button" onClick={onClose} className="manager-dialog-close">Close</button>
        </div>
        <div className="relative max-h-[62vh] overflow-y-auto p-6">
          <div className="grid gap-3 md:grid-cols-2">
            {tasks.map((task, index) => (
              <TaskRow
                key={task.task_id}
                task={task}
                assignments={assignedByTask[taskKey(task.task_id)] ?? []}
                requests={requestsByTask[taskKey(task.task_id)] ?? []}
                index={index}
                onOpen={() => onOpenTask(task)}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function TaskDetailDialog({ task, onClose }) {
  if (!task) return null;

  const assignments = task.assignments ?? [];
  const requests = task.requests ?? [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6" data-testid="manager-task-detail">
      <button type="button" aria-label="Close task detail" onClick={onClose} className="absolute inset-0 bg-slate-950/75 backdrop-blur-md" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-title"
        className="manager-dialog relative max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/20 bg-slate-950/95 text-white shadow-2xl"
      >
        <div className="relative flex flex-col gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="dashboard-eyebrow text-teal-200">Task detail</p>
            <h2 id="task-detail-title" className="mt-2 text-3xl font-black tracking-tight text-white">{task.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{task.description || "No description provided."}</p>
          </div>
          <button type="button" onClick={onClose} className="manager-dialog-close">Close</button>
        </div>
        <div className="relative max-h-[62vh] overflow-y-auto p-6">
          <div className="mb-5 flex flex-wrap gap-2">
            <span className={`manager-pill ${statusClass(task.status)}`}>{task.status}</span>
            <span className="manager-pill">{assignments.length ? `${assignments.length} assignment` : "Unassigned"}</span>
            <span className="manager-pill">{requests.length} requests</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TaskDetailField label="Task code" value={task.task_code} />
            <TaskDetailField label="Progress estimate" value={`${getProgressPercent(task.status)}%`} />
            <TaskDetailField label="Start" value={formatDate(task.start_datetime)} />
            <TaskDetailField label="End" value={formatDate(task.end_datetime)} />
            <TaskDetailField label="Created" value={formatDate(task.created_at)} />
            <TaskDetailField label="Updated" value={formatDate(task.updated_at)} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <section className="manager-detail-block">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-100">Assignments</p>
              <div className="mt-4 space-y-3">
                {assignments.length === 0 ? <p className="text-sm font-bold text-slate-300">No employee has been assigned yet.</p> : null}
                {assignments.map((assignment) => (
                  <div key={assignment.assignment_id} className="rounded-2xl bg-white/10 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-white">{assignment.user?.username ?? assignment.user?.email ?? "Employee"}</p>
                      <UserTierBadge tier={assignment.user?.subscription_tier} size="sm" />
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-300">{assignment.status} - {formatDate(assignment.assigned_at)}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="manager-detail-block">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-100">Requests</p>
              <div className="mt-4 space-y-3">
                {requests.length === 0 ? <p className="text-sm font-bold text-slate-300">No employee requests for this task.</p> : null}
                {requests.map((request) => (
                  <div key={request.request_id} className="rounded-2xl bg-white/10 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-white">{request.user?.username ?? request.user?.email ?? "Employee"}</p>
                      <UserTierBadge tier={request.user?.subscription_tier} size="sm" />
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-300">{request.status} - {formatDate(request.requested_at)}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}

function TaskDetailField({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-100">{label}</p>
      <p className="mt-2 break-words text-sm font-bold leading-6 text-white">{value || "Not provided"}</p>
    </div>
  );
}
