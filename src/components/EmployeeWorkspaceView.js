"use client";

import { useEffect, useMemo, useState } from "react";
import { getAuthHeaders } from "@/lib/clientAuth";

const columns = [
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

export default function EmployeeWorkspaceView() {
  const [workspaces, setWorkspaces] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedWorkspace = useMemo(
    () =>
      workspaces.find(
        (workspace) => String(workspace.workspace_id) === String(selectedWorkspaceId),
      ) ?? null,
    [selectedWorkspaceId, workspaces],
  );

  async function authHeaders() {
    return getAuthHeaders();
  }

  async function loadWorkspace(workspaceId = selectedWorkspaceId) {
    setError("");

    try {
      const query = workspaceId ? `?workspaceId=${workspaceId}` : "";
      const response = await fetch(`/api/employee-workspaces${query}`, {
        headers: await authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load workspace.");
      }

      setWorkspaces(result.workspaces ?? []);
      setTasks(result.tasks ?? []);
      setGroups(result.groups ?? []);
      setMembers(result.members ?? []);
      setSelectedWorkspaceId(
        result.selectedWorkspaceId ?? result.workspaces?.[0]?.workspace_id ?? "",
      );
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => loadWorkspace(""), 0);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`grid h-full min-h-0 overflow-hidden rounded-2xl transition-[grid-template-columns] ${
        isSidebarCollapsed
          ? "lg:grid-cols-[40px_minmax(0,1fr)]"
          : "lg:grid-cols-[300px_minmax(0,1fr)]"
      }`}
    >
      <aside className="relative overflow-visible border-r border-white/40 px-3 py-4">
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((current) => !current)}
          className="absolute right-1.5 top-6.5 flex items-center justify-center font-bold text-[#1E293B] hover:text-[#1E40AF]"
          aria-label={isSidebarCollapsed ? "Expand workspace menu" : "Collapse workspace menu"}
          title={isSidebarCollapsed ? "Expand workspace menu" : "Collapse workspace menu"}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "26px" }}
            aria-hidden="true"
          >
            {isSidebarCollapsed ? "left_panel_open" : "left_panel_close"}
          </span>
        </button>

        {isSidebarCollapsed ? (
          <div className="flex h-full flex-col items-center pt-20 text-[#07183b]">
            <span className="rotate-90 whitespace-nowrap text-md font-semibold tracking-widest">
              Workspace
            </span>
          </div>
        ) : (
          <>
            <h2 className="pt-2 text-lg font-medium text-[#0D1E4C]">Workspace</h2>
            <div className="mt-6 space-y-2">
              {workspaces.map((workspace) => {
                const isActive = workspace.workspace_id === selectedWorkspaceId;

                return (
                  <button
                    key={workspace.workspace_id}
                    type="button"
                    onClick={() => loadWorkspace(workspace.workspace_id)}
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

              {!workspaces.length && !isLoading ? (
                <p className="rounded-md border border-dashed border-[#c4ccdc] px-3 py-4 text-sm text-[#667085]">
                  Assigned workspaces will appear here.
                </p>
              ) : null}
            </div>
          </>
        )}
      </aside>

      <section className="flex min-h-0 min-w-0 flex-col pl-6">
        <div className="shrink-0 border-b border-[#d6deed] pr-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-bold text-[#2f3442]">
              {selectedWorkspace?.workspace_name ?? "Workspace"}
            </h1>
            <span className="rounded-full border border-[#c4ccdc] bg-white/40 px-3 py-1 text-xs font-bold text-[#667085]">
              View only
            </span>
          </div>

          {error ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-auto py-6 pr-6">
          {selectedWorkspace ? (
            <>
              {(groups.length ? groups : [{ group_id: "__default", group_name: "To-Do" }]).map(
                (group, index) => {
                  const firstGroupId = groups[0]?.group_id;
                  const groupTasks = tasks.filter(
                    (task) =>
                      task.group_id === group.group_id ||
                      ((group.group_id === firstGroupId || group.group_id === "__default") &&
                        task.group_id == null),
                  );

                  return (
                    <ReadOnlyTaskGroup
                      key={group.group_id}
                      title={group.group_name}
                      color={groupColors[index % groupColors.length]}
                      tasks={groupTasks}
                      members={members}
                    />
                  );
                },
              )}

              {!tasks.length ? (
                <p className="mt-4 rounded-xl border border-dashed border-white/60 px-6 py-12 text-center text-sm font-medium text-[#0D1E4C]/60">
                  No tasks assigned to you in this workspace.
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-white/60 px-6 py-12 text-center text-sm font-medium text-[#0D1E4C]/60">
              Workspaces with tasks assigned to you will appear here.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function ReadOnlyTaskGroup({ title, color, tasks, members }) {
  const gridTemplateColumns = `32px 44px ${columns
    .map((column) => (column === "Task" ? "360px" : "190px"))
    .join(" ")}`;

  return (
    <section className="mb-10 w-max min-w-full rounded-xl">
      <div className="mb-3 flex min-w-full items-center gap-4">
        <span
          className="sticky left-0 z-30 flex items-center gap-3 rounded-md pr-4 text-2xl font-bold"
          style={{ color }}
        >
          <span className="text-xl">⌄</span>
          {title}
        </span>
      </div>

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
            <ReadOnlyTaskRow
              key={task.task_id}
              task={task}
              members={members}
              gridTemplateColumns={gridTemplateColumns}
            />
          ))
        ) : (
          <div
            className="grid border-b border-[#d6deed] text-sm text-[#667085]"
            style={{ gridTemplateColumns }}
          >
            <div className="sticky left-0 z-20 bg-white" />
            <div className="sticky left-[32px] z-20 bg-white p-3" />
            <div className="p-3" style={{ gridColumn: `span ${columns.length}` }}>
              No tasks in this group.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ReadOnlyTaskRow({ task, members, gridTemplateColumns }) {
  const status = task.status || "Open";

  return (
    <div
      className="relative grid border-b border-[#d6deed] bg-transparent text-sm text-[#2f3442] transition hover:bg-white/20"
      style={{ gridTemplateColumns }}
    >
      <div className="sticky left-0 z-20 flex items-center justify-center bg-white p-2 text-[#cbd5e1]">
        <span className="select-none text-base font-bold leading-none">⋮⋮</span>
      </div>
      <div className="sticky left-[32px] z-20 flex items-center justify-center bg-white p-3" />
      {columns.map((column) => (
        <ReadOnlyTaskCell
          key={column}
          column={column}
          task={task}
          status={status}
          members={members}
        />
      ))}
    </div>
  );
}

function ReadOnlyTaskCell({ column, task, status, members }) {
  if (column === "Task") {
    return (
      <div className="sticky left-[76px] z-20 block min-h-14 w-full overflow-hidden bg-white p-3 text-left">
        <p className="truncate font-semibold">{task.title}</p>
        {task.description ? (
          <p className="mt-1 line-clamp-1 text-xs text-[#667085]">{task.description}</p>
        ) : null}
      </div>
    );
  }

  if (column === "Status") {
    return (
      <div className="p-2">
        <span
          className={`flex h-10 w-full items-center justify-center rounded-md px-2 text-center text-sm font-bold ${
            statusStyles[status] ?? statusStyles.Open
          }`}
        >
          {status}
        </span>
      </div>
    );
  }

  if (column === "Owner") {
    return <TableText value={memberName(members, task.owner_id)} />;
  }

  if (column === "Assigned to") {
    const member = members.find((entry) => entry.user_id === task.assigned_to);

    return (
      <div className="flex min-h-14 items-center justify-center gap-2 p-2 text-sm font-semibold text-[#667085]">
        {member ? (
          <>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#07183b] text-xs font-bold text-white">
              {getInitials(member)}
            </span>
            <span className="min-w-0 truncate">{getDisplayName(member)}</span>
          </>
        ) : (
          <span className="text-[#98a2b3]">Unassigned</span>
        )}
      </div>
    );
  }

  if (column === "Priority") {
    return <TableText value={task.priority ?? "Medium"} />;
  }

  if (column === "Due Date") {
    return <TableText value={formatDate(task.end_datetime)} />;
  }

  if (column === "Timeline") {
    return <TableText value={formatTimeline(task.start_datetime, task.end_datetime)} />;
  }

  if (column === "Comments") {
    return <TableText value="—" />;
  }

  if (column === "Files") {
    return <TableText value="—" />;
  }

  if (column === "Last updated") {
    return <TableText value={formatDate(task.updated_at)} />;
  }

  return <TableText value="-" />;
}

function TableText({ value }) {
  return <div className="min-h-14 p-3 text-center text-[#667085]">{value || "-"}</div>;
}

function memberName(members, userId) {
  const member = members.find((entry) => entry.user_id === userId);
  return member ? getDisplayName(member) : "—";
}

function getDisplayName(member) {
  return member?.full_name || member?.username || member?.email || "Employee";
}

function getInitials(member) {
  const name = getDisplayName(member);
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

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
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
