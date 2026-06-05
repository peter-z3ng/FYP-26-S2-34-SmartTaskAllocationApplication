"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const emptyTask = {
  taskId: "",
  title: "",
  description: "",
  status: "Open",
  priority: "Medium",
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

const statusStyles = {
  Open: "bg-[#579BFC] text-white",
  "In Progress": "bg-[#FDAB3D] text-white",
  Completed: "bg-[#00C875] text-white",
  Cancelled: "bg-[#DF2F4A] text-white",
};

export default function WorkspaceManagement() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyTask);
  const [error, setError] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [isWorkspaceDetailsOpen, setIsWorkspaceDetailsOpen] = useState(false);
  const [workspaceEditName, setWorkspaceEditName] = useState("");
  const [columns, setColumns] = useState(defaultColumns);
  const [newColumnName, setNewColumnName] = useState("");

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

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadWorkspaces();
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
          priority: task.priority ?? "Medium",
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

  function editTask(task) {
    setForm({
      taskId: task.task_id,
      title: task.title ?? "",
      description: task.description ?? "",
      status: task.status ?? "Open",
      priority: task.priority ?? "Medium",
      startDatetime: task.start_datetime ? task.start_datetime.slice(0, 16) : "",
      endDatetime: task.end_datetime ? task.end_datetime.slice(0, 16) : "",
    });
    setIsComposerOpen(true);
  }

  function startNewTask() {
    setForm(emptyTask);
    setIsComposerOpen((current) => !current);
  }

  function addColumn(event) {
    event.preventDefault();
    const nextColumn = newColumnName.trim();

    if (!nextColumn || columns.includes(nextColumn)) {
      return;
    }

    setColumns((current) => [...current, nextColumn]);
    setNewColumnName("");
  }

  return (
    <div className="grid h-full min-h-0 overflow-hidden rounded-2xl border border-[#d6deed] bg-white shadow-sm lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="overflow-y-auto border-b border-[#d6deed] bg-[#BBE1FA] p-6 lg:border-b-0 lg:border-r">
        <h2 className="text-lg font-medium text-[#0D1E4C]">Workspace</h2>

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
              <button
                key={workspace.workspace_id}
                type="button"
                onClick={() => setSelectedWorkspaceId(workspace.workspace_id)}
                className={`flex h-12 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition ${
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

          {isComposerOpen ? (
            <form
              onSubmit={saveTask}
              className="mt-5 grid gap-3 rounded-lg border border-[#d8e0ee] bg-[#fbfcff] p-4 lg:grid-cols-[1fr_150px_150px_190px_190px_auto]"
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
              <select
                value={form.priority}
                onChange={(event) => updateField("priority", event.target.value)}
                className="h-11 rounded-md border border-[#c4ccdc] bg-white px-3 text-sm outline-none"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
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
                className="min-h-20 rounded-md border border-[#c4ccdc] bg-white px-3 py-2 text-sm outline-none lg:col-span-6"
              />
            </form>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-6 py-6">
          {currentWorkspace ? (
            <TaskGroup
              color="#579BFC"
              title="To-Do"
              columns={columns}
              tasks={todoTasks}
              emptyText="Blank workspace ready. Add your first task."
              newColumnName={newColumnName}
              onNewColumnNameChange={setNewColumnName}
              onAddColumn={addColumn}
              onAddTask={startNewTask}
              onStatusChange={updateTaskStatus}
            />
          ) : (
            <TemplatePrompt onCreateBlank={() => createWorkspaceWithName("Blank workspace")} />
          )}
        </div>
      </section>

      {isWorkspaceDetailsOpen && currentWorkspace ? (
        <div className="fixed inset-0 z-40 bg-black/20 p-6 backdrop-blur-sm">
          <form
            onSubmit={updateWorkspaceName}
            className="mx-auto mt-20 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-[0_24px_80px_rgba(7,24,59,0.22)]"
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
  color,
  title,
  columns,
  tasks,
  emptyText,
  newColumnName,
  onNewColumnNameChange,
  onAddColumn,
  onAddTask,
  onStatusChange,
}) {
  const gridTemplateColumns = `44px ${columns
    .map((column) => (column === "Task" ? "minmax(260px,1.8fr)" : "minmax(150px,1fr)"))
    .join(" ")}`;

  return (
    <section className="mb-10 min-w-[1600px]">
      <h3 className="mb-3 flex items-center gap-3 text-2xl font-bold" style={{ color }}>
        <span className="text-xl">⌄</span>
        {title}
      </h3>

      <div className="overflow-hidden rounded-lg border border-[#d6deed] bg-white shadow-sm">
        <div
          className="grid border-l-8 text-sm font-bold text-[#2f3442]"
          style={{ borderLeftColor: color, gridTemplateColumns }}
        >
          <div className="border-r border-[#d6deed] bg-[#fbfcff] p-3">
            <span className="block h-5 w-5 rounded border border-[#b8c4d8]" />
          </div>
          {columns.map((column) => (
            <div key={column} className="border-r border-[#d6deed] bg-[#fbfcff] p-3">
              {column}
            </div>
          ))}
        </div>

        {tasks.length ? (
          tasks.map((task) => (
            <TaskRow
              key={task.task_id}
              task={task}
              color={color}
              columns={columns}
              gridTemplateColumns={gridTemplateColumns}
              onStatusChange={onStatusChange}
            />
          ))
        ) : (
          <div
            className="grid border-l-8 border-t border-[#d6deed] text-sm text-[#667085]"
            style={{ borderLeftColor: color, gridTemplateColumns }}
          >
            <div className="border-r border-[#d6deed] p-3" />
            <div className="p-3" style={{ gridColumn: `span ${columns.length}` }}>
              {emptyText}
            </div>
          </div>
        )}

        <div
          className="grid border-l-8 border-t border-[#d6deed] text-sm text-[#667085]"
          style={{ borderLeftColor: color, gridTemplateColumns }}
        >
          <div className="border-r border-[#d6deed] p-3">
            <span className="block h-5 w-5 rounded border border-[#d6deed]" />
          </div>
          <button
            type="button"
            onClick={onAddTask}
            className="p-3 text-left hover:bg-[#f8faff]"
            style={{ gridColumn: `span ${columns.length}` }}
          >
            + Add task
          </button>
        </div>
      </div>

      <form onSubmit={onAddColumn} className="mt-4 flex max-w-sm gap-2">
        <input
          value={newColumnName}
          onChange={(event) => onNewColumnNameChange(event.target.value)}
          placeholder="Add column"
          className="h-10 min-w-0 flex-1 rounded-md border border-[#c4ccdc] px-3 text-sm outline-none"
        />
        <button className="h-10 rounded-md border border-[#c4ccdc] px-3 text-sm font-bold hover:bg-[#eef6ff]">
          Add
        </button>
      </form>
    </section>
  );
}

function TaskRow({ task, color, columns, gridTemplateColumns, onStatusChange }) {
  const status = task.status || "Open";

  return (
    <div
      className="grid border-l-8 border-t border-[#d6deed] text-sm text-[#2f3442]"
      style={{ borderLeftColor: color, gridTemplateColumns }}
    >
      <div className="border-r border-[#d6deed] p-3">
        <span className="block h-5 w-5 rounded border border-[#b8c4d8]" />
      </div>
      {columns.map((column) => (
        <TaskCell key={column} column={column} task={task} status={status} onStatusChange={onStatusChange} />
      ))}
    </div>
  );
}

function TaskCell({ column, task, status, onStatusChange }) {
  if (column === "Task") {
    return (
      <div className="border-r border-[#d6deed] p-3">
        <p className="font-semibold">{task.title}</p>
        {task.description ? (
          <p className="mt-1 line-clamp-1 text-xs text-[#667085]">{task.description}</p>
        ) : null}
      </div>
    );
  }

  if (column === "Status") {
    return (
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
      </div>
    );
  }

  const values = {
    Owner: task.owner_id ? "Owner" : "-",
    "Assigned to": task.assigned_to ? "Assigned" : "-",
    Priority: task.priority ?? "Medium",
    "Due Date": formatDate(task.end_datetime),
    Timeline: formatTimeline(task.start_datetime, task.end_datetime),
    "Last updated": formatDate(task.updated_at),
  };

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
    <div className="border-r border-[#d6deed] p-3 text-center text-[#667085]">
      {value || "-"}
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
