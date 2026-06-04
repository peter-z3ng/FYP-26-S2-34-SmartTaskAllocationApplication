"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const emptyTask = {
  taskId: "",
  title: "",
  description: "",
  status: "Open",
  startDatetime: "",
  endDatetime: "",
};

const statusStyles = {
  Open: "bg-[#579BFC] text-white",
  "In Progress": "bg-[#FDAB3D] text-white",
  Completed: "bg-[#00C875] text-white",
  Cancelled: "bg-[#DF2F4A] text-white",
};

const statusLabels = {
  Open: "To do",
  "In Progress": "Working on it",
  Completed: "Done",
  Cancelled: "Stuck",
};

export default function WorkspaceManagement() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyTask);
  const [error, setError] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");

  const currentWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.workspace_id === selectedWorkspaceId),
    [selectedWorkspaceId, workspaces]
  );
  const activeTasks = tasks.filter((task) => task.status !== "Completed");
  const completedTasks = tasks.filter((task) => task.status === "Completed");

  async function authHeaders() {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    return {
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
    };
  }

  async function loadTasks() {
    try {
      const response = await fetch("/api/tasks", { headers: await authHeaders() });
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

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadTasks();
      loadWorkspaces();
    }, 0);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function createWorkspace(event) {
    event.preventDefault();
    const nextName = workspaceName.trim();

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
        body: JSON.stringify(form),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not save task.");
      }

      setForm(emptyTask);
      setIsComposerOpen(false);
      await loadTasks();
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  async function updateTaskStatus(task, status) {
    setError("");

    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          taskId: task.task_id,
          title: task.title ?? "",
          description: task.description ?? "",
          status,
          startDatetime: task.start_datetime ?? "",
          endDatetime: task.end_datetime ?? "",
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update task status.");
      }

      await loadTasks();
    } catch (statusError) {
      setError(statusError.message);
    }
  }

  async function deleteTask(taskId) {
    if (!window.confirm("Delete this task?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks?taskId=${taskId}`, {
        method: "DELETE",
        headers: await authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not delete task.");
      }

      await loadTasks();
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
    setIsComposerOpen(true);
  }

  function startNewTask() {
    setForm(emptyTask);
    setIsComposerOpen((current) => !current);
  }

  return (
    <div className="grid min-h-[720px] overflow-hidden rounded-2xl border border-[#d6deed] bg-white shadow-sm lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="border-b border-[#d6deed] bg-white p-6 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-medium text-[#626779]">Workspace</h2>
          <div className="flex items-center gap-4 text-2xl text-[#626779]">
            <button type="button" aria-label="Workspace options" title="Options">
              ...
            </button>
            <button type="button" aria-label="Search workspaces" title="Search">
              ⌕
            </button>
            <button type="button" aria-label="Collapse workspace menu" title="Collapse">
              ≪
            </button>
          </div>
        </div>

        <form onSubmit={createWorkspace} className="mt-6 flex gap-2">
          <input
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
            placeholder="Create workspace"
            className="h-12 min-w-0 flex-1 rounded-md border border-[#c4ccdc] bg-white px-3 text-sm text-[#2f3442] outline-none focus:border-[#0a72e8] focus:ring-2 focus:ring-[#0a72e8]/15"
          />
          <button
            type="submit"
            className="h-12 rounded-md bg-[#0a72e8] px-4 text-sm font-bold text-white transition hover:bg-[#075fc2]"
          >
            Add
          </button>
        </form>

        <div className="mt-5">
          <div className="mt-3 space-y-2">
            {workspaces.map((workspace) => {
              const isActive = workspace.workspace_id === selectedWorkspaceId;

              return (
                <button
                  key={workspace.workspace_id}
                  type="button"
                  onClick={() => setSelectedWorkspaceId(workspace.workspace_id)}
                  className={`flex h-12 w-full items-center gap-3 rounded-md px-3 text-left text-lg font-medium transition ${
                    isActive
                      ? "bg-[#cfe7ff] text-[#233246]"
                      : "text-[#667085] hover:bg-[#eef6ff] hover:text-[#233246]"
                  }`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md text-xl text-[#475467]">
                    ▣
                  </span>
                  <span className="min-w-0 truncate">{workspace.workspace_name}</span>
                </button>
              );
            })}
            {!workspaces.length ? (
              <p className="rounded-md border border-dashed border-[#c4ccdc] px-3 py-4 text-sm text-[#667085]">
                Create your first workspace to begin.
              </p>
            ) : null}
          </div>
        </div>
      </aside>

      <section className="min-w-0 bg-white">
        <div className="border-b border-[#d6deed] px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-[#2f3442]">
                {currentWorkspace?.workspace_name ?? "Workspace"}
              </h2>
              <div className="mt-4 flex items-center gap-6 border-b border-[#d6deed] text-sm font-semibold text-[#606575]">
                <span className="border-b-2 border-[#0a72e8] pb-3 text-[#2f3442]">
                  Main table
                </span>
                <span className="pb-3">Cards</span>
                <button
                  type="button"
                  onClick={startNewTask}
                  className="pb-3 text-xl leading-none"
                  aria-label="Add task view"
                  title="Add task"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-[#606575]">
              <button
                type="button"
                onClick={startNewTask}
                className="h-11 rounded-md bg-[#0a72e8] px-5 font-bold text-white transition hover:bg-[#075fc2]"
              >
                New task
              </button>
              <ToolbarButton label="Search" icon="⌕" />
              <ToolbarButton label="Filter" icon="▽" />
              <ToolbarButton label="Sort" icon="↕" />
              <ToolbarButton label="Hide" icon="◌" />
            </div>
          </div>

          {isComposerOpen ? (
            <form
              onSubmit={saveTask}
              className="mt-5 grid gap-3 rounded-lg border border-[#d8e0ee] bg-[#fbfcff] p-4 lg:grid-cols-[1fr_160px_190px_190px_auto]"
            >
              <input
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                placeholder="Task title"
                required
                className="h-11 rounded-md border border-[#c4ccdc] bg-white px-3 text-sm outline-none"
              />
              <select
                value={form.status}
                onChange={(event) => updateField("status", event.target.value)}
                className="h-11 rounded-md border border-[#c4ccdc] bg-white px-3 text-sm outline-none"
              >
                <option>Open</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>
              <input
                type="datetime-local"
                value={form.startDatetime}
                onChange={(event) => updateField("startDatetime", event.target.value)}
                className="h-11 rounded-md border border-[#c4ccdc] bg-white px-3 text-sm outline-none"
              />
              <input
                type="datetime-local"
                value={form.endDatetime}
                onChange={(event) => updateField("endDatetime", event.target.value)}
                className="h-11 rounded-md border border-[#c4ccdc] bg-white px-3 text-sm outline-none"
              />
              <button className="h-11 rounded-md bg-[#07183b] px-5 text-sm font-bold text-white">
                {form.taskId ? "Update" : "Create"}
              </button>
              <textarea
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder="Description"
                className="min-h-20 rounded-md border border-[#c4ccdc] bg-white px-3 py-2 text-sm outline-none lg:col-span-5"
              />
            </form>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <div className="overflow-x-auto px-6 py-6">
          <TaskGroup
            color="#579BFC"
            title="To-Do"
            tasks={activeTasks}
            emptyText="No open tasks yet."
            onEdit={editTask}
            onDelete={deleteTask}
            onStatusChange={updateTaskStatus}
          />

          <TaskGroup
            color="#00C875"
            title="Completed"
            tasks={completedTasks}
            emptyText="Completed tasks will appear here."
            onEdit={editTask}
            onDelete={deleteTask}
            onStatusChange={updateTaskStatus}
          />
        </div>
      </section>
    </div>
  );
}

function ToolbarButton({ icon, label }) {
  return (
    <button
      type="button"
      className="flex h-10 items-center gap-2 rounded-md px-3 font-semibold transition hover:bg-[#eef6ff]"
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  );
}

function TaskGroup({ color, title, tasks, emptyText, onEdit, onDelete, onStatusChange }) {
  return (
    <section className="mb-10 min-w-[920px]">
      <h3 className="mb-3 flex items-center gap-3 text-2xl font-bold" style={{ color }}>
        <span className="text-xl">⌄</span>
        {title}
      </h3>

      <div className="overflow-hidden rounded-lg border border-[#d6deed] bg-white shadow-sm">
        <div className="grid grid-cols-[44px_minmax(260px,1.7fr)_150px_190px_170px_150px] border-l-8 text-sm font-bold text-[#2f3442]" style={{ borderLeftColor: color }}>
          <TableHead />
        </div>

        {tasks.length ? (
          tasks.map((task) => (
            <TaskRow
              key={task.task_id}
              task={task}
              color={color}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))
        ) : (
          <div className="grid grid-cols-[44px_minmax(260px,1.7fr)_150px_190px_170px_150px] border-l-8 border-t border-[#d6deed] text-sm text-[#667085]" style={{ borderLeftColor: color }}>
            <div className="border-r border-[#d6deed] p-3" />
            <div className="col-span-5 p-3">{emptyText}</div>
          </div>
        )}

        <div className="grid grid-cols-[44px_minmax(260px,1.7fr)_150px_190px_170px_150px] border-l-8 border-t border-[#d6deed] text-sm text-[#667085]" style={{ borderLeftColor: color }}>
          <div className="border-r border-[#d6deed] p-3">
            <span className="block h-5 w-5 rounded border border-[#d6deed]" />
          </div>
          <div className="col-span-5 p-3">+ Add task</div>
        </div>
      </div>
    </section>
  );
}

function TableHead() {
  return (
    <>
      <div className="border-r border-[#d6deed] bg-[#fbfcff] p-3">
        <span className="block h-5 w-5 rounded border border-[#b8c4d8]" />
      </div>
      <div className="border-r border-[#d6deed] bg-[#fbfcff] p-3">Task</div>
      <div className="border-r border-[#d6deed] bg-[#fbfcff] p-3 text-center">
        Owner
      </div>
      <div className="border-r border-[#d6deed] bg-[#fbfcff] p-3 text-center">
        Status
      </div>
      <div className="border-r border-[#d6deed] bg-[#fbfcff] p-3 text-center">
        Due date
      </div>
      <div className="bg-[#fbfcff] p-3 text-center">Actions</div>
    </>
  );
}

function TaskRow({ task, color, onEdit, onDelete, onStatusChange }) {
  const status = task.status || "Open";

  return (
    <div className="grid grid-cols-[44px_minmax(260px,1.7fr)_150px_190px_170px_150px] border-l-8 border-t border-[#d6deed] text-sm text-[#2f3442]" style={{ borderLeftColor: color }}>
      <div className="border-r border-[#d6deed] p-3">
        <span className="block h-5 w-5 rounded border border-[#b8c4d8]" />
      </div>
      <div className="border-r border-[#d6deed] p-3">
        <p className="font-semibold">{task.title}</p>
        {task.description ? (
          <p className="mt-1 line-clamp-1 text-xs text-[#667085]">{task.description}</p>
        ) : null}
      </div>
      <div className="flex items-center justify-center border-r border-[#d6deed] p-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#2f3442] bg-white text-sm font-black">
          P
        </span>
      </div>
      <div className="border-r border-[#d6deed] p-2">
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
        <span className="sr-only">{statusLabels[status] ?? status}</span>
      </div>
      <div className="border-r border-[#d6deed] p-3 text-center">
        {formatDate(task.end_datetime)}
      </div>
      <div className="flex items-center justify-center gap-2 p-2">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="rounded-md border border-[#c4ccdc] px-3 py-2 text-xs font-bold transition hover:bg-[#eef6ff]"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.task_id)}
          className="rounded-md bg-[#DF2F4A] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#c5223d]"
        >
          Delete
        </button>
      </div>
    </div>
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
