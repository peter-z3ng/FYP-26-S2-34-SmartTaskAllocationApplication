"use client";

import { useEffect, useMemo, useState } from "react";
import { getAuthHeaders } from "@/lib/clientAuth";

const defaultWorkspaces = [
  {
    workspace_id: "blank",
    workspace_name: "Blank workspace",
    created_by_name: "optima_manager",
    created_at: "2026-06-07T00:00:00.000Z",
    link_access: "View",
  },
  {
    workspace_id: "workspace-2",
    workspace_name: "Workspace 2",
    created_by_name: "optima_manager",
    created_at: "2026-06-07T00:00:00.000Z",
    link_access: "Private",
  },
];

const emptyTask = {
  taskId: "",
  title: "",
  description: "",
  status: "Open",
  priority: "Medium",
  assignedTo: "",
  startDatetime: "",
  endDatetime: "",
};

const statusOptions = ["Open", "In Progress", "Completed", "Cancelled"];
const priorityOptions = ["Low", "Medium", "High", "Urgent"];
const taskColorPalette = [
  "#579BFC",
  "#00C875",
  "#FDAB3D",
  "#A25DDC",
  "#E2445C",
  "#66CCFF",
  "#FFCB00",
  "#037F4C",
];

const statusStyles = {
  Open: { backgroundColor: "#579BFC", color: "#ffffff" },
  "In Progress": { backgroundColor: "#FDAB3D", color: "#ffffff" },
  Completed: { backgroundColor: "#00C875", color: "#ffffff" },
  Cancelled: { backgroundColor: "#DF2F4A", color: "#ffffff" },
};

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isActiveTask(task) {
  return !["Completed", "Cancelled"].includes(task?.status);
}

