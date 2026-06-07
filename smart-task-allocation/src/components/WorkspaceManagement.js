"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

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
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [openWorkspaceMenuId, setOpenWorkspaceMenuId] = useState("");
  const [favoriteWorkspaceIds, setFavoriteWorkspaceIds] = useState(new Set());
  const [isWorkspaceSidebarCollapsed, setIsWorkspaceSidebarCollapsed] = useState(false);
  const [isWorkspaceDetailsOpen, setIsWorkspaceDetailsOpen] = useState(false);
  const [workspaceEditName, setWorkspaceEditName] = useState("");
  const [groupName, setGroupName] = useState("To-Do");
  const [groupColor, setGroupColor] = useState(groupColors[0]);
  const [columns, setColumns] = useState(defaultColumns);

  const currentWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.workspace_id === selectedWorkspaceId),
    [selectedWorkspaceId, workspaces]
  );
  const todoTasks = tasks.filter((task) => task.status !== "Completed");

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
      } else {
        setTasks([]);
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
    } catch (updateError) {
      setError(updateError.message);
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
        body: JSON.stringify({ ...form, workspaceId: selectedWorkspaceId }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not save task.");
      }

      setForm(emptyTask);
      setIsAddingTask(false);
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

  function startNewTask() {
    setForm(emptyTask);
    setIsAddingTask(true);
  }

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
      className={`grid h-full min-h-0 overflow-hidden rounded-2xl border border-[#d6deed] bg-white shadow-sm transition-[grid-template-columns] ${
        isWorkspaceSidebarCollapsed
          ? "lg:grid-cols-[40px_minmax(0,1fr)]"
          : "lg:grid-cols-[300px_minmax(0,1fr)]"
      }`}
    >
      <aside className="relative overflow-visible border-b border-[#d6deed] bg-[#BBE1FA] p-4 lg:border-b-0 lg:border-r">
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

      <section className="flex min-h-0 min-w-0 flex-col bg-white">
        <div className="shrink-0 border-b border-[#d6deed] px-6 py-5">
          <button
            type="button"
            onClick={openWorkspaceDetails}
            disabled={!currentWorkspace}
            className="inline-flex items-center gap-2 rounded-md text-left text-3xl font-bold text-[#2f3442] transition hover:bg-[#e8f3ff] disabled:cursor-default disabled:hover:bg-transparent"
          >
            {currentWorkspace?.workspace_name ?? "Workspace"}
            {currentWorkspace ? <span className="text-xl text-[#667085]">⌄</span> : null}
          </button>

          {error ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-6 py-6">
          {currentWorkspace ? (
            <TaskGroup
              availableColumns={defaultColumns}
              color={groupColor}
              title={groupName}
              columns={columns}
              employees={employees}
              tasks={todoTasks}
              emptyText="Blank workspace ready. Add your first task."
              isAddingTask={isAddingTask}
              form={form}
              groupColors={groupColors}
              onColorChange={setGroupColor}
              onColumnToggle={toggleColumn}
              onGroupNameChange={setGroupName}
              onUpdateField={updateField}
              onSaveTask={saveTask}
              onCancelTask={() => {
                setForm(emptyTask);
                setIsAddingTask(false);
              }}
              onAddTask={startNewTask}
              onReorderTasks={reorderTasks}
              onTaskUpdate={updateTask}
              onStatusChange={updateTaskStatus}
            />
          ) : (
            <TemplatePrompt onCreateBlank={() => createWorkspaceWithName("Blank workspace")} />
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
    <div className="absolute right-3 top-13 z-30 w-60 overflow-hidden rounded-xl border border-white/60 bg-white/20 shadow-[0_18px_50px_rgba(7,24,59,0.18)] backdrop-blur-sm">
      <MenuButton label="Rename" onClick={onRename} />
      <div className="border-t border-[#edf1f7] px-3 py-2">
        <p className="text-xs font-bold uppercase tracking-wide text-[#667085]">
          Change visibility
        </p>
        <div className="mt-2 grid gap-1">
          <MenuButton
            label="Change to private"
            onClick={onPrivate}
            isActive={workspace.visibility === "Private"}
          />
          <MenuButton
            label="Change to public"
            onClick={onPublic}
            isActive={workspace.visibility === "Public"}
          />
        </div>
      </div>
      <MenuButton label={isFavorite ? "Remove from favourites" : "Add to favourites"} onClick={onFavorite} />
      <MenuButton label="Duplicate" onClick={onDuplicate} />
      <MenuButton label="Archive" onClick={onArchive} />
      <MenuButton label="Delete" onClick={onDelete} isDanger />
    </div>
  );
}

function MenuButton({ isActive = false, isDanger = false, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold transition hover:bg-[#eef6ff] ${
        isDanger ? "text-[#DF2F4A]" : "text-[#2f3442]"
      }`}
    >
      <span>{label}</span>
      {isActive ? <span className="text-xs text-[#667085]">✓</span> : null}
    </button>
  );
}

function TemplatePrompt({ onCreateBlank }) {
  return (
    <div className="max-w-3xl">
      <h3 className="text-2xl font-bold text-[#2f3442]">Start with a template</h3>
      <p className="mt-2 text-sm text-[#667085]">
        Choose a blank workspace now. More templates can be added later.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <button
          type="button"
          onClick={onCreateBlank}
          className="rounded-xl border border-[#0a72e8] bg-[#eef6ff] p-5 text-left transition hover:bg-[#dcecff]"
        >
          <p className="text-lg font-bold text-[#07183b]">Blank workspace</p>
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
  columns,
  employees,
  tasks,
  emptyText,
  isAddingTask,
  form,
  groupColors,
  onColorChange,
  onColumnToggle,
  onGroupNameChange,
  onUpdateField,
  onSaveTask,
  onCancelTask,
  onAddTask,
  onReorderTasks,
  onTaskUpdate,
  onStatusChange,
}) {
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
    <section className="mb-10 w-max min-w-full">
      <div className="mb-3 inline-flex">
        <button
          type="button"
          onClick={() => setIsGroupSettingsOpen((current) => !current)}
          className="flex items-center gap-3 rounded-md text-2xl font-bold transition hover:bg-[#eef6ff]"
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
          onClose={() => setIsGroupSettingsOpen(false)}
          onColorChange={onColorChange}
          onColumnToggle={onColumnToggle}
          onTitleChange={onGroupNameChange}
        />
      ) : null}

      <div className="overflow-visible bg-white">
        <div
          className="grid border-b border-[#d6deed] text-sm font-bold text-[#2f3442]"
          style={{ gridTemplateColumns }}
        >
          <div className="bg-[#fbfcff] p-2" />
          <div className="bg-[#fbfcff] p-3" />
          {columns.map((column) => (
            <div key={column} className="bg-[#fbfcff] p-3">
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
            <div />
            <div className="p-3" />
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
          <div className="flex items-center justify-center p-2">
            <span className="text-base font-bold leading-none text-[#CBD5E1]">⋮⋮</span>
          </div>
          <div className="flex items-center justify-center p-3">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[#d6deed] text-[#07183b]"
              aria-label="Select new task row"
            />
          </div>
          <button
            type="button"
            onClick={onAddTask}
            className="p-3 text-left hover:bg-[#f8faff] focus:bg-[#e8f3ff] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#07183b]"
            style={{ gridColumn: `span ${columns.length}` }}
          >
            + Add task
          </button>
        </div>
      </div>

    </section>
  );
}

function GroupSettingsPopover({
  availableColumns,
  color,
  colors,
  columns,
  title,
  onClose,
  onColorChange,
  onColumnToggle,
  onTitleChange,
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
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-lg px-4 text-base font-bold text-[#667085] hover:bg-white/70"
          >
            Close
          </button>
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
      } ${isSelected ? "bg-[#93C5FD]" : "bg-white"}`}
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
        className="flex cursor-grab items-center justify-center p-2 text-[#98A2B3] active:cursor-grabbing"
        onMouseDown={onPrepareDrag}
        onMouseUp={onReleaseDrag}
        onTouchStart={onPrepareDrag}
        onTouchEnd={onReleaseDrag}
      >
        <span className="select-none text-base font-bold leading-none" title="Drag row">
          ⋮⋮
        </span>
      </div>
      <div className="flex items-center justify-center p-3">
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
  task,
  status,
  onStatusChange,
  onTaskUpdate,
}) {
  if (column === "Task") {
    return (
      <EditableTextCell
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

  const values = {
    Owner: task.owner_id ? "Owner" : "-",
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

  return (
    <div className="relative p-2">
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

function EditableTextCell({ value, description, onSave }) {
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
      <div className="p-2">
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
      className="min-h-14 p-3 text-left transition hover:bg-[#f8faff]"
      title="Edit task"
    >
      <p className="font-semibold">{value}</p>
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
  return employee?.username || employee?.email || "Employee";
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
