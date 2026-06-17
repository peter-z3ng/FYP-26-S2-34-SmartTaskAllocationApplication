"use client";

import { useEffect, useMemo, useState } from "react";
import BorderGlow from "@/components/BorderGlow";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Radar } from "@/components/ui/radar-effect";

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

const defaultColumns = [
  "Task",
  "Owner",
  "Assigned to",
  "Status",
  "Priority",
  "Due Date",
  "Timeline",
  "Comments",
  "Files",
  "Last updated",
];

const groupColors = ["#579BFC", "#00C875", "#FDAB3D", "#DF2F4A", "#A855F7"];

const statusStyles = {
  Open: "bg-[#579BFC] text-white",
  "In Progress": "bg-[#FDAB3D] text-white",
  Completed: "bg-[#00C875] text-white",
  Cancelled: "bg-[#DF2F4A] text-white",
};

export default function WorkspaceManagement() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyTask);
  const [error, setError] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isTaskOverlayOpen, setIsTaskOverlayOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [openWorkspaceMenuId, setOpenWorkspaceMenuId] = useState("");
  const [favoriteWorkspaceIds, setFavoriteWorkspaceIds] = useState(new Set());
  const [isWorkspaceSidebarCollapsed, setIsWorkspaceSidebarCollapsed] = useState(false);
  const [isWorkspaceDetailsOpen, setIsWorkspaceDetailsOpen] = useState(false);
  const [workspaceEditName, setWorkspaceEditName] = useState("");
  const [groups, setGroups] = useState([]);
  const [groupColorById, setGroupColorById] = useState({});
  const [targetGroupId, setTargetGroupId] = useState(null);
  const [columns, setColumns] = useState(defaultColumns);
  const [isOptimusOpen, setIsOptimusOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [autoAssignView, setAutoAssignView] = useState("closed");

  // Optimus AI auto-assign: scan → results (workspace-level, shown once).
  useEffect(() => {
    if (autoAssignView !== "scanning") return undefined;
    const timer = window.setTimeout(() => setAutoAssignView("results"), 5000);
    return () => window.clearTimeout(timer);
  }, [autoAssignView]);

  // Open the Optimus assistant when triggered from the top search bar.
  useEffect(() => {
    function handleSearchAction(event) {
      const detail = event.detail ?? {};
      if (detail.actor !== "manager" || detail.actionId !== "open-optimus-ai") return;
      window.sessionStorage.removeItem("optima:pending-search-action");
      setIsOptimusOpen(true);
    }
    window.addEventListener("optima:search-action", handleSearchAction);
    const pending = window.sessionStorage.getItem("optima:pending-search-action");
    if (pending) {
      try {
        const detail = JSON.parse(pending);
        if (detail.actor === "manager" && detail.actionId === "open-optimus-ai") {
          window.sessionStorage.removeItem("optima:pending-search-action");
          window.setTimeout(() => setIsOptimusOpen(true), 0);
        }
      } catch {
        window.sessionStorage.removeItem("optima:pending-search-action");
      }
    }
    return () => window.removeEventListener("optima:search-action", handleSearchAction);
  }, []);

  function startAutoAssignScan() {
    setIsOptimusOpen(false);
    setAutoAssignView("scanning");
  }

  const currentWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.workspace_id === selectedWorkspaceId),
    [selectedWorkspaceId, workspaces]
  );
  async function authHeaders() {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    return {
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
    };
  }

  async function loadTasks(workspaceId = selectedWorkspaceId) {
    try {
      if (!workspaceId) {
        setTasks([]);
        return;
      }

      const response = await fetch(`/api/tasks?workspaceId=${workspaceId}`, {
        headers: await authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load tasks.");
      }

      setTasks(result.tasks);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  async function loadGroups(workspaceId = selectedWorkspaceId) {
    try {
      if (!workspaceId) {
        setGroups([]);
        return;
      }

      const response = await fetch(`/api/task-groups?workspaceId=${workspaceId}`, {
        headers: await authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load task groups.");
      }

      // Every workspace starts with a default "To-Do" group.
      if (!result.groups.length) {
        const created = await createGroup(workspaceId, "To-Do");
        setGroups(created ? [created] : []);
        return;
      }

      setGroups(result.groups);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  async function createGroup(workspaceId, groupName) {
    const response = await fetch("/api/task-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ workspaceId, groupName }),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Could not create task group.");
    }

    return result.group;
  }

  async function addGroup() {
    if (!selectedWorkspaceId) {
      return;
    }

    setError("");
    try {
      const created = await createGroup(selectedWorkspaceId, "New Group");
      if (created) {
        setGroups((current) => [...current, created]);
      }
    } catch (groupError) {
      setError(groupError.message);
    }
  }

  async function renameGroup(groupId, groupName) {
    setGroups((current) =>
      current.map((group) =>
        group.group_id === groupId ? { ...group, group_name: groupName } : group,
      ),
    );

    try {
      await fetch("/api/task-groups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ groupId, groupName }),
      });
    } catch (groupError) {
      setError(groupError.message);
    }
  }

  async function deleteGroup(groupId) {
    if (groups.length <= 1) {
      setError("A workspace must keep at least one group.");
      return;
    }
    if (!window.confirm("Delete this group? Its tasks move to the first group.")) {
      return;
    }

    setError("");
    try {
      const response = await fetch(`/api/task-groups?groupId=${groupId}`, {
        method: "DELETE",
        headers: await authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not delete group.");
      }

      setGroups((current) => current.filter((group) => group.group_id !== groupId));
      await loadTasks();
    } catch (groupError) {
      setError(groupError.message);
    }
  }

  async function moveTaskToGroup(taskId, groupId) {
    // Optimistic: reflect the move immediately, then persist.
    setTasks((current) =>
      current.map((task) => (task.task_id === taskId ? { ...task, group_id: groupId } : task)),
    );

    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ action: "move", taskId, groupId }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not move task.");
      }
    } catch (moveError) {
      setError(moveError.message);
      await loadTasks();
    }
  }

  async function loadWorkspaces() {
    try {
      const response = await fetch("/api/workspaces", { headers: await authHeaders() });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load workspaces.");
      }

      setWorkspaces(result.workspaces);
      setSelectedWorkspaceId((current) => current || result.workspaces[0]?.workspace_id || "");
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  async function loadEmployees() {
    try {
      const response = await fetch("/api/employees", { headers: await authHeaders() });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load employees.");
      }

      setEmployees(result.employees ?? []);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadWorkspaces();
      loadEmployees();
    }, 0);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (selectedWorkspaceId) {
        loadTasks(selectedWorkspaceId);
        loadGroups(selectedWorkspaceId);
      } else {
        setTasks([]);
        setGroups([]);
      }
    }, 0);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkspaceId]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openWorkspaceDetails() {
    setWorkspaceEditName(currentWorkspace?.workspace_name ?? "");
    setIsWorkspaceDetailsOpen(true);
  }

  function toggleWorkspaceFavorite(workspaceId) {
    setFavoriteWorkspaceIds((current) => {
      const next = new Set(current);

      if (next.has(workspaceId)) {
        next.delete(workspaceId);
      } else {
        next.add(workspaceId);
      }

      return next;
    });
  }

  async function updateWorkspaceName(event) {
    event.preventDefault();
    const nextName = workspaceEditName.trim();

    if (!currentWorkspace || !nextName) {
      return;
    }

    setError("");

    try {
      const response = await fetch("/api/workspaces", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          workspaceId: currentWorkspace.workspace_id,
          workspaceName: nextName,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update workspace.");
      }

      setWorkspaces((current) =>
        current.map((workspace) =>
          workspace.workspace_id === currentWorkspace.workspace_id
            ? { ...workspace, workspace_name: nextName }
            : workspace
        )
      );
      setIsWorkspaceDetailsOpen(false);
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  async function updateWorkspace(workspaceId, values) {
    setError("");

    try {
      const response = await fetch("/api/workspaces", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ workspaceId, ...values }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update workspace.");
      }

      await loadWorkspaces();
      return result.workspace ?? null;
    } catch (updateError) {
      setError(updateError.message);
      return null;
    }
  }

  async function renameWorkspaceFromMenu(workspace) {
    const nextName = window.prompt("Rename workspace", workspace.workspace_name);

    if (!nextName?.trim()) {
      return;
    }

    await updateWorkspace(workspace.workspace_id, { workspaceName: nextName });
  }

  async function duplicateWorkspace(workspace) {
    await createWorkspaceWithName(`${workspace.workspace_name} copy`);
  }

  async function deleteWorkspace(workspace) {
    if (!window.confirm(`Delete ${workspace.workspace_name}?`)) {
      return;
    }

    setError("");

    try {
      const response = await fetch(`/api/workspaces?workspaceId=${workspace.workspace_id}`, {
        method: "DELETE",
        headers: await authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not delete workspace.");
      }

      setWorkspaces((current) =>
        current.filter((currentWorkspace) => currentWorkspace.workspace_id !== workspace.workspace_id)
      );
      setSelectedWorkspaceId((current) =>
        current === workspace.workspace_id
          ? workspaces.find((candidate) => candidate.workspace_id !== workspace.workspace_id)
              ?.workspace_id ?? ""
          : current
      );
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function createWorkspace(event) {
    event.preventDefault();
    await createWorkspaceWithName(workspaceName);
  }

  async function createWorkspaceWithName(name) {
    const nextName = name.trim();

    if (!nextName) {
      return;
    }

    setError("");

    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ workspaceName: nextName }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not create workspace.");
      }

      setWorkspaceName("");
      setWorkspaces((current) => [...current, result.workspace]);
      setSelectedWorkspaceId(result.workspace.workspace_id);
      await loadWorkspaces();
    } catch (createError) {
      setError(createError.message);
    }
  }

  async function saveTask(event) {
    event.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/tasks", {
        method: form.taskId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ ...form, workspaceId: selectedWorkspaceId, groupId: targetGroupId }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not save task.");
      }

      setForm(emptyTask);
      setIsAddingTask(false);
      setIsTaskOverlayOpen(false);
      await loadTasks();
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  async function updateTask(task, changes) {
    setError("");

    try {
      const nextTask = {
        title: task.title ?? "",
        description: task.description ?? "",
        status: task.status ?? "Open",
        priority: task.priority ?? "Medium",
        assignedTo: task.assigned_to ?? "",
        startDatetime: task.start_datetime ?? "",
        endDatetime: task.end_datetime ?? "",
        ...changes,
      };
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          taskId: task.task_id,
          ...nextTask,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update task.");
      }

      await loadTasks();
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  async function updateTaskStatus(task, status) {
    await updateTask(task, { status });
  }

  async function saveTaskOrder(orderedTasks) {
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          action: "reorder",
          workspaceId: selectedWorkspaceId,
          tasks: orderedTasks.map((task, index) => ({
            taskId: task.task_id,
            sortOrder: index,
          })),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not save task order.");
      }
    } catch (orderError) {
      setError(orderError.message);
      await loadTasks();
    }
  }

  function reorderTasks(draggedTaskId, targetTaskId, dropPosition = "before") {
    if (!draggedTaskId || !targetTaskId || draggedTaskId === targetTaskId) {
      return;
    }

    let reorderedTasks = [];

    setTasks((currentTasks) => {
      const draggedIndex = currentTasks.findIndex((task) => task.task_id === draggedTaskId);
      const targetIndex = currentTasks.findIndex((task) => task.task_id === targetTaskId);

      if (draggedIndex < 0 || targetIndex < 0) {
        return currentTasks;
      }

      const nextTasks = [...currentTasks];
      const [draggedTask] = nextTasks.splice(draggedIndex, 1);
      const nextTargetIndex = nextTasks.findIndex((task) => task.task_id === targetTaskId);
      const insertIndex = dropPosition === "after" ? nextTargetIndex + 1 : nextTargetIndex;
      nextTasks.splice(insertIndex, 0, draggedTask);
      reorderedTasks = nextTasks;

      return nextTasks;
    });

    setTimeout(() => {
      if (reorderedTasks.length) {
        saveTaskOrder(reorderedTasks);
      }
    }, 0);
  }

  function startNewTask(groupId = null) {
    setForm(emptyTask);
    setTargetGroupId(groupId ?? groups[0]?.group_id ?? null);
    setIsAddingTask(false);
    setIsTaskOverlayOpen(true);
  }

  function runWorkspaceSearchAction(actionId) {
    if (actionId === "create-workspace") {
      setIsWorkspaceSidebarCollapsed(false);

      const nextName = window.prompt("Create workspace", "");

      if (nextName?.trim()) {
        createWorkspaceWithName(nextName);
      }

      return;
    }

    if (actionId === "create-workspace-item") {
      if (!currentWorkspace) {
        setError("Select or create a workspace before adding a task.");
        return;
      }

      startNewTask();
    }
  }

  useEffect(() => {
    function handleSearchAction(event) {
      const detail = event.detail ?? {};

      if (detail.actor !== "manager") {
        return;
      }

      if (!["create-workspace", "create-workspace-item"].includes(detail.actionId)) {
        return;
      }

      window.sessionStorage.removeItem("optima:pending-search-action");
      runWorkspaceSearchAction(detail.actionId);
    }

    window.addEventListener("optima:search-action", handleSearchAction);

    const pending = window.sessionStorage.getItem("optima:pending-search-action");

    if (pending) {
      try {
        const detail = JSON.parse(pending);

        if (
          detail.actor === "manager" &&
          ["create-workspace", "create-workspace-item"].includes(detail.actionId)
        ) {
          window.sessionStorage.removeItem("optima:pending-search-action");
          window.setTimeout(() => runWorkspaceSearchAction(detail.actionId), 0);
        }
      } catch {
        window.sessionStorage.removeItem("optima:pending-search-action");
      }
    }

    return () => window.removeEventListener("optima:search-action", handleSearchAction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace]);

  function toggleColumn(column) {
    if (column === "Task") {
      return;
    }

    setColumns((current) =>
      current.includes(column)
        ? current.filter((currentColumn) => currentColumn !== column)
        : defaultColumns.filter(
            (availableColumn) =>
              availableColumn === column || current.includes(availableColumn)
          )
    );
  }

  return (
    <div
      className={`grid h-full min-h-0 overflow-hidden rounded-2xl transition-[grid-template-columns] ${
        isWorkspaceSidebarCollapsed
          ? "lg:grid-cols-[40px_minmax(0,1fr)]"
          : "lg:grid-cols-[300px_minmax(0,1fr)]"
      }`}
    >
      <aside className="relative overflow-visible border-r border-white/40 px-3 py-4">
        <button
          type="button"
          onClick={() => setIsWorkspaceSidebarCollapsed((current) => !current)}
          className="absolute right-1.5 top-6.5 flex items-center justify-center font-bold text-[#1E293B] hover:text-[#1E40AF]"
          aria-label={isWorkspaceSidebarCollapsed ? "Expand workspace menu" : "Collapse workspace menu"}
          title={isWorkspaceSidebarCollapsed ? "Expand workspace menu" : "Collapse workspace menu"}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "26px" }}
            aria-hidden="true"
          >
            {isWorkspaceSidebarCollapsed ? "left_panel_open" : "left_panel_close"}
          </span>
        </button>

        {isWorkspaceSidebarCollapsed ? (
          <div className="flex h-full flex-col items-center pt-20 text-[#07183b]">
            <span className="rotate-90 whitespace-nowrap text-md font-semibold tracking-widest">
              Workspace
            </span>
          </div>
        ) : (
          <>
        <h2 className="text-lg pt-2 font-medium text-[#0D1E4C]">Workspace</h2>

        <form onSubmit={createWorkspace} className="mt-6 flex gap-2">
          <input
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
            placeholder="Create workspace"
            className="h-12 min-w-0 flex-1 rounded-md border border-white/80 px-3 text-sm text-[#2f3442] outline-none focus:border-[#0a72e8] focus:ring-2 focus:ring-[#0a72e8]/15"
          />
          <button
            type="submit"
            className="h-12 rounded-md bg-[#2563EB] px-4 text-sm font-bold text-white transition hover:bg-[#1E40AF]"
          >
            Add
          </button>
        </form>

        <div className="mt-5 space-y-2">
          {workspaces.map((workspace) => {
            const isActive = workspace.workspace_id === selectedWorkspaceId;

            return (
              <div key={workspace.workspace_id} className="relative">
                <button
                  type="button"
                  onClick={() => setSelectedWorkspaceId(workspace.workspace_id)}
                  className={`flex h-12 w-full items-center gap-3 rounded-md px-3 pr-11 text-left text-sm font-medium transition ${
                  isActive
                    ? "bg-[#cfe7ff] text-[#233246]"
                    : "text-[#667085] hover:bg-[#eef6ff] hover:text-[#233246]"
                }`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md text-xl text-[#475467]">
                    ▣
                  </span>
                  <span className="min-w-0 truncate">
                    {favoriteWorkspaceIds.has(workspace.workspace_id) ? "★ " : ""}
                    {workspace.workspace_name}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenWorkspaceMenuId((current) =>
                      current === workspace.workspace_id ? "" : workspace.workspace_id
                    );
                  }}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md text-lg font-bold text-[#667085] hover:bg-white/60"
                  aria-label={`Open ${workspace.workspace_name} menu`}
                >
                  ...
                </button>
                {openWorkspaceMenuId === workspace.workspace_id ? (
                  <WorkspaceRowMenu
                    isFavorite={favoriteWorkspaceIds.has(workspace.workspace_id)}
                    workspace={workspace}
                    onArchive={() => {
                      setOpenWorkspaceMenuId("");
                      updateWorkspace(workspace.workspace_id, { status: "Archived" });
                    }}
                    onDelete={() => {
                      setOpenWorkspaceMenuId("");
                      deleteWorkspace(workspace);
                    }}
                    onDuplicate={() => {
                      setOpenWorkspaceMenuId("");
                      duplicateWorkspace(workspace);
                    }}
                    onFavorite={() => {
                      setOpenWorkspaceMenuId("");
                      toggleWorkspaceFavorite(workspace.workspace_id);
                    }}
                    onPrivate={() => {
                      setOpenWorkspaceMenuId("");
                      updateWorkspace(workspace.workspace_id, { visibility: "Private" });
                    }}
                    onPublic={() => {
                      setOpenWorkspaceMenuId("");
                      updateWorkspace(workspace.workspace_id, { visibility: "Public" });
                    }}
                    onRename={() => {
                      setOpenWorkspaceMenuId("");
                      renameWorkspaceFromMenu(workspace);
                    }}
                  />
                ) : null}
              </div>
            );
          })}
          {!workspaces.length ? (
            <p className="rounded-md border border-dashed border-[#c4ccdc] px-3 py-4 text-sm text-[#667085]">
              Create your first workspace to begin.
            </p>
          ) : null}
        </div>
          </>
        )}
      </aside>

      <section className="flex min-h-0 min-w-0 flex-col pl-6">
        <div className="shrink-0 border-b border-[#d6deed] pr-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={openWorkspaceDetails}
              disabled={!currentWorkspace}
              className="inline-flex items-center gap-2 rounded-md text-left text-3xl font-bold text-[#2f3442] transition hover:bg-[#e8f3ff] disabled:cursor-default disabled:hover:bg-transparent"
            >
              {currentWorkspace?.workspace_name ?? "Start with a template"}
              {currentWorkspace ? <span className="text-xl text-[#667085]">⌄</span> : null}
            </button>

            {currentWorkspace ? (
              <div className="flex shrink-0 items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsOptimusOpen((current) => !current)}
                    className="h-10 rounded-lg border border-[#c4ccdc] bg-white px-4 text-sm font-bold text-[#07183b] shadow-sm transition hover:bg-[#eef6ff]"
                  >
                    Optimus AI
                  </button>
                  {isOptimusOpen ? (
                    <OptimusAssistantMenu
                      onAutoAssign={startAutoAssignScan}
                      onClose={() => setIsOptimusOpen(false)}
                    />
                  ) : null}
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsShareOpen((current) => !current)}
                    className="h-10 rounded-lg border border-[#c4ccdc] bg-white px-4 text-sm font-bold text-[#07183b] shadow-sm transition hover:bg-[#eef6ff]"
                  >
                    Share
                  </button>
                  {isShareOpen ? (
                    <WorkspaceShareMenu
                      workspace={currentWorkspace}
                      onAccessChange={(linkAccess) =>
                        updateWorkspace(currentWorkspace.workspace_id, { linkAccess })
                      }
                    />
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => startNewTask(groups[0]?.group_id)}
                  className="h-10 rounded-lg bg-[#0a72e8] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#075fc2]"
                >
                  Add Task
                </button>
              </div>
            ) : null}
          </div>

          {autoAssignView === "scanning" ? <AutoAssignScanModal /> : null}
          {autoAssignView === "results" ? (
            <EligibleEmployeesDrawer
              employees={employees}
              onClose={() => setAutoAssignView("closed")}
            />
          ) : null}

          {error ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-auto py-6 pr-6">
          {currentWorkspace ? (
            <>
            {groups.map((group, index) => {
              const firstGroupId = groups[0]?.group_id;
              const groupTasks = tasks.filter(
                (task) =>
                  task.group_id === group.group_id ||
                  (group.group_id === firstGroupId && task.group_id == null),
              );

              return (
                <TaskGroup
                  key={group.group_id}
                  availableColumns={defaultColumns}
                  color={groupColorById[group.group_id] ?? groupColors[index % groupColors.length]}
                  groupId={group.group_id}
                  canDelete={groups.length > 1}
                  onMoveTaskToGroup={moveTaskToGroup}
                  onDeleteGroup={() => deleteGroup(group.group_id)}
                  title={group.group_name}
                  columns={columns}
                  employees={employees}
                  currentWorkspace={currentWorkspace}
                  tasks={groupTasks}
                  isAddingTask={false}
                  form={form}
                  groupColors={groupColors}
                  onColorChange={(color) =>
                    setGroupColorById((current) => ({ ...current, [group.group_id]: color }))
                  }
                  onColumnToggle={toggleColumn}
                  onGroupNameChange={(name) => renameGroup(group.group_id, name)}
                  onUpdateField={updateField}
                  onSaveTask={saveTask}
                  onCancelTask={() => {
                    setForm(emptyTask);
                    setIsAddingTask(false);
                  }}
                  onAddTask={() => startNewTask(group.group_id)}
                  onReorderTasks={reorderTasks}
                  onShareAccessChange={(linkAccess) =>
                    updateWorkspace(currentWorkspace.workspace_id, { linkAccess })
                  }
                  onTaskUpdate={updateTask}
                  onStatusChange={updateTaskStatus}
                />
              );
            })}

            <button
              type="button"
              onClick={addGroup}
              className="sticky left-0 mt-2 inline-flex w-max items-center gap-2 rounded-lg border border-dashed border-[#c4ccdc] bg-transparent px-4 py-2 text-sm font-bold text-[#0a72e8] transition hover:bg-white/30"
            >
              <span className="text-lg leading-none">+</span> Add group
            </button>

            {isTaskOverlayOpen ? (
              <TaskCreationOverlay
                columns={columns}
                currentWorkspace={currentWorkspace}
                employees={employees}
                form={form}
                groupTitle={
                  groups.find((group) => group.group_id === targetGroupId)?.group_name ?? "Task"
                }
                onCancel={() => {
                  setForm(emptyTask);
                  setIsTaskOverlayOpen(false);
                }}
                onSave={saveTask}
                onUpdateField={updateField}
              />
            ) : null}
            </>
          ) : (
            <TemplatePrompt onCreateBlank={() => createWorkspaceWithName("My Workspace")} />
          )}
        </div>
      </section>

      {isWorkspaceDetailsOpen && currentWorkspace ? (
        <div className="absolute left-98 top-10 z-50">
          <form
            onSubmit={updateWorkspaceName}
            className="mx-auto mt-20 w-full max-w-2xl rounded-2xl border border-white/60 bg-white/20 p-6 shadow-[0_24px_80px_rgba(7,24,59,0.22)] backdrop-blur-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <input
                value={workspaceEditName}
                onChange={(event) => setWorkspaceEditName(event.target.value)}
                className="h-12 min-w-0 flex-1 rounded-md border border-[#0a72e8] px-3 text-2xl font-bold text-[#2f3442] outline-none"
              />
              <button
                type="button"
                onClick={() => setIsWorkspaceDetailsOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-bold text-[#667085] hover:bg-[#eef2f8]"
              >
                Close
              </button>
            </div>

            <div className="mt-6 border-t border-[#d6deed] pt-5">
              <h3 className="text-lg font-bold text-[#2f3442]">Workspace info</h3>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-[140px_1fr]">
                <dt className="text-[#667085]">Created by</dt>
                <dd className="font-semibold text-[#2f3442]">
                  {currentWorkspace.created_by_name ?? "Unknown user"}
                </dd>
                <dt className="text-[#667085]">Created at</dt>
                <dd className="font-semibold text-[#2f3442]">
                  {formatFullDate(currentWorkspace.created_at)}
                </dd>
              </dl>
            </div>

            <button className="mt-6 h-11 rounded-md bg-[#0a72e8] px-5 text-sm font-bold text-white transition hover:bg-[#075fc2]">
              Save workspace
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function WorkspaceRowMenu({
  isFavorite,
  workspace,
  onArchive,
  onDelete,
  onDuplicate,
  onFavorite,
  onPrivate,
  onPublic,
  onRename,
}) {
  return (
    <div className="absolute right-3 top-13 z-30 w-60 overflow-hidden rounded-xl border border-white/20 bg-white/40 shadow-[0_18px_50px_rgba(7,24,59,0.18)] backdrop-blur-md">
      <MenuButton label="Rename" onClick={onRename} />
      <div className="border-t border-white/45 px-3 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-[#667085]">
          Change visibility
        </p>
        <MenuButton
          label="Change to private"
          onClick={onPrivate}
          isActive={workspace.visibility === "Private"}
          isNested
        />
        <MenuButton
          label="Change to public"
          onClick={onPublic}
          isActive={workspace.visibility === "Public"}
          isNested
        />
      </div>
      <MenuButton label={isFavorite ? "Remove from favourites" : "Add to favourites"} onClick={onFavorite} />
      <MenuButton label="Duplicate" onClick={onDuplicate} />
      <MenuButton label="Archive" onClick={onArchive} />
      <MenuButton label="Delete" onClick={onDelete} isDanger />
    </div>
  );
}

function MenuButton({ isActive = false, isDanger = false, isNested = false, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-semibold transition hover:bg-white/45 ${
        isDanger ? "text-[#DF2F4A]" : "text-[#2f3442]"
      } ${isNested ? "mt-2 pl-6" : ""}`}
    >
      <span>{label}</span>
      {isActive ? <span className="text-xs text-[#667085]">✓</span> : null}
    </button>
  );
}

function OptimusGlowPanel({ children, className = "" }) {
  return (
    <BorderGlow
      animated
      backgroundColor="transparent"
      borderRadius={20}
      className={className}
      colors={[
        "#FFFFFF",
        "#FFF8E1",
        "#FFD54F",
        "#FFC107",
        "#FF8F00",
      ]}
      coneSpread={10}
      edgeSensitivity={90}
      fillOpacity={0}
      glowColor="38 100 58"
      glowIntensity={2}
      glowRadius={35}
    >
      <div
        className="overflow-hidden rounded-2xl bg-[#E0E5E9]/40 shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
      >
        {children}
      </div>
    </BorderGlow>
  );
}

function RadarPreview({ employees = [] }) {
  const matchedEmployees = employees.slice(0, 5);
  const radarItems = [
    {
      position: "left-12 top-8",
      delay: 0.45,
    },
    {
      position: "left-1/2 top-4 -translate-x-1/2",
      delay: 1.15,
    },
    {
      position: "right-12 top-8",
      delay: 1.85,
    },
    {
      position: "left-24 bottom-10",
      delay: 2.55,
    },
    {
      position: "right-24 bottom-10",
      delay: 3.25,
    },
  ];

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-b-2xl bg-[#E0E5E9]/80 backdrop-blur-md shadow-inner">
      <style>{`
        @keyframes radar-profile-pop {
          0% {
            opacity: 0;
            transform: translateY(14px) scale(0.72);
          }
          70% {
            opacity: 1;
            transform: translateY(-2px) scale(1.04);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-radar-profile-pop {
          animation: radar-profile-pop 0.5s ease-out both;
        }
      `}</style>
      <Radar className="absolute left-1/2 top-[92%] h-20 w-20 -translate-x-1/2 -translate-y-1/2" />
      {radarItems.map((item, index) => (
        <div key={index} className={`absolute ${item.position}`}>
          <RadarProfileIcon
            delay={item.delay}
            employee={matchedEmployees[index]}
          />
        </div>
      ))}
    </div>
  );
}

function RadarProfileIcon({ delay, employee }) {
  return (
    <div
      className="animate-radar-profile-pop relative z-50 flex flex-col items-center gap-2 opacity-0"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1E40AF] shadow-inner">
        <svg className="h-9 w-9 text-[#E0E5E9]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 1 1 14 0H3Z" />
        </svg>
      </div>
      <span className="max-w-32 truncate rounded-full bg-slate-900/80 px-3 py-1 text-center text-xs font-bold text-slate-300">
        {employee ? getDisplayName(employee) : "Searching"}
      </span>
    </div>
  );
}

function OptimusAssistantMenu({ onAutoAssign, onClose }) {
  const features = ["Auto assign", "Predict workload risk", "Suggest task priority", "Summarize workspace"];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-6 py-8">
      <OptimusGlowPanel className="w-full max-w-lg backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3 border-b border-white/35 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#667085]">
              Optimus AI
            </p>
            <h3 className="text-2xl font-black">AI features</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/45 text-xl font-black text-[#667085] transition hover:bg-white/70"
            aria-label="Close Optimus AI"
          >
            ×
          </button>
        </div>

        <div className="grid gap-2 p-4">
          {features.map((feature) => (
            <button
              key={feature}
              type="button"
              onClick={() => {
                if (feature === "Auto assign") {
                  onAutoAssign();
                  return;
                }
              }}
              className="rounded-xl px-4 py-3 text-left text-sm font-black text-[#2f3442] transition hover:bg-white/55"
            >
              {feature}
            </button>
          ))}
        </div>
      </OptimusGlowPanel>
    </div>
  );
}

function AutoAssignScanModal({ employees }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-8 py-8">
      <OptimusGlowPanel className="w-full max-w-5xl">
        <div className="flex items-center justify-between px-6 py-4 text-white bg-[#E0E5E9]/60 backdrop-blur-md">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[#0D1E4C]">
              Optimus
            </p>
            <h3 className="text-2xl font-black">Scanning eligible profiles</h3>
          </div>
          <p className="text-sm font-semibold text-slate-400">
            Availability · Skill · Qualification · Department
          </p>
        </div>
        <RadarPreview employees={employees} />
      </OptimusGlowPanel>
    </div>
  );
}

function EligibleEmployeesDrawer({ employees, onClose }) {
  const eligibleEmployees = employees.slice(0, 8);

  return (
    <OptimusGlowPanel className="absolute left-170 top-4 z-[70] w-[380px]">
      <div className="flex items-start justify-between gap-4 border-b border-white/40 px-5 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#667085]">
            Optimus AI
          </p>
          <h3 className="text-xl font-black">Eligible employees</h3>
          <p className="mt-1 text-xs leading-5 text-[#667085]">
            Drag a profile into an Assigned to field.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-sm font-bold text-[#667085] hover:bg-white/55"
          aria-label="Close eligible employees"
        >
          ×
        </button>
      </div>
      <div className="grid max-h-[calc(100vh-13rem)] gap-2 overflow-y-auto p-4">
        {eligibleEmployees.map((employee) => (
          <button
            key={employee.user_id}
            type="button"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "copy";
              event.dataTransfer.setData(
                "application/x-optima-employee-id",
                employee.user_id
              );
              event.dataTransfer.setData("text/plain", employee.user_id);
            }}
            className="flex cursor-grab items-center gap-3 rounded-2xl border border-white/40 bg-white/60 px-3 py-3 text-left shadow-sm transition hover:bg-white/80 active:cursor-grabbing"
            title="Drag into an Assigned to field"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#07183b] text-sm font-black text-white">
              {getInitials(employee)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-black text-[#2f3442]">
                {getDisplayName(employee)}
              </span>
              <span className="block truncate text-xs text-[#667085]">
                {getEmployeeMatchSummary(employee)}
              </span>
            </span>
            <span className="rounded-full bg-[#dbeafe] px-2 py-1 text-xs font-black text-[#1E40AF]">
              {getEmployeeMatchScore(employee)}%
            </span>
          </button>
        ))}
        {!eligibleEmployees.length ? (
          <p className="rounded-2xl border border-dashed border-white/40 px-3 py-10 text-center text-sm font-semibold text-[#667085]">
            No employees available yet.
          </p>
        ) : null}
      </div>
    </OptimusGlowPanel>
  );
}

function TemplatePrompt({ onCreateBlank }) {
  return (
    <div className="max-w-3xl">
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <button
          type="button"
          onClick={onCreateBlank}
          className="rounded-xl border border-[#0a72e8] bg-[#eef6ff] p-5 text-left transition hover:bg-[#dcecff]"
        >
          <p className="text-lg font-bold text-[#07183b]">Simple Workspace</p>
          <p className="mt-2 text-sm leading-6 text-[#667085]">
            Start with a To-Do group and default task columns.
          </p>
        </button>
        {["Project tracker", "Team requests"].map((template) => (
          <div key={template} className="rounded-xl border border-dashed border-[#c4ccdc] p-5 opacity-60">
            <p className="text-lg font-bold text-[#07183b]">{template}</p>
            <p className="mt-2 text-sm leading-6 text-[#667085]">Coming soon.</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskGroup({
  availableColumns,
  color,
  title,
  groupId,
  canDelete,
  columns,
  employees,
  currentWorkspace,
  tasks,
  emptyText,
  isAddingTask,
  form,
  groupColors,
  onColorChange,
  onColumnToggle,
  onGroupNameChange,
  onMoveTaskToGroup,
  onDeleteGroup,
  onUpdateField,
  onSaveTask,
  onCancelTask,
  onAddTask,
  onReorderTasks,
  onShareAccessChange,
  onTaskUpdate,
  onStatusChange,
}) {
  const [isDropTargetGroup, setIsDropTargetGroup] = useState(false);

  // A task dragged from another group lands here → move it into this group.
  function handleGroupDrop(event) {
    setIsDropTargetGroup(false);
    const draggedId = event.dataTransfer.getData("application/task-id");
    if (!draggedId) return;
    const alreadyHere = tasks.some((task) => String(task.task_id) === draggedId);
    if (alreadyHere) return; // same-group drops are reordering, handled by rows
    const numericId = Number(draggedId);
    onMoveTaskToGroup?.(Number.isNaN(numericId) ? draggedId : numericId, groupId);
  }
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragReadyTaskId, setDragReadyTaskId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  const gridTemplateColumns = `32px 44px ${columns
    .map((column) => (column === "Task" ? "360px" : "190px"))
    .join(" ")}`;

  function toggleTaskSelection(taskId) {
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

  return (
    <section
      className={`mb-10 w-max min-w-full rounded-xl transition ${
        isDropTargetGroup ? "ring-2 ring-[#0a72e8] ring-offset-2" : ""
      }`}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("application/task-id")) {
          event.preventDefault();
          setIsDropTargetGroup(true);
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsDropTargetGroup(false);
        }
      }}
      onDrop={handleGroupDrop}
    >
      <div className="mb-3 flex min-w-full items-center gap-4">
        <button
          type="button"
          onClick={() => setIsGroupSettingsOpen((current) => !current)}
          className="sticky left-0 z-30 flex items-center gap-3 rounded-md pr-4 text-2xl font-bold transition hover:bg-white/30"
          style={{ color }}
        >
          <span className="text-xl">⌄</span>
          {title}
        </button>
      </div>

      {isGroupSettingsOpen ? (
        <GroupSettingsPopover
          availableColumns={availableColumns}
          color={color}
          colors={groupColors}
          columns={columns}
          title={title}
          canDelete={canDelete}
          onClose={() => setIsGroupSettingsOpen(false)}
          onColorChange={onColorChange}
          onColumnToggle={onColumnToggle}
          onTitleChange={onGroupNameChange}
          onDelete={() => {
            setIsGroupSettingsOpen(false);
            onDeleteGroup?.();
          }}
        />
      ) : null}

      <div className="overflow-visible">
        <div
          className="sticky top-0 z-10 grid border-b border-[#d6deed] text-sm font-bold text-[#2f3442]"
          style={{ gridTemplateColumns }}
        >
          <div className="sticky left-0 z-40 bg-white p-2" style={{ gridColumn: "span 2" }} />
          {columns.map((column) => (
            <div
              key={column}
              className={`p-3 ${
                column === "Task" ? "sticky left-[76px] z-40 bg-white" : "bg-white/30 backdrop-blur-sm"
              }`}
            >
              {column}
            </div>
          ))}
        </div>

        {tasks.length ? (
          tasks.map((task) => (
            <TaskRow
              key={task.task_id}
              task={task}
              columns={columns}
              employees={employees}
              gridTemplateColumns={gridTemplateColumns}
              isDragReady={dragReadyTaskId === task.task_id}
              isDragging={draggedTaskId === task.task_id}
              isSelected={selectedTaskIds.has(task.task_id)}
              dropPosition={
                dropTarget?.taskId === task.task_id ? dropTarget.position : null
              }
              onDragEnd={() => {
                setDraggedTaskId(null);
                setDragReadyTaskId(null);
                setDropTarget(null);
              }}
              onDragOver={(event) => {
                event.preventDefault();

                if (!draggedTaskId || draggedTaskId === task.task_id) {
                  setDropTarget(null);
                  return;
                }

                const rect = event.currentTarget.getBoundingClientRect();
                const position =
                  event.clientY - rect.top > rect.height / 2 ? "after" : "before";
                setDropTarget({ taskId: task.task_id, position });
              }}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("application/task-id", String(task.task_id));
                setDraggedTaskId(task.task_id);
              }}
              onDrop={() => {
                onReorderTasks(
                  draggedTaskId,
                  task.task_id,
                  dropTarget?.taskId === task.task_id ? dropTarget.position : "before"
                );
                setDraggedTaskId(null);
                setDragReadyTaskId(null);
                setDropTarget(null);
              }}
              onPrepareDrag={() => setDragReadyTaskId(task.task_id)}
              onReleaseDrag={() => setDragReadyTaskId(null)}
              onSelect={() => toggleTaskSelection(task.task_id)}
              onRowDragLeave={() => {
                setDropTarget((current) =>
                  current?.taskId === task.task_id ? null : current
                );
              }}
              onTaskUpdate={onTaskUpdate}
              onStatusChange={onStatusChange}
            />
          ))
        ) : !isAddingTask ? (
          <div
            className="grid border-b border-[#d6deed] text-sm text-[#667085]"
            style={{ gridTemplateColumns }}
          >
          <div className="sticky left-0 z-20 bg-white" />
          <div className="sticky left-[32px] z-20 bg-white p-3" />
          <div className="p-3" style={{ gridColumn: `span ${columns.length}` }}>
              {emptyText}
            </div>
          </div>
        ) : null}

        {isAddingTask ? (
          <InlineTaskFormRow
            columns={columns}
            employees={employees}
            form={form}
            gridTemplateColumns={gridTemplateColumns}
            onCancel={onCancelTask}
            onSave={onSaveTask}
            onUpdateField={onUpdateField}
          />
        ) : null}

        <div
          className="grid border-b border-[#d6deed] text-sm text-[#667085]"
          style={{ gridTemplateColumns }}
        >
          <div className="sticky left-0 z-20 flex items-center justify-center bg-white p-2">
            <span className="text-base font-bold leading-none text-[#CBD5E1]">⋮⋮</span>
          </div>
          <div className="sticky left-[32px] z-20 flex items-center justify-center bg-white p-3">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[#d6deed] text-[#07183b]"
              aria-label="Select new task row"
            />
          </div>
          <button
            type="button"
            onClick={onAddTask}
            className="sticky left-[76px] z-20 bg-white p-3 text-left hover:bg-[#f8faff] focus:bg-[#e8f3ff] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#07183b]"
          >
            + Add task
          </button>
        </div>
      </div>

    </section>
  );
}

function WorkspaceShareMenu({ workspace, onAccessChange }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  const linkAccess = workspace?.link_access ?? "Private";
  const shareUrl =
    typeof window !== "undefined" && workspace?.share_token
      ? `${window.location.origin}/share/workspace/${workspace.share_token}`
      : "";

  async function updateAccess(nextAccess) {
    setIsUpdating(true);
    setCopied(false);

    try {
      await onAccessChange(nextAccess);
    } finally {
      setIsUpdating(false);
    }
  }

  async function copyShareLink() {
    if (!shareUrl) {
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-white/50 bg-white/40 p-4 shadow-[0_24px_80px_rgba(7,24,59,0.22)] backdrop-blur-md">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#667085]">
          Share workspace
        </p>
        <h3 className="mt-1 truncate text-lg font-black text-[#07183b]">
          {workspace?.workspace_name ?? "Workspace"}
        </h3>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-white/55 bg-white/45">
        {["Private", "View", "Edit"].map((access) => (
          <button
            key={access}
            type="button"
            disabled={isUpdating}
            onClick={() => updateAccess(access)}
            className="flex w-full items-center justify-between border-b border-white/55 px-4 py-3 text-left text-sm font-black text-[#2f3442] last:border-b-0 hover:bg-white/65 disabled:cursor-wait"
          >
            <span>
              {access}
              <span className="mt-0.5 block text-xs font-semibold text-[#667085]">
                {access === "Private"
                  ? "Only invited workspace members can open it."
                  : access === "View"
                    ? "Anyone with the link can view."
                    : "Anyone with the link can edit."}
              </span>
            </span>
            {linkAccess === access ? <span className="text-[#0D6EFD]">✓</span> : null}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-white/55 bg-white/45 p-3">
        <p className="text-xs font-bold uppercase tracking-wide text-[#667085]">
          Share link
        </p>
        <div className="mt-2 flex gap-2">
          <input
            readOnly
            value={shareUrl || "Set access to View or Edit to create a link"}
            className="h-10 min-w-0 flex-1 rounded-lg border border-[#c4ccdc] bg-white/70 px-3 text-xs font-semibold text-[#667085] outline-none"
          />
          <button
            type="button"
            disabled={!shareUrl}
            onClick={copyShareLink}
            className="h-10 rounded-lg bg-[#07183b] px-3 text-xs font-black text-white transition hover:bg-[#0D1E4C] disabled:cursor-not-allowed disabled:bg-[#94a3b8]"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GroupSettingsPopover({
  availableColumns,
  color,
  colors,
  columns,
  title,
  canDelete,
  onClose,
  onColorChange,
  onColumnToggle,
  onTitleChange,
  onDelete,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#BBE1FA]/45 p-6">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-white/60 bg-white/20 text-[#07183b] shadow-[0_28px_90px_rgba(7,24,59,0.26)] backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4 border-b border-white/70 p-5">
          <input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            className="h-12 min-w-0 flex-1 rounded-lg border border-[#c4ccdc] bg-white/82 px-4 text-xl font-bold outline-none focus:border-[#07183b]"
            aria-label="Group name"
          />
          <div className="flex shrink-0 items-center gap-2">
            {canDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="h-12 rounded-lg px-4 text-base font-bold text-[#DF2F4A] hover:bg-[#fdecef]"
              >
                Delete group
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="h-12 rounded-lg px-4 text-base font-bold text-[#667085] hover:bg-white/70"
            >
              Close
            </button>
          </div>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#667085]">Color</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {colors.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onColorChange(option)}
                  className={`h-10 w-10 rounded-full border-4 ${
                    color === option ? "border-[#07183b]" : "border-transparent"
                  }`}
                  style={{ backgroundColor: option }}
                  aria-label={`Use ${option} group color`}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#667085]">Columns</p>
            <div className="mt-3 grid gap-2 rounded-xl border border-white/70 bg-white/62 p-2 sm:grid-cols-2">
              {availableColumns.map((column) => {
                const isEnabled = columns.includes(column);
                const isLocked = column === "Task";

                return (
                  <button
                    key={column}
                    type="button"
                    disabled={isLocked}
                    onClick={() => onColumnToggle(column)}
                    className="flex w-full items-center justify-between gap-4 rounded-lg bg-white/75 px-3 py-2 text-left text-sm font-bold shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <span>{column}</span>
                    <span
                      className={`flex h-6 w-11 items-center rounded-full p-0.5 transition ${
                        isEnabled ? "bg-[#07183b]" : "bg-[#d8e0ee]"
                      }`}
                    >
                      <span
                        className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
                          isEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 -z-10"
        aria-label="Close group settings"
      />
    </div>
  );
}

function TaskCreationOverlay({
  currentWorkspace,
  employees,
  form,
  groupTitle,
  onCancel,
  onSave,
  onUpdateField,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-6 py-8 backdrop-blur-sm">
      <form
        onSubmit={onSave}
        className="flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#17191b] text-white shadow-[0_28px_90px_rgba(0,0,0,0.45)]"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-8 text-sm font-bold text-white/45">
            {["Task", "Doc", "Reminder", "Whiteboard", "Dashboard"].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`pb-3 transition hover:text-white ${
                  tab === "Task" ? "border-b-2 border-white text-white" : ""
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white/70 transition hover:bg-white/15 hover:text-white"
            aria-label="Close task creation"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="flex flex-wrap gap-3">
            <span className="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-white/75">
              {currentWorkspace?.workspace_name ?? "Workspace"}
            </span>
            <span className="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-white/75">
              {groupTitle}
            </span>
          </div>

          <input
            value={form.title}
            onChange={(event) => onUpdateField("title", event.target.value)}
            placeholder="Task Name"
            required
            autoFocus
            className="mt-8 h-14 w-full bg-transparent text-3xl font-bold text-white outline-none placeholder:text-white/35"
          />

          <textarea
            value={form.description}
            onChange={(event) => onUpdateField("description", event.target.value)}
            placeholder="Add description"
            className="mt-5 min-h-24 w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-white/30"
          />

          <button
            type="button"
            className="mt-4 rounded-lg px-3 py-2 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            Write with AI
          </button>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-white/45">
              Status
              <select
                value={form.status}
                onChange={(event) => onUpdateField("status", event.target.value)}
                className="h-11 rounded-lg border border-white/10 bg-white/10 px-3 text-sm font-bold text-white outline-none"
              >
                <option className="text-[#17191b]">Open</option>
                <option className="text-[#17191b]">In Progress</option>
                <option className="text-[#17191b]">Completed</option>
                <option className="text-[#17191b]">Cancelled</option>
              </select>
            </label>
            <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-white/45">
              Assignee
              <select
                value={form.assignedTo}
                onChange={(event) => onUpdateField("assignedTo", event.target.value)}
                className="h-11 rounded-lg border border-white/10 bg-white/10 px-3 text-sm font-bold text-white outline-none"
              >
                <option className="text-[#17191b]" value="">
                  Unassigned
                </option>
                {employees.map((employee) => (
                  <option
                    key={employee.user_id}
                    className="text-[#17191b]"
                    value={employee.user_id}
                  >
                    {getDisplayName(employee)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-white/45">
              Priority
              <select
                value={form.priority}
                onChange={(event) => onUpdateField("priority", event.target.value)}
                className="h-11 rounded-lg border border-white/10 bg-white/10 px-3 text-sm font-bold text-white outline-none"
              >
                <option className="text-[#17191b]">Low</option>
                <option className="text-[#17191b]">Medium</option>
                <option className="text-[#17191b]">High</option>
                <option className="text-[#17191b]">Urgent</option>
              </select>
            </label>
            <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-white/45">
              Due date
              <input
                type="datetime-local"
                value={form.endDatetime}
                onChange={(event) => onUpdateField("endDatetime", event.target.value)}
                className="h-11 rounded-lg border border-white/10 bg-white/10 px-3 text-sm font-bold text-white outline-none"
              />
            </label>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-white/45">
              Timeline start
              <input
                type="datetime-local"
                value={form.startDatetime}
                onChange={(event) => onUpdateField("startDatetime", event.target.value)}
                className="h-11 rounded-lg border border-white/10 bg-white/10 px-3 text-sm font-bold text-white outline-none"
              />
            </label>
            <div className="grid gap-2 text-xs font-bold uppercase tracking-wide text-white/45">
              Fields
              <button
                type="button"
                className="h-11 justify-self-start rounded-lg bg-white/10 px-4 text-sm font-bold normal-case tracking-normal text-white/75 transition hover:bg-white/15"
              >
                + Create new field
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
          <button
            type="button"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-white/70 transition hover:bg-white/10"
          >
            Templates
          </button>
          <div className="flex items-center">
            <button
              type="submit"
              className="h-11 rounded-l-xl bg-white px-5 text-sm font-bold text-[#17191b] transition hover:bg-white/90"
            >
              Create Task
            </button>
            <button
              type="button"
              className="h-11 rounded-r-xl border-l border-[#d6deed] bg-white px-3 text-sm font-bold text-[#17191b]"
              aria-label="More create options"
            >
              ⌄
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function InlineTaskFormRow({
  columns,
  employees,
  form,
  gridTemplateColumns,
  onCancel,
  onSave,
  onUpdateField,
}) {
  return (
    <form
      onSubmit={onSave}
      className="grid border-b border-[#d6deed] bg-[#e8f3ff] text-sm text-[#2f3442]"
      style={{ gridTemplateColumns }}
    >
      <div className="bg-white p-2">
        <span className="block text-center text-base font-bold leading-none text-[#98A2B3]">⋮⋮</span>
      </div>
      <div className="flex items-center justify-center bg-white p-3">
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-[#b8c4d8] text-[#07183b]"
          aria-label="Select task draft"
        />
      </div>
      {columns.map((column) => (
        <InlineTaskCell
          key={column}
          column={column}
          employees={employees}
          form={form}
          onCancel={onCancel}
          onUpdateField={onUpdateField}
        />
      ))}
    </form>
  );
}

function InlineTaskCell({ column, employees, form, onCancel, onUpdateField }) {
  if (column === "Task") {
    return (
      <div className="bg-white p-2">
        <input
          value={form.title}
          onChange={(event) => onUpdateField("title", event.target.value)}
          placeholder="New task"
          required
          autoFocus
          className="h-10 w-full rounded-md border border-transparent bg-white px-2 text-sm font-semibold outline-none focus:border-[#07183b]"
        />
      </div>
    );
  }

  if (column === "Status") {
    return (
      <div className="bg-white p-2">
        <select
          value={form.status}
          onChange={(event) => onUpdateField("status", event.target.value)}
          className={`h-10 w-full rounded-md border-0 px-2 text-center text-sm font-bold outline-none ${statusStyles[form.status] ?? statusStyles.Open}`}
        >
          <option>Open</option>
          <option>In Progress</option>
          <option>Completed</option>
          <option>Cancelled</option>
        </select>
      </div>
    );
  }

  if (column === "Assigned to") {
    return (
      <PeoplePickerCell
        employees={employees}
        selectedUserId={form.assignedTo}
        onAssign={(userId) => onUpdateField("assignedTo", userId ?? "")}
      />
    );
  }

  if (column === "Priority") {
    return (
      <div className="bg-white p-2">
        <select
          value={form.priority}
          onChange={(event) => onUpdateField("priority", event.target.value)}
          className="h-10 w-full rounded-md border border-[#c4ccdc] bg-white px-2 text-sm font-semibold text-[#2f3442] outline-none"
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Urgent</option>
        </select>
      </div>
    );
  }

  if (column === "Due Date") {
    return (
      <div className="bg-white p-2">
        <input
          type="datetime-local"
          value={form.endDatetime}
          onChange={(event) => onUpdateField("endDatetime", event.target.value)}
          className="h-10 w-full rounded-md border border-[#c4ccdc] bg-white px-2 text-sm text-[#2f3442] outline-none"
        />
      </div>
    );
  }

  if (column === "Timeline") {
    return (
      <div className="bg-white p-2">
        <input
          type="datetime-local"
          value={form.startDatetime}
          onChange={(event) => onUpdateField("startDatetime", event.target.value)}
          className="h-10 w-full rounded-md border border-[#c4ccdc] bg-white px-2 text-sm text-[#2f3442] outline-none"
        />
      </div>
    );
  }

  if (column === "Last updated") {
    return (
      <div className="flex items-center gap-2 bg-white p-2">
        <button
          type="submit"
          className="h-9 rounded-md bg-[#07183b] px-3 text-xs font-bold text-white transition hover:bg-[#0D1E4C]"
        >
          Create
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-md border border-[#c4ccdc] px-3 text-xs font-bold text-[#667085] transition hover:bg-[#eef6ff]"
        >
          Cancel
        </button>
      </div>
    );
  }

  return <TableText value="-" />;
}

function TaskRow({
  task,
  columns,
  employees,
  gridTemplateColumns,
  isDragReady,
  isDragging,
  isSelected,
  dropPosition,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
  onPrepareDrag,
  onReleaseDrag,
  onSelect,
  onRowDragLeave,
  onTaskUpdate,
  onStatusChange,
}) {
  const status = task.status || "Open";

  return (
    <div
      draggable={isDragReady}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onDragLeave={onRowDragLeave}
      className={`relative grid border-b border-[#d6deed] text-sm text-[#2f3442] transition ${
        isDragging ? "opacity-50" : "opacity-100"
      } ${isSelected ? "bg-[#BBE1FA]/80" : "bg-transparent hover:bg-white/20"}`}
      style={{ gridTemplateColumns }}
    >
      {dropPosition ? (
        <div
          className={`pointer-events-none absolute left-0 right-0 z-20 h-0.5 rounded-full bg-[#1E40AF] shadow-[0_0_0_2px_rgba(7,24,59,0.12)] ${
            dropPosition === "before" ? "-top-0.5" : "-bottom-0.5"
          }`}
        />
      ) : null}
      <div
        className="sticky left-0 z-20 flex cursor-grab items-center justify-center bg-white p-2 text-[#98A2B3] active:cursor-grabbing"
        onMouseDown={onPrepareDrag}
        onMouseUp={onReleaseDrag}
        onTouchStart={onPrepareDrag}
        onTouchEnd={onReleaseDrag}
      >
        <span className="select-none text-base font-bold leading-none" title="Drag row">
          ⋮⋮
        </span>
      </div>
      <div className="sticky left-[32px] z-20 flex items-center justify-center bg-white p-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="h-5 w-5 rounded border-[#b8c4d8] text-[#07183b]"
          aria-label={`Select ${task.title ?? "task"}`}
        />
      </div>
      {columns.map((column) => (
        <TaskCell
          key={column}
          column={column}
          employees={employees}
          task={task}
          status={status}
          isSticky={column === "Task"}
          onStatusChange={onStatusChange}
          onTaskUpdate={onTaskUpdate}
        />
      ))}
    </div>
  );
}

function TaskCell({
  column,
  employees,
  isSticky,
  task,
  status,
  onStatusChange,
  onTaskUpdate,
}) {
  if (column === "Task") {
    return (
      <EditableTextCell
        className={isSticky ? "sticky left-[76px] z-20 bg-white" : ""}
        value={task.title ?? ""}
        description={task.description}
        onSave={(value) => onTaskUpdate(task, { title: value })}
      />
    );
  }

  if (column === "Status") {
    return (
      <div className="p-2">
        <select
          value={status}
          onChange={(event) => onStatusChange(task, event.target.value)}
          className={`h-10 w-full rounded-md border-0 px-2 text-center text-sm font-bold outline-none ${statusStyles[status] ?? statusStyles.Open}`}
        >
          <option>Open</option>
          <option>In Progress</option>
          <option>Completed</option>
          <option>Cancelled</option>
        </select>
      </div>
    );
  }

  const ownerEmployee = employees.find((member) => member.user_id === task.owner_id);
  const values = {
    Owner: ownerEmployee ? getDisplayName(ownerEmployee) : "—",
    "Last updated": formatDate(task.updated_at),
  };

  if (column === "Assigned to") {
    return (
      <PeoplePickerCell
        employees={employees}
        selectedUserId={task.assigned_to}
        onAssign={(userId) => onTaskUpdate(task, { assignedTo: userId ?? "" })}
      />
    );
  }

  if (column === "Priority") {
    return (
      <EditableSelectCell
        value={task.priority ?? "Medium"}
        options={["Low", "Medium", "High", "Urgent"]}
        onSave={(value) => onTaskUpdate(task, { priority: value })}
      />
    );
  }

  if (column === "Due Date") {
    return (
      <EditableDateTimeCell
        value={task.end_datetime}
        displayValue={formatDate(task.end_datetime)}
        onSave={(value) => onTaskUpdate(task, { endDatetime: value })}
      />
    );
  }

  if (column === "Timeline") {
    return (
      <EditableTimelineCell
        start={task.start_datetime}
        end={task.end_datetime}
        onSave={(startDatetime, endDatetime) =>
          onTaskUpdate(task, { startDatetime, endDatetime })
        }
      />
    );
  }

  if (column === "Comments") {
    return <TableText value="Open comments" />;
  }

  if (column === "Files") {
    return <TableText value="Add file/link" />;
  }

  return <TableText value={values[column] ?? "-"} />;
}

function TableText({ value }) {
  return (
    <div className="p-3 text-center text-[#667085]">
      {value || "-"}
    </div>
  );
}

function PeoplePickerCell({ employees, selectedUserId, onAssign }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedEmployee = employees.find((employee) => employee.user_id === selectedUserId);
  const availableEmployees = employees.filter((employee) => employee.user_id !== selectedUserId);
  const filteredEmployees = availableEmployees.filter((employee) => {
    const searchText = getEmployeeSearchText(employee);
    return searchText.includes(query.trim().toLowerCase());
  });

  function closePicker() {
    setQuery("");
    setIsOpen(false);
  }

  function assignDroppedEmployee(event) {
    event.preventDefault();
    const userId =
      event.dataTransfer.getData("application/x-optima-employee-id") ||
      event.dataTransfer.getData("text/plain");

    if (userId && employees.some((employee) => employee.user_id === userId)) {
      onAssign(userId);
      closePicker();
    }
  }

  return (
    <div
      className="relative p-2"
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("application/x-optima-employee-id")) {
          event.preventDefault();
        }
      }}
      onDrop={assignDroppedEmployee}
    >
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold text-[#667085] transition hover:bg-[#f8faff] focus:outline-none focus:ring-2 focus:ring-[#07183b]"
        title="Assign employee"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eef6ff] text-xs font-bold text-[#07183b]">
          {selectedEmployee ? getInitials(selectedEmployee) : "+"}
        </span>
        <span className="min-w-0 truncate">
          {selectedEmployee ? getDisplayName(selectedEmployee) : "Assign"}
        </span>
      </button>

      {isOpen ? (
        <div className="absolute left-2 top-13 z-30 w-96 rounded-xl border border-white/60 bg-white/20 p-3 shadow-[0_18px_50px_rgba(7,24,59,0.18)] backdrop-blur-sm">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, department or skill"
            autoFocus
            className="h-11 w-full rounded-md border border-black/30 bg-white/80 px-3 text-sm text-[#2f3442] outline-none focus:border-[#1E40AF]"
          />

          <div className="mt-4 border-b border-[#e3e9f3] pb-3">
            <p className="px-1 text-xs font-bold uppercase tracking-wide text-[#667085]">
              Currently assigned
            </p>
            {selectedEmployee ? (
              <button
                type="button"
                onClick={() => {
                  onAssign("");
                  closePicker();
                }}
                className="mt-2 flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-[#f8faff]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#07183b] text-xs font-bold text-white">
                  {getInitials(selectedEmployee)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#2f3442]">
                    {getDisplayName(selectedEmployee)}
                  </span>
                  <span className="block truncate text-xs text-[#667085]">
                    {selectedEmployee.email}
                  </span>
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef2f8] text-lg font-bold text-[#667085]">
                  -
                </span>
              </button>
            ) : (
              <p className="px-2 py-3 text-sm text-[#667085]">No employee assigned.</p>
            )}
          </div>

          <p className="mt-4 px-1 text-xs font-bold uppercase tracking-wide text-[#667085]">
            Assign employee
          </p>
          <div className="mt-2 max-h-64 overflow-y-auto">
            {filteredEmployees.map((employee) => (
              <button
                key={employee.user_id}
                type="button"
                onClick={() => {
                  onAssign(employee.user_id);
                  closePicker();
                }}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-[#f8faff]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#07183b] text-xs font-bold text-white">
                  {getInitials(employee)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[#2f3442]">
                    {getDisplayName(employee)}
                  </span>
                  <span className="block truncate text-xs text-[#667085]">{employee.email}</span>
                  {employee.skills?.length ? (
                    <span className="mt-1 block truncate text-xs text-[#667085]">
                      {employee.skills.join(", ")}
                    </span>
                  ) : null}
                </span>
              </button>
            ))}
            {!filteredEmployees.length ? (
              <p className="px-2 py-4 text-sm text-[#667085]">No employees found.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EditableTextCell({ className = "", value, description, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  async function saveDraft() {
    const nextValue = draft.trim();

    if (!nextValue || nextValue === value) {
      setDraft(value);
      setIsEditing(false);
      return;
    }

    await onSave(nextValue);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className={`${className} p-2`}>
        <input
          value={draft}
          onBlur={saveDraft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }

            if (event.key === "Escape") {
              setDraft(value);
              setIsEditing(false);
            }
          }}
          autoFocus
          className="h-10 w-full rounded-md border border-[#07183b] bg-white px-2 text-sm font-semibold outline-none"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value);
        setIsEditing(true);
      }}
      className={`${className} block min-h-14 w-full overflow-hidden p-3 text-left transition hover:bg-[#f8faff]`}
      title="Edit task"
    >
      <p className="truncate font-semibold">{value}</p>
      {description ? (
        <p className="mt-1 line-clamp-1 text-xs text-[#667085]">{description}</p>
      ) : null}
    </button>
  );
}

function EditableSelectCell({ value, options, onSave }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <div className="p-2">
        <select
          value={value}
          onBlur={() => setIsEditing(false)}
          onChange={async (event) => {
            await onSave(event.target.value);
            setIsEditing(false);
          }}
          autoFocus
          className="h-10 w-full rounded-md border border-[#c4ccdc] bg-white px-2 text-sm font-semibold text-[#2f3442] outline-none"
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="min-h-14 p-3 text-center font-semibold text-[#667085] transition hover:bg-[#f8faff]"
      title="Edit priority"
    >
      {value || "-"}
    </button>
  );
}

function EditableDateTimeCell({ value, displayValue, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(toDateTimeInputValue(value));

  async function saveDraft() {
    await onSave(draft);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="p-2">
        <input
          type="datetime-local"
          value={draft}
          onBlur={saveDraft}
          onChange={(event) => setDraft(event.target.value)}
          autoFocus
          className="h-10 w-full rounded-md border border-[#c4ccdc] bg-white px-2 text-sm text-[#2f3442] outline-none"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(toDateTimeInputValue(value));
        setIsEditing(true);
      }}
      className="min-h-14 p-3 text-center text-[#667085] transition hover:bg-[#f8faff]"
      title="Edit date"
    >
      {displayValue}
    </button>
  );
}

function EditableTimelineCell({ start, end, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftStart, setDraftStart] = useState(toDateTimeInputValue(start));
  const [draftEnd, setDraftEnd] = useState(toDateTimeInputValue(end));

  async function saveDraft() {
    await onSave(draftStart, draftEnd);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="p-2">
        <div className="grid gap-2">
          <input
            type="datetime-local"
            value={draftStart}
            onChange={(event) => setDraftStart(event.target.value)}
            className="h-9 w-full rounded-md border border-[#c4ccdc] bg-white px-2 text-xs text-[#2f3442] outline-none"
          />
          <input
            type="datetime-local"
            value={draftEnd}
            onChange={(event) => setDraftEnd(event.target.value)}
            className="h-9 w-full rounded-md border border-[#c4ccdc] bg-white px-2 text-xs text-[#2f3442] outline-none"
          />
          <button
            type="button"
            onClick={saveDraft}
            className="h-8 rounded-md bg-[#07183b] px-2 text-xs font-bold text-white"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraftStart(toDateTimeInputValue(start));
        setDraftEnd(toDateTimeInputValue(end));
        setIsEditing(true);
      }}
      className="min-h-14 p-3 text-center text-[#667085] transition hover:bg-[#f8faff]"
      title="Edit timeline"
    >
      {formatTimeline(start, end)}
    </button>
  );
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getDisplayName(employee) {
  return employee?.full_name || employee?.username || employee?.email || "Employee";
}

function getInitials(employee) {
  const name = getDisplayName(employee);
  const parts = name.split(/[\s._-]+/).filter(Boolean);

  if (!parts.length) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getEmployeeSearchText(employee) {
  return [
    employee?.username,
    employee?.email,
    employee?.department,
    ...(employee?.skills ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getEmployeeMatchScore(employee) {
  let score = 68;

  if (employee?.skills?.length) {
    score += Math.min(employee.skills.length * 6, 18);
  }

  if (employee?.department) {
    score += 7;
  }

  if (employee?.account_status?.toLowerCase?.() === "active") {
    score += 7;
  }

  return Math.min(score, 98);
}

function getEmployeeMatchSummary(employee) {
  const summary = [];

  if (employee?.account_status) {
    summary.push(employee.account_status);
  }

  if (employee?.department) {
    summary.push(employee.department);
  }

  if (employee?.skills?.length) {
    summary.push(employee.skills.slice(0, 2).join(", "));
  }

  return summary.join(" · ") || employee?.email || "Eligible profile";
}

function formatFullDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatTimeline(start, end) {
  if (!start && !end) {
    return "-";
  }

  return `${formatDate(start)} - ${formatDate(end)}`;
}

function toDateTimeInputValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}