function toInputDateTime(value) {
  if (!value) return "";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

function formatDate(value) {
  if (!value) return "No due date";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date
    .toLocaleString("en-SG", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/AM|PM/g, (match) => match.toLowerCase());
}

function formatWorkspaceDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getAssignmentTaskId(assignment) {
  return assignment?.task?.task_id ?? assignment?.task_id;
}

function getAssignmentUserId(assignment) {
  return assignment?.user?.user_id ?? assignment?.user_id;
}

function getDisplayName(account) {
  return account?.username || account?.email?.split("@")[0] || "Employee";
}

function scoreTaskRisk(task, assignmentCount) {
  const now = Date.now();
  const dueTime = task.end_datetime ? new Date(task.end_datetime).getTime() : null;
  const hoursToDue = dueTime ? (dueTime - now) / 36e5 : null;
  let score = 0;

  if (isActiveTask(task) && assignmentCount === 0) score += 32;
  if (!task.start_datetime || !task.end_datetime) score += 14;
  if (hoursToDue != null && hoursToDue < 0 && task.status !== "Completed") score += 46;
  else if (hoursToDue != null && hoursToDue <= 24 && task.status !== "Completed") score += 34;
  else if (hoursToDue != null && hoursToDue <= 72 && task.status !== "Completed") score += 16;
  if (task.status === "In Progress") score += 8;
  if (!cleanText(task.description)) score += 6;

  return Math.min(100, score);
}

function getPriority(task, assignmentCount) {
  const text = `${task.title ?? ""} ${task.description ?? ""}`.toLowerCase();
  const dueTime = task.end_datetime ? new Date(task.end_datetime).getTime() : null;
  const hoursToDue = dueTime ? (dueTime - Date.now()) / 36e5 : null;
  let score = scoreTaskRisk(task, assignmentCount);

  if (/(urgent|vip|customer|escalation|premium|audit|closing|support)/i.test(text)) score += 22;
  if (hoursToDue != null && hoursToDue <= 24) score += 18;
  if (task.status === "Open") score += 8;

  const boundedScore = Math.min(100, score);
  if (boundedScore >= 76) return "Urgent";
  if (boundedScore >= 52) return "High";
  if (boundedScore >= 28) return "Medium";
  return "Low";
}

export default function TaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyTask);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isTaskOverlayOpen, setIsTaskOverlayOpen] = useState(false);
  const [assignmentTaskId, setAssignmentTaskId] = useState("");
  const [assigningEmployeeId, setAssigningEmployeeId] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  const [taskColors, setTaskColors] = useState({});
  const [workspaces, setWorkspaces] = useState(defaultWorkspaces);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(defaultWorkspaces[0].workspace_id);
  const [workspaceDraft, setWorkspaceDraft] = useState("");
  const [isWorkspaceDetailsOpen, setIsWorkspaceDetailsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isWorkspaceSidebarCollapsed, setIsWorkspaceSidebarCollapsed] = useState(false);
  const [openWorkspaceMenuId, setOpenWorkspaceMenuId] = useState("");
  const [isOptimusOpen, setIsOptimusOpen] = useState(false);
  const [selectedOptimusTaskId, setSelectedOptimusTaskId] = useState("");
  const [optimusResult, setOptimusResult] = useState(null);
  const [optimusError, setOptimusError] = useState("");
  const [isOptimusLoading, setIsOptimusLoading] = useState(false);

  const currentWorkspace =
    workspaces.find((workspace) => workspace.workspace_id === selectedWorkspaceId) ?? workspaces[0];

  const assignmentCounts = useMemo(() => {
    const counts = new Map();

    assignments.forEach((assignment) => {
      const taskId = getAssignmentTaskId(assignment);
      if (taskId == null) return;
      counts.set(String(taskId), (counts.get(String(taskId)) ?? 0) + 1);
    });

    return counts;
  }, [assignments]);

  const activeTasks = useMemo(() => tasks.filter(isActiveTask), [tasks]);
  const selectedAssignmentTask =
    tasks.find((task) => String(task.task_id) === String(assignmentTaskId)) ?? null;

  async function authHeaders() {
    return getAuthHeaders();
  }

  async function loadWorkspace() {
    try {
      setError("");
      const headers = await authHeaders();
      const [tasksResponse, assignmentsResponse, employeesResponse] = await Promise.all([
        fetch("/api/tasks", { headers }),
        fetch("/api/task-assignments", { headers }),
        fetch("/api/employees", { headers }),
      ]);
      const [tasksResult, assignmentsResult, employeesResult] = await Promise.all([
        tasksResponse.json(),
        assignmentsResponse.json(),
        employeesResponse.json(),
      ]);

      if (!tasksResponse.ok) {
        throw new Error(tasksResult.error || "Could not load tasks.");
      }

      if (!assignmentsResponse.ok) {
        throw new Error(assignmentsResult.error || "Could not load task assignments.");
      }

      if (!employeesResponse.ok) {
        throw new Error(employeesResult.error || "Could not load employees.");
      }

      setTasks(tasksResult.tasks ?? []);
      setAssignments(assignmentsResult.assignments ?? []);
      setEmployees(employeesResult.employees ?? []);
      setSelectedOptimusTaskId((current) => current || tasksResult.tasks?.[0]?.task_id || "");
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

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function getTaskColor(taskId, index = 0) {
    return taskColors[String(taskId)] ?? taskColorPalette[index % taskColorPalette.length];
  }

  function updateTaskColor(taskId, color) {
    setTaskColors((current) => ({ ...current, [String(taskId)]: color }));
  }

  function toggleTaskSelection(taskId, fallbackColor) {
    setTaskColors((current) =>
      current[String(taskId)] ? current : { ...current, [String(taskId)]: fallbackColor },
    );
    setSelectedTaskIds((current) => {
      const next = new Set(current);

      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }

      return next;
    });
  }

  function startNewTask() {
    setForm(emptyTask);
    setIsTaskOverlayOpen(true);
  }

  function editTask(task) {
    setForm({
      taskId: task.task_id,
      title: task.title ?? "",
      description: task.description ?? "",
      status: task.status ?? "Open",
      priority: getPriority(task, assignmentCounts.get(String(task.task_id)) ?? 0),
      assignedTo: "",
      startDatetime: toInputDateTime(task.start_datetime),
      endDatetime: toInputDateTime(task.end_datetime),
    });
    setIsTaskOverlayOpen(true);
  }

  function cancelTaskForm() {
    setForm(emptyTask);
    setIsTaskOverlayOpen(false);
  }

  function createWorkspace() {
    const nextName = cleanText(workspaceDraft);

    if (!nextName) {
      setMessage("Enter a workspace name first.");
      return;
    }

    const workspace = {
      workspace_id: `local-${Date.now()}`,
      workspace_name: nextName,
      created_by_name: "optima_manager",
      created_at: new Date().toISOString(),
      link_access: "Private",
    };

    setWorkspaces((current) => [...current, workspace]);
    setSelectedWorkspaceId(workspace.workspace_id);
    setWorkspaceDraft("");
    setMessage("Workspace created for this session.");
  }

  function updateWorkspaceName(value) {
    setWorkspaces((current) =>
      current.map((workspace) =>
        workspace.workspace_id === selectedWorkspaceId
          ? { ...workspace, workspace_name: cleanText(value) || workspace.workspace_name }
          : workspace,
      ),
    );
    setIsWorkspaceDetailsOpen(false);
    setMessage("Workspace saved.");
  }

  function updateShareAccess(access) {
    setWorkspaces((current) =>
      current.map((workspace) =>
        workspace.workspace_id === selectedWorkspaceId
          ? { ...workspace, link_access: access }
          : workspace,
      ),
    );
  }

  function updateWorkspaceVisibility(workspaceId, visibility) {
    setWorkspaces((current) =>
      current.map((workspace) =>
        workspace.workspace_id === workspaceId
          ? { ...workspace, link_access: visibility }
          : workspace,
      ),
    );
    setOpenWorkspaceMenuId("");
    setMessage(`Workspace changed to ${visibility.toLowerCase()}.`);
  }

  function renameWorkspace(workspaceId) {
    setSelectedWorkspaceId(workspaceId);
    setIsWorkspaceDetailsOpen(true);
    setOpenWorkspaceMenuId("");
  }

  function toggleFavouriteWorkspace(workspaceId) {
    setWorkspaces((current) =>
      current.map((workspace) =>
        workspace.workspace_id === workspaceId
          ? { ...workspace, is_favourite: !workspace.is_favourite }
          : workspace,
      ),
    );
    setOpenWorkspaceMenuId("");
  }

  function duplicateWorkspace(workspaceId) {
    const source = workspaces.find((workspace) => workspace.workspace_id === workspaceId);
    if (!source) return;

    const duplicate = {
      ...source,
      workspace_id: `local-copy-${source.workspace_id}-${workspaces.length + 1}`,
      workspace_name: `${source.workspace_name} Copy`,
      is_favourite: false,
    };

    setWorkspaces((current) => [...current, duplicate]);
    setSelectedWorkspaceId(duplicate.workspace_id);
    setOpenWorkspaceMenuId("");
    setMessage("Workspace duplicated.");
  }

  function archiveWorkspace(workspaceId) {
    const visibleWorkspaces = workspaces.filter((workspace) => workspace.workspace_id !== workspaceId);

    if (visibleWorkspaces.length === 0) {
      setMessage("Keep at least one workspace available.");
      setOpenWorkspaceMenuId("");
      return;
    }

    setWorkspaces(visibleWorkspaces);
    if (selectedWorkspaceId === workspaceId) {
      setSelectedWorkspaceId(visibleWorkspaces[0].workspace_id);
    }
    setOpenWorkspaceMenuId("");
    setMessage("Workspace archived.");
  }

  function deleteWorkspace(workspaceId) {
    const nextWorkspaces = workspaces.filter((workspace) => workspace.workspace_id !== workspaceId);

    if (nextWorkspaces.length === 0) {
      setMessage("Keep at least one workspace available.");
      setOpenWorkspaceMenuId("");
      return;
    }

    setWorkspaces(nextWorkspaces);
    if (selectedWorkspaceId === workspaceId) {
      setSelectedWorkspaceId(nextWorkspaces[0].workspace_id);
    }
    setOpenWorkspaceMenuId("");
    setMessage("Workspace deleted.");
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
      setIsTaskOverlayOpen(false);
      await loadWorkspace();
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  async function updateTaskStatus(task, status) {
    await updateTask(task, { status });
  }

  async function updateTask(task, values) {
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          taskId: task.task_id,
          title: values.title ?? task.title,
          description: values.description ?? task.description,
          status: values.status ?? task.status,
          startDatetime: values.startDatetime ?? task.start_datetime,
          endDatetime: values.endDatetime ?? task.end_datetime,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update task.");
      }

      setMessage("Task updated.");
      await loadWorkspace();
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  async function deleteTask(taskId) {
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/tasks?taskId=${taskId}`, {
        method: "DELETE",
        headers: await authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not delete task.");
      }

      setSelectedTaskIds((current) => {
        const next = new Set(current);
        next.delete(taskId);
        return next;
      });
      setMessage("Task deleted.");
      await loadWorkspace();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function runOptimusAction(action) {
    setIsOptimusLoading(true);
    setOptimusError("");
    setOptimusResult(null);

    try {
      const response = await fetch("/api/optimus-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ action }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Optimus AI could not complete this action.");
      }

      setOptimusResult({ type: action, ...result });
    } catch (actionError) {
      setOptimusError(actionError.message);
    } finally {
      setIsOptimusLoading(false);
    }
  }

  async function previewOptimusRecommendation() {
    if (!selectedOptimusTaskId) {
      setOptimusError("Select a task first.");
      return;
    }

    setIsOptimusLoading(true);
    setOptimusError("");
    setOptimusResult(null);

    try {
      const response = await fetch(`/api/allocation-recommendations?taskId=${selectedOptimusTaskId}`, {
        headers: await authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not preview recommendation.");
      }

      setOptimusResult({ type: "recommendation", ...result });
    } catch (previewError) {
      setOptimusError(previewError.message);
    } finally {
      setIsOptimusLoading(false);
    }
  }

  async function autoAssignOptimusTask() {
    if (!selectedOptimusTaskId) {
      setOptimusError("Select a task first.");
      return;
    }

    setIsOptimusLoading(true);
    setOptimusError("");
    setOptimusResult(null);

    try {
      const response = await fetch("/api/task-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ taskId: selectedOptimusTaskId, mode: "auto" }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not auto assign this task.");
      }

      setOptimusResult({
        type: "auto",
        title: "Auto assignment complete",
        message: `${getDisplayName(result.employee)} was assigned to ${tasks.find((task) => String(task.task_id) === String(selectedOptimusTaskId))?.title ?? "the selected task"}.`,
        items: result.recommendation?.recommendation?.rationale?.map((item) => ({ label: "Reason", value: item })) ?? [],
      });
      await loadWorkspace();
    } catch (assignError) {
      setOptimusError(assignError.message);
    } finally {
      setIsOptimusLoading(false);
    }
  }

  async function assignWorkspaceTask(employee) {
    if (!selectedAssignmentTask) return;

    try {
      setAssigningEmployeeId(employee.user_id);
      setAssignmentError("");
      const response = await fetch("/api/task-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ taskId: selectedAssignmentTask.task_id, userId: employee.user_id }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not assign this task.");
      }

      setMessage(`${selectedAssignmentTask.title} assigned to ${getDisplayName(employee)}.`);
      await loadWorkspace();
    } catch (assignError) {
      setAssignmentError(assignError.message);
    } finally {
      setAssigningEmployeeId("");
    }
  }

  return (
    <section
      className={`manager-workspace-reference workspace-reference-shell ${
        isWorkspaceSidebarCollapsed ? "is-sidebar-collapsed" : ""
      }`}
    >
      <aside
        className={`workspace-reference-sidebar ${
          isWorkspaceSidebarCollapsed ? "is-collapsed" : ""
        }`}
      >
        <div className="workspace-reference-sidebar-head">
          <h2>Workspace</h2>
          <button
            type="button"
            onClick={() => setIsWorkspaceSidebarCollapsed((current) => !current)}
            aria-label="Toggle workspace sidebar"
          >
            {isWorkspaceSidebarCollapsed ? "▷" : "◁"}
          </button>
        </div>

        <div className="workspace-reference-create">
          <input
            value={workspaceDraft}
            onChange={(event) => setWorkspaceDraft(event.target.value)}
            placeholder="Create workspace"
          />
          <button type="button" onClick={createWorkspace}>
            Add
          </button>
        </div>

        <div className="workspace-reference-list" aria-label="Workspace list">
          {workspaces.map((workspace) => (
            <div
              key={workspace.workspace_id}
              className={`workspace-reference-item ${
                workspace.workspace_id === selectedWorkspaceId ? "is-active" : ""
              }`}
            >
              <button
                type="button"
                className="workspace-reference-item-main"
                onClick={() => {
                  setSelectedWorkspaceId(workspace.workspace_id);
                  setOpenWorkspaceMenuId("");
                }}
              >
                <span className="workspace-reference-square" aria-hidden="true" />
                <span>{workspace.workspace_name}</span>
                {workspace.is_favourite ? <em aria-label="Favourite workspace">★</em> : null}
              </button>
              <button
                type="button"
                className="workspace-reference-menu-trigger"
                onClick={() =>
                  setOpenWorkspaceMenuId((current) =>
                    current === workspace.workspace_id ? "" : workspace.workspace_id,
                  )
                }
                aria-label={`Open ${workspace.workspace_name} menu`}
              >
                ...
              </button>
              {openWorkspaceMenuId === workspace.workspace_id ? (
                <WorkspaceSidebarMenu
                  workspace={workspace}
                  onArchive={() => archiveWorkspace(workspace.workspace_id)}
                  onDelete={() => deleteWorkspace(workspace.workspace_id)}
                  onDuplicate={() => duplicateWorkspace(workspace.workspace_id)}
                  onRename={() => renameWorkspace(workspace.workspace_id)}
                  onToggleFavourite={() => toggleFavouriteWorkspace(workspace.workspace_id)}
                  onVisibilityChange={(visibility) =>
                    updateWorkspaceVisibility(workspace.workspace_id, visibility)
                  }
                />
              ) : null}
            </div>
          ))}
        </div>
      </aside>

      <div className="workspace-reference-main">
        {error ? <p className="manager-workspace-alert is-error">{error}</p> : null}
        {message ? <p className="manager-workspace-alert is-info">{message}</p> : null}

        <header className="workspace-reference-titlebar">
          <button
            type="button"
            className="workspace-reference-title"
            onClick={() => setIsWorkspaceDetailsOpen(true)}
          >
            {currentWorkspace?.workspace_name ?? "Blank workspace"} <span>⌄</span>
          </button>
        </header>

        <div className="workspace-reference-board-head">
          <div className="manager-group-heading reference-group-heading">
            <span aria-hidden="true">⌄</span>
            <h2>To-Do</h2>
            <span className="manager-group-count">{selectedTaskIds.size}</span>
          </div>

          <div className="workspace-reference-actions">
            <button
              type="button"
              className="workspace-reference-button"
              onClick={() => setIsOptimusOpen(true)}
            >
              Optimus AI
            </button>
            <div className="workspace-share-anchor">
              <button
                type="button"
                className="workspace-reference-button"
                onClick={() => setIsShareOpen((current) => !current)}
              >
                Share
              </button>
              {isShareOpen ? (
                <WorkspaceShareMenu
                  workspace={currentWorkspace}
                  onAccessChange={updateShareAccess}
                  onClose={() => setIsShareOpen(false)}
                />
              ) : null}
            </div>
            <button type="button" className="workspace-reference-primary" onClick={startNewTask}>
              Add Task
            </button>
          </div>
        </div>

        <div className="manager-table-scroll reference-table-scroll">
          <div className="manager-task-grid manager-task-grid-header">
            <span />
            <span />
            <span>Task</span>
            <span>Owner</span>
            <span>Assigned to</span>
            <span>Status</span>
            <span>Priority</span>
            <span>Due Date</span>
            <span>Timeline</span>
            <span>Comments</span>
            <span>Actions</span>
          </div>

          {activeTasks.length ? (
            activeTasks.map((task, index) => {
              const assignmentCount = assignmentCounts.get(String(task.task_id)) ?? 0;
              const taskAssignments = assignments.filter(
                (assignment) => String(getAssignmentTaskId(assignment)) === String(task.task_id),
              );
              const priority = getPriority(task, assignmentCount);
              const isSelected = selectedTaskIds.has(task.task_id);
              const taskColor = getTaskColor(task.task_id, index);

              return (
                <article
                  key={task.task_id}
                  className={`manager-task-grid manager-task-grid-row ${isSelected ? "is-selected" : ""}`}
                  style={isSelected ? { "--task-color": taskColor } : undefined}
                >
                  <span className="manager-row-handle">⋮⋮</span>
                  <span className="manager-row-check">
                    <button
                      type="button"
                      className={`manager-task-color-square ${isSelected ? "is-selected" : ""}`}
                      style={{ "--task-color": taskColor }}
                      onClick={() => toggleTaskSelection(task.task_id, taskColor)}
                      aria-pressed={isSelected}
                      aria-label={`Select ${task.title}`}
                    />
                    {isSelected ? (
                      <input
                        type="color"
                        value={taskColor}
                        onChange={(event) => updateTaskColor(task.task_id, event.target.value)}
                        className="manager-task-color-picker"
                        aria-label={`Set ${task.title} color`}
                      />
                    ) : null}
                  </span>
                  <button type="button" className="manager-task-name" onClick={() => editTask(task)}>
                    <strong>{task.title}</strong>
                    <small>{task.description || "No description provided."}</small>
                  </button>
                  <span className="manager-table-muted">Owner</span>
                  <button
                    type="button"
                    className="manager-assignee-pill"
                    onClick={() => {
                      setAssignmentTaskId(String(task.task_id));
                      setAssignmentError("");
                    }}
                    aria-label={`Assign employees to ${task.title}`}
                    title={
                      taskAssignments.length
                        ? taskAssignments.map((assignment) => getDisplayName(assignment.user)).join(", ")
                        : "Assign employees"
                    }
                  >
                    <span>{assignmentCount || "+"}</span>
                    {assignmentCount ? `${assignmentCount} assigned` : "Assign"}
                  </button>
                  <span>
                    <select
                      value={task.status || "Open"}
                      onChange={(event) => updateTaskStatus(task, event.target.value)}
                      className="manager-status-select"
                      style={statusStyles[task.status || "Open"] ?? statusStyles.Open}
                    >
                      {statusOptions.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </span>
                  <span className={`manager-priority-pill is-${priority.toLowerCase()}`}>
                    {priority}
                  </span>
                  <span className="manager-table-muted">{formatDate(task.end_datetime)}</span>
                  <span className="manager-table-muted">
                    {task.start_datetime ? formatDate(task.start_datetime) : "-"}
                  </span>
                  <span className="manager-table-muted">Open comments</span>
                  <span className="manager-row-actions">
                    <button type="button" onClick={() => editTask(task)}>
                      Update
                    </button>
                    <button type="button" onClick={() => deleteTask(task.task_id)}>
                      Delete
                    </button>
                  </span>
                </article>
              );
            })
          ) : (
            <div className="manager-empty-row">Blank workspace ready. Add your first task.</div>
          )}

          <button type="button" className="manager-add-row" onClick={startNewTask}>
            + Add task
          </button>
        </div>
      </div>

      {isWorkspaceDetailsOpen ? (
        <WorkspaceDetailsModal
          workspace={currentWorkspace}
          onClose={() => setIsWorkspaceDetailsOpen(false)}
          onSave={updateWorkspaceName}
        />
      ) : null}

      {isTaskOverlayOpen ? (
        <TaskCreationOverlay
          employees={employees}
          form={form}
          workspace={currentWorkspace}
          onCancel={cancelTaskForm}
          onSave={saveTask}
          onUpdateField={updateField}
        />
      ) : null}

      {isOptimusOpen ? (
        <OptimusWorkspaceModal
          isLoading={isOptimusLoading}
          result={optimusResult}
          error={optimusError}
          selectedTaskId={selectedOptimusTaskId}
          tasks={activeTasks}
          onAutoAssign={autoAssignOptimusTask}
          onClose={() => setIsOptimusOpen(false)}
          onPreviewRecommendation={previewOptimusRecommendation}
          onRunAction={runOptimusAction}
          onSelectTask={setSelectedOptimusTaskId}
        />
      ) : null}

      {selectedAssignmentTask ? (
        <WorkspaceAssignmentModal
          assignments={assignments.filter(
            (assignment) => String(getAssignmentTaskId(assignment)) === String(selectedAssignmentTask.task_id),
          )}
          assigningEmployeeId={assigningEmployeeId}
          employees={employees}
          error={assignmentError}
          task={selectedAssignmentTask}
          onAssign={assignWorkspaceTask}
          onClose={() => {
            setAssignmentTaskId("");
            setAssignmentError("");
          }}
        />
      ) : null}
    </section>
  );
}

function WorkspaceDetailsModal({ workspace, onClose, onSave }) {
  const [draftName, setDraftName] = useState(workspace?.workspace_name ?? "Blank workspace");

  return (
    <div className="workspace-details-layer">
      <div className="workspace-details-panel" role="dialog" aria-modal="true">
        <div className="workspace-details-header">
          <input
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            aria-label="Workspace name"
          />
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="workspace-details-content">
          <h3>Workspace info</h3>
          <dl>
            <div>
              <dt>Created by</dt>
              <dd>{workspace?.created_by_name ?? "optima_manager"}</dd>
            </div>
            <div>
              <dt>Created at</dt>
              <dd>{formatWorkspaceDate(workspace?.created_at)}</dd>
            </div>
          </dl>
          <button type="button" onClick={() => onSave(draftName)}>
            Save workspace
          </button>
        </div>
      </div>
      <button
        type="button"
        className="workspace-details-backdrop"
        onClick={onClose}
        aria-label="Close workspace details"
      />
    </div>
  );
}

function WorkspaceAssignmentModal({ assignments, assigningEmployeeId, employees, error, task, onAssign, onClose }) {
  const assignedUserIds = new Set(assignments.map(getAssignmentUserId).filter(Boolean).map(String));
  const activeEmployees = employees.filter((employee) => employee.account_status === "Active");

  return (
    <div className="workspace-assignment-layer">
      <div className="workspace-assignment-panel" role="dialog" aria-modal="true" aria-labelledby="assignment-title">
        <div className="workspace-assignment-header">
          <div>
            <p>Assign employees</p>
            <h2 id="assignment-title">{task.title}</h2>
            <span>{task.description || "Choose an eligible employee for this task."}</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close assignment panel">
            ×
          </button>
        </div>

        <div className="workspace-assignment-current">
          <h3>Current assignees</h3>
          {assignments.length ? (
            <div>
              {assignments.map((assignment) => (
                <span key={assignment.assignment_id ?? getAssignmentUserId(assignment)}>
                  {getDisplayName(assignment.user)}
                </span>
              ))}
            </div>
          ) : (
            <p>No employee is assigned yet.</p>
          )}
        </div>

        {error ? <p className="workspace-assignment-error">{error}</p> : null}

        <div className="workspace-assignment-list">
          {activeEmployees.map((employee) => {
            const assigned = assignedUserIds.has(String(employee.user_id));
            return (
              <button
                key={employee.user_id}
                type="button"
                disabled={assigned || assigningEmployeeId === employee.user_id}
                onClick={() => onAssign(employee)}
              >
                <span>
                  <strong>{getDisplayName(employee)}</strong>
                  <small>{employee.email}</small>
                </span>
                <em>
                  {assigned
                    ? "Assigned"
                    : assigningEmployeeId === employee.user_id
                      ? "Assigning..."
                      : "Assign"}
                </em>
              </button>
            );
          })}
        </div>
      </div>
      <button type="button" className="workspace-assignment-backdrop" onClick={onClose} aria-label="Close assignment panel" />
    </div>
  );
}

function WorkspaceSidebarMenu({
  workspace,
  onArchive,
  onDelete,
  onDuplicate,
  onRename,
  onToggleFavourite,
  onVisibilityChange,
}) {
  const isPublic = workspace?.link_access !== "Private";

  return (
    <div className="workspace-sidebar-menu" role="menu">
      <button type="button" onClick={onRename} role="menuitem">
        Rename
      </button>
      <div className="workspace-sidebar-menu-section">
        <p>Change visibility</p>
        <button type="button" onClick={() => onVisibilityChange("Private")} role="menuitem">
          <span>Change to private</span>
          {!isPublic ? <strong>✓</strong> : null}
        </button>
        <button type="button" onClick={() => onVisibilityChange("View")} role="menuitem">
          <span>Change to public</span>
          {isPublic ? <strong>✓</strong> : null}
        </button>
      </div>
      <button type="button" onClick={onToggleFavourite} role="menuitem">
        {workspace?.is_favourite ? "Remove from favourites" : "Add to favourites"}
      </button>
      <button type="button" onClick={onDuplicate} role="menuitem">
        Duplicate
      </button>
      <button type="button" onClick={onArchive} role="menuitem">
        Archive
      </button>
      <button type="button" onClick={onDelete} className="is-danger" role="menuitem">
        Delete
      </button>
    </div>
  );
}

function WorkspaceShareMenu({ workspace, onAccessChange, onClose }) {
  const [copied, setCopied] = useState(false);
  const linkAccess = workspace?.link_access ?? "Private";
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/workspace/${workspace?.workspace_id ?? "blank"}`
      : "";

  async function copyShareLink() {
    if (!shareUrl || typeof navigator === "undefined") return;

    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="workspace-share-menu">
      <div>
        <p>Share workspace</p>
        <h3>{workspace?.workspace_name ?? "Workspace"}</h3>
      </div>

      <div className="workspace-share-options">
        {["Private", "View", "Edit"].map((access) => (
          <button
            key={access}
            type="button"
            onClick={() => onAccessChange(access)}
            className={linkAccess === access ? "is-active" : ""}
          >
            <span>
              {access}
              <small>
                {access === "Private"
                  ? "Only invited workspace members can open it."
                  : access === "View"
                    ? "Anyone with the link can view."
                    : "Anyone with the link can edit."}
              </small>
            </span>
            {linkAccess === access ? <strong>✓</strong> : null}
          </button>
        ))}
      </div>

      <div className="workspace-share-link">
        <label htmlFor="workspace-share-link">Share link</label>
        <div>
          <input id="workspace-share-link" readOnly value={shareUrl} />
          <button type="button" onClick={copyShareLink}>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <button
        type="button"
        className="workspace-share-close"
        onClick={onClose}
        aria-label="Close share menu"
      />
    </div>
  );
}

function formatOptimusResult(result) {
  if (!result) return null;

  if (result.type === "recommendation") {
    const best = result.bestMatch;
    const taskTitle = result.task?.title ?? "selected task";
    const candidateCount = result.recommendations?.length ?? 0;
    const eligibleCount =
      result.recommendations?.filter((entry) => entry.evaluation?.eligible !== false).length ?? 0;

    return {
      title: "Best match recommendation",
      message: best
        ? `${getDisplayName(best.employee)} is recommended for ${taskTitle}.`
        : `No recommended employee was found for ${taskTitle}.`,
      items: [
        { label: "Eligible employees", value: `${eligibleCount} of ${candidateCount}` },
        ...(result.recommendation?.rationale ?? []).map((item) => ({ label: "Reason", value: item })),
      ],
    };
  }

  return {
    title: result.title ?? "Optimus AI result",
    message: result.message ?? "Optimus AI completed the requested action.",
    items: result.items ?? [],
  };
}

function OptimusWorkspaceModal({
  error,
  isLoading,
  result,
  selectedTaskId,
  tasks,
  onAutoAssign,
  onClose,
  onPreviewRecommendation,
  onRunAction,
  onSelectTask,
}) {
  const formattedResult = formatOptimusResult(result);

  return (
    <div className="workspace-optimus-layer">
      <div className="workspace-optimus-panel" role="dialog" aria-modal="true" aria-labelledby="workspace-optimus-title">
        <div className="workspace-optimus-header">
          <div>
            <p>Optimus AI</p>
            <h2 id="workspace-optimus-title">AI workspace control</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close Optimus AI">
            ×
          </button>
        </div>

        <div className="workspace-optimus-task-row">
          <label htmlFor="workspace-optimus-task">Target task</label>
          <select
            id="workspace-optimus-task"
            value={selectedTaskId}
            onChange={(event) => onSelectTask(event.target.value)}
          >
            <option value="">Select task</option>
            {tasks.map((task) => (
              <option key={task.task_id} value={task.task_id}>
                {task.title}
              </option>
            ))}
          </select>
        </div>

        <div className="workspace-optimus-actions" aria-label="Optimus AI actions">
          <button type="button" onClick={onPreviewRecommendation} disabled={isLoading}>
            Preview recommendation
          </button>
          <button type="button" onClick={onAutoAssign} disabled={isLoading}>
            Auto assign
          </button>
          <button type="button" onClick={() => onRunAction("risk")} disabled={isLoading}>
            Predict workload risk
          </button>
          <button type="button" onClick={() => onRunAction("priority")} disabled={isLoading}>
            Suggest task priority
          </button>
          <button type="button" onClick={() => onRunAction("summary")} disabled={isLoading}>
            Summarize workspace
          </button>
        </div>

        <div className="workspace-optimus-result">
          {isLoading ? <p className="workspace-optimus-loading">Optimus AI is analyzing workspace data...</p> : null}
          {error ? <p className="workspace-optimus-error">{error}</p> : null}
          {!isLoading && !error && formattedResult ? (
            <div>
              <h3>{formattedResult.title}</h3>
              <p>{formattedResult.message}</p>
              {formattedResult.items.length ? (
                <dl>
                  {formattedResult.items.map((item, index) => (
                    <div key={`${item.label}-${index}`}>
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          ) : null}
          {!isLoading && !error && !formattedResult ? (
            <p className="workspace-optimus-empty">
              Select a task or choose a workspace action. Results will appear here.
            </p>
          ) : null}
        </div>
      </div>
      <button type="button" className="workspace-optimus-backdrop" onClick={onClose} aria-label="Close Optimus AI" />
    </div>
  );
}

function TaskCreationOverlay({ employees, form, workspace, onCancel, onSave, onUpdateField }) {
  return (
    <div className="workspace-task-overlay">
      <form className="workspace-task-modal" onSubmit={onSave}>
        <div className="workspace-task-tabs">
          <div>
            {["Task", "Doc", "Reminder", "Whiteboard", "Dashboard"].map((tab) => (
              <button key={tab} type="button" className={tab === "Task" ? "is-active" : ""}>
                {tab}
              </button>
            ))}
          </div>
          <button type="button" onClick={onCancel} aria-label="Close task creation">
            ×
          </button>
        </div>

        <div className="workspace-task-body">
          <div className="workspace-task-context">
            <span>{workspace?.workspace_name ?? "Blank workspace"}</span>
            <span>To-Do</span>
          </div>

          <input
            value={form.title}
            onChange={(event) => onUpdateField("title", event.target.value)}
            placeholder="Task Name"
            required
            autoFocus
            className="workspace-task-title-input"
          />

          <textarea
            value={form.description}
            onChange={(event) => onUpdateField("description", event.target.value)}
            placeholder="Add description"
            className="workspace-task-description"
          />

          <button
            type="button"
            className="workspace-task-ai"
            onClick={() =>
              onUpdateField(
                "description",
                form.description ||
                  "Optimus AI draft: define the expected outcome, required skills, availability window, and approval criteria before assignment.",
              )
            }
          >
            Write with AI
          </button>

          <div className="workspace-task-fields">
            <label>
              Status
              <select value={form.status} onChange={(event) => onUpdateField("status", event.target.value)}>
                {statusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
            <label>
              Assignee
              <select
                value={form.assignedTo}
                onChange={(event) => onUpdateField("assignedTo", event.target.value)}
              >
                <option value="">Unassigned</option>
                {employees.map((employee) => (
                  <option key={employee.user_id} value={employee.user_id}>
                    {getDisplayName(employee)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select
                value={form.priority}
                onChange={(event) => onUpdateField("priority", event.target.value)}
              >
                {priorityOptions.map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
            </label>
            <label>
              Due date
              <input
                type="datetime-local"
                value={form.endDatetime}
                onChange={(event) => onUpdateField("endDatetime", event.target.value)}
              />
            </label>
          </div>

          <div className="workspace-task-fields is-secondary">
            <label>
              Timeline start
              <input
                type="datetime-local"
                value={form.startDatetime}
                onChange={(event) => onUpdateField("startDatetime", event.target.value)}
              />
            </label>
            <div className="workspace-task-field-button">
              <span>Fields</span>
              <button type="button">+ Create new field</button>
            </div>
          </div>
        </div>

        <div className="workspace-task-footer">
          <button type="button">Templates</button>
          <div>
            <button type="submit">{form.taskId ? "Update Task" : "Create Task"}</button>
            <button type="button" aria-label="More create options">
              ⌄
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
