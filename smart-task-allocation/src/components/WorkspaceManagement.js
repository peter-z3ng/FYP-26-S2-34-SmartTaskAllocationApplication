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

  function startNewTask() {
    setForm(emptyTask);
    setIsAddingTask(true);
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
              employees={employees}
              tasks={todoTasks}
              emptyText="Blank workspace ready. Add your first task."
              isAddingTask={isAddingTask}
              form={form}
              newColumnName={newColumnName}
              onUpdateField={updateField}
              onNewColumnNameChange={setNewColumnName}
              onSaveTask={saveTask}
              onCancelTask={() => {
                setForm(emptyTask);
                setIsAddingTask(false);
              }}
              onAddColumn={addColumn}
              onAddTask={startNewTask}
              onTaskUpdate={updateTask}
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
  employees,
  tasks,
  emptyText,
  isAddingTask,
  form,
  newColumnName,
  onUpdateField,
  onNewColumnNameChange,
  onSaveTask,
  onCancelTask,
  onAddColumn,
  onAddTask,
  onTaskUpdate,
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

      <div className="overflow-visible rounded-lg border border-[#d6deed] bg-white shadow-sm">
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
              employees={employees}
              gridTemplateColumns={gridTemplateColumns}
              onTaskUpdate={onTaskUpdate}
              onStatusChange={onStatusChange}
            />
          ))
        ) : !isAddingTask ? (
          <div
            className="grid border-l-8 border-t border-[#d6deed] text-sm text-[#667085]"
            style={{ borderLeftColor: color, gridTemplateColumns }}
          >
            <div className="border-r border-[#d6deed] p-3" />
            <div className="p-3" style={{ gridColumn: `span ${columns.length}` }}>
              {emptyText}
            </div>
          </div>
        ) : null}

        {isAddingTask ? (
          <InlineTaskFormRow
            color={color}
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
          className="grid border-l-8 border-t border-[#d6deed] text-sm text-[#667085]"
          style={{ borderLeftColor: color, gridTemplateColumns }}
        >
          <div className="border-r border-[#d6deed] p-3">
            <span className="block h-5 w-5 rounded border border-[#d6deed]" />
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

function InlineTaskFormRow({
  color,
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
      className="grid border-l-8 border-t border-[#d6deed] bg-[#e8f3ff] text-sm text-[#2f3442]"
      style={{ borderLeftColor: color, gridTemplateColumns }}
    >
      <div className="border-r border-[#d6deed] bg-white p-3">
        <span className="block h-5 w-5 rounded border border-[#b8c4d8]" />
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
      <div className="border-r border-[#d6deed] bg-white p-2">
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
      <div className="border-r border-[#d6deed] bg-white p-2">
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
      <div className="border-r border-[#d6deed] bg-white p-2">
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
      <div className="border-r border-[#d6deed] bg-white p-2">
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
      <div className="border-r border-[#d6deed] bg-white p-2">
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
      <div className="flex items-center gap-2 border-r border-[#d6deed] bg-white p-2">
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
  color,
  columns,
  employees,
  gridTemplateColumns,
  onTaskUpdate,
  onStatusChange,
}) {
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
    <div className="border-r border-[#d6deed] p-3 text-center text-[#667085]">
      {value || "-"}
    </div>
  );
}

function PeoplePickerCell({ employees, selectedUserId, onAssign }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedEmployee = employees.find((employee) => employee.user_id === selectedUserId);
  const filteredEmployees = employees.filter((employee) => {
    const searchText = `${employee.username ?? ""} ${employee.email ?? ""}`.toLowerCase();
    return searchText.includes(query.trim().toLowerCase());
  });

  function closePicker() {
    setQuery("");
    setIsOpen(false);
  }

  return (
    <div className="relative border-r border-[#d6deed] p-2">
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
        <div className="absolute left-2 top-12 z-30 w-80 rounded-xl border border-[#d6deed] bg-white p-3 shadow-[0_18px_50px_rgba(7,24,59,0.18)]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search or enter email..."
            autoFocus
            className="h-11 w-full rounded-md border border-[#c4ccdc] px-3 text-sm text-[#2f3442] outline-none focus:border-[#07183b]"
          />
          <p className="mt-4 px-1 text-xs font-bold uppercase tracking-wide text-[#667085]">
            People
          </p>
          <div className="mt-2 max-h-64 overflow-y-auto">
            {selectedEmployee ? (
              <button
                type="button"
                onClick={() => {
                  onAssign("");
                  closePicker();
                }}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm font-semibold text-[#667085] hover:bg-[#f8faff]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef2f8] text-xs">
                  -
                </span>
                Clear assignment
              </button>
            ) : null}
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
      <div className="border-r border-[#d6deed] p-2">
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
      className="min-h-14 border-r border-[#d6deed] p-3 text-left transition hover:bg-[#f8faff]"
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
      <div className="border-r border-[#d6deed] p-2">
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
      className="min-h-14 border-r border-[#d6deed] p-3 text-center font-semibold text-[#667085] transition hover:bg-[#f8faff]"
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
      <div className="border-r border-[#d6deed] p-2">
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
      className="min-h-14 border-r border-[#d6deed] p-3 text-center text-[#667085] transition hover:bg-[#f8faff]"
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
      <div className="border-r border-[#d6deed] p-2">
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
      className="min-h-14 border-r border-[#d6deed] p-3 text-center text-[#667085] transition hover:bg-[#f8faff]"
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
