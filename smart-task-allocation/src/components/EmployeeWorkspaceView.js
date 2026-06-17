"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const statusStyles = {
  Open: "bg-[#579BFC] text-white",
  "In Progress": "bg-[#FDAB3D] text-white",
  Completed: "bg-[#00C875] text-white",
  Cancelled: "bg-[#DF2F4A] text-white",
};

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default function EmployeeWorkspaceView() {
  const [workspaces, setWorkspaces] = useState([]);
  const [tasks, setTasks] = useState([]);
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
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();

    return {
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
    };
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
      setSelectedWorkspaceId(result.selectedWorkspaceId ?? result.workspaces?.[0]?.workspace_id ?? "");
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
    <section
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

      <div className="min-h-0 overflow-auto">
        <div className="border-b border-[#d6deed] px-8 py-5">
          <h1 className="text-3xl font-black text-[#2f3442]">
            {selectedWorkspace?.workspace_name ?? "Workspace"}
          </h1>
          {error ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <div className="px-8 py-6">
          <h2 className="text-2xl font-black text-[#579BFC]">To-Do</h2>
          <div className="mt-5 min-w-[920px] overflow-hidden rounded-xl border border-[#d6deed] shadow-sm">
            <div className="grid grid-cols-[minmax(220px,1fr)_160px_160px_160px_160px] border-b border-[#d6deed] bg-[#f8faff] text-sm font-black text-[#2f3442]">
              <div className="px-5 py-4">Task</div>
              <div className="px-5 py-4 text-center">Owner</div>
              <div className="px-5 py-4 text-center">Status</div>
              <div className="px-5 py-4 text-center">Priority</div>
              <div className="px-5 py-4 text-center">Due Date</div>
            </div>

            {tasks.map((task) => (
              <div
                key={task.task_id}
                className="grid grid-cols-[minmax(220px,1fr)_160px_160px_160px_160px] border-b border-[#d6deed] text-sm font-semibold text-[#2f3442] last:border-b-0"
              >
                <div className="px-5 py-4">{task.title}</div>
                <div className="px-5 py-4 text-center text-[#667085]">Owner</div>
                <div className="px-5 py-3 text-center">
                  <span
                    className={`inline-flex min-w-28 justify-center rounded-md px-4 py-2 text-xs font-black ${
                      statusStyles[task.status] ?? statusStyles.Open
                    }`}
                  >
                    {task.status ?? "Open"}
                  </span>
                </div>
                <div className="px-5 py-4 text-center text-[#667085]">
                  {task.priority ?? "Medium"}
                </div>
                <div className="px-5 py-4 text-center text-[#667085]">
                  {formatDate(task.end_datetime)}
                </div>
              </div>
            ))}

            {!tasks.length ? (
              <div className="px-5 py-10 text-center text-sm font-medium text-[#667085]">
                No assigned tasks in this workspace.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
