"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProfileSettingsForm from "@/components/ProfileSettingsForm";
import SupportInquiryForm from "@/components/SupportInquiryForm";
import UserFeedbackForm from "@/components/UserFeedbackForm";
import UserTierBadge from "@/components/UserTierBadge";
import { getAuthHeaders } from "@/lib/clientAuth";

function formatDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function statusClass(status) {
  const normalized = String(status ?? "").toLowerCase();
  if (["pending", "open", "assigned"].includes(normalized)) return "bg-blue-50 text-blue-700 ring-blue-200";
  if (["in progress", "priority"].includes(normalized)) return "bg-amber-50 text-amber-700 ring-amber-200";
  if (["completed", "approved", "active", "resolved"].includes(normalized)) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (["cancelled", "rejected", "archived"].includes(normalized)) return "bg-rose-50 text-rose-700 ring-rose-200";
  return "bg-slate-50 text-slate-700 ring-slate-200";
}

function roleLabel(actor) {
  if (actor === "employee") return "Employee";
  if (actor === "useradmin") return "User Admin";
  return "Manager";
}

function roleHome(actor) {
  if (actor === "employee") return "/employee/workspace";
  if (actor === "useradmin") return "/useradmin/accounts";
  return "/manager/workspace";
}

async function fetchJson(path, headers) {
  const response = await fetch(path, { headers });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || `Could not load ${path}.`);
  }

  return result;
}

function readStoredIds(key) {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(window.localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function writeStoredIds(key, ids) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify([...ids]));
}

function normalizeNotification(item) {
  return {
    id: item.id,
    title: item.title || "Notification",
    text: item.text || "",
    status: item.status || "Open",
    href: item.href || "",
    createdAt: item.createdAt || new Date().toISOString(),
    type: item.type || "Notification",
  };
}

function taskNotification(task, actor) {
  const dueDate = task.end_datetime || task.start_datetime || task.created_at;
  return normalizeNotification({
    id: `${actor}-task-${task.task_id}`,
    title: task.status === "Completed" ? "Task completed" : "Task update",
    text: `${task.title || "Task"} is ${String(task.status || "Open").toLowerCase()} and due ${shortDate(dueDate)}.`,
    status: task.status || "Open",
    href: actor === "employee" ? "/employee/tasks" : "/manager/workspace",
    createdAt: task.updated_at || task.created_at || dueDate,
    type: "Task",
  });
}

function requestNotification(request, actor) {
  const taskTitle = request.task?.title || "Task assignment request";
  const requester = request.user?.username || request.user?.email || "Employee";
  return normalizeNotification({
    id: `${actor}-request-${request.request_id}`,
    title: `Request ${request.status || "Pending"}`,
    text:
      actor === "employee"
        ? `${taskTitle} is ${String(request.status || "Pending").toLowerCase()}.`
        : `${requester} requested ${taskTitle}.`,
    status: request.status || "Pending",
    href: actor === "employee" ? "/employee/tasks" : "/manager/team",
    createdAt: request.requested_at,
    type: "Request",
  });
}

function mergeItems(items) {
  const byId = new Map();
  for (const item of items.filter(Boolean)) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  return [...byId.values()].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

function StatCard({ label, value, detail }) {
  return (
    <section className="rounded-2xl border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#64748b]">{label}</p>
      <p className="mt-3 text-3xl font-black text-[#07183b]">{value}</p>
      <p className="mt-1 text-sm font-semibold text-[#52627a]">{detail}</p>
    </section>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${statusClass(status)}`}>
      {status || "Open"}
    </span>
  );
}

function PageShell({ eyebrow, title, description, children }) {
  return (
    <section className="h-full min-h-0 overflow-hidden rounded-2xl border border-[#BBE1FA] bg-white/80 shadow-sm backdrop-blur">
      <div className="h-full overflow-y-auto p-5 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5d7290]">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-black text-[#07183b] sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-[#52627a]">{description}</p>
          </div>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}

export function RoleInboxPage({ actor }) {
  const [items, setItems] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const [archivedIds, setArchivedIds] = useState(new Set());
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState("Open");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const readKey = `optima-${actor}-inbox-read`;
  const archiveKey = `optima-${actor}-inbox-archived`;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setReadIds(new Set(readStoredIds(readKey)));
      setArchivedIds(new Set(readStoredIds(archiveKey)));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [archiveKey, readKey]);

  useEffect(() => {
    async function loadInbox() {
      setError("");
      setIsLoading(true);

      try {
        const headers = await getAuthHeaders();
        const notificationsResult = await Promise.allSettled([
          fetchJson("/api/notifications", headers),
          actor === "employee" ? fetchJson("/api/employee-tasks", headers) : fetchJson("/api/tasks", headers),
          fetchJson("/api/task-requests", headers),
        ]);

        const notifications = notificationsResult[0].status === "fulfilled" ? notificationsResult[0].value.items ?? [] : [];
        const taskPayload = notificationsResult[1].status === "fulfilled" ? notificationsResult[1].value : {};
        const requestPayload = notificationsResult[2].status === "fulfilled" ? notificationsResult[2].value : {};
        const taskItems =
          actor === "employee"
            ? [...(taskPayload.assignedTasks ?? []).map((row) => row.task).filter(Boolean), ...(taskPayload.availableTasks ?? [])]
                .slice(0, 8)
                .map((task) => taskNotification(task, actor))
            : (taskPayload.tasks ?? []).slice(0, 8).map((task) => taskNotification(task, actor));
        const requestItems = (requestPayload.requests ?? []).slice(0, 8).map((request) => requestNotification(request, actor));

        setItems(mergeItems([...notifications.map(normalizeNotification), ...taskItems, ...requestItems]));
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadInbox();
  }, [actor]);

  const visibleItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return items.filter((item) => {
      const isArchived = archivedIds.has(item.id);
      const isRead = readIds.has(item.id);
      if (filter === "Open" && isArchived) return false;
      if (filter === "Unread" && (isRead || isArchived)) return false;
      if (filter === "Archived" && !isArchived) return false;
      if (!normalizedSearch) return true;
      return `${item.title} ${item.text} ${item.status} ${item.type}`.toLowerCase().includes(normalizedSearch);
    });
  }, [archivedIds, filter, items, readIds, search]);

  const selectedItem = items.find((item) => item.id === selectedId) ?? visibleItems[0] ?? null;
  const unreadCount = items.filter((item) => !readIds.has(item.id) && !archivedIds.has(item.id)).length;
  const actionCount = items.filter((item) => ["Pending", "Open", "Assigned"].includes(item.status) && !archivedIds.has(item.id)).length;

  function setRead(id) {
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    writeStoredIds(readKey, next);
  }

  function toggleArchive(id) {
    const next = new Set(archivedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setArchivedIds(next);
    writeStoredIds(archiveKey, next);
  }

  function markAllRead() {
    const next = new Set(items.map((item) => item.id));
    setReadIds(next);
    writeStoredIds(readKey, next);
  }

  return (
    <PageShell
      eyebrow={roleLabel(actor)}
      title="Inbox"
      description="Review task updates, request activity, profile alerts, and team notifications in one queue."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Unread" value={unreadCount} detail="not marked as read" />
        <StatCard label="Action needed" value={actionCount} detail="open or pending items" />
        <StatCard label="Total messages" value={items.length} detail={isLoading ? "loading" : "available now"} />
      </div>

      {error ? <p className="dashboard-alert-error mt-5">{error}</p> : null}

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-[#d8e6f3] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search inbox"
              className="h-11 flex-1 rounded-full border border-[#c7ddeb] px-4 text-sm font-semibold text-[#07183b] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20"
            />
            <button type="button" onClick={markAllRead} className="dashboard-button h-11 px-4">
              Mark all read
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Open", "Unread", "Archived"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full px-4 py-2 text-sm font-black ${
                  filter === item ? "bg-[#0d1e4c] text-white" : "bg-[#eef6fb] text-[#0d1e4c]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {isLoading ? <p className="rounded-2xl bg-[#f4f8fb] p-4 text-sm font-semibold text-[#52627a]">Loading inbox...</p> : null}
            {!isLoading && visibleItems.length === 0 ? (
              <p className="rounded-2xl bg-[#f4f8fb] p-4 text-sm font-semibold text-[#52627a]">No inbox items match this view.</p>
            ) : null}
            {visibleItems.map((item) => {
              const isRead = readIds.has(item.id);
              const isSelected = selectedItem?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(item.id);
                    setRead(item.id);
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    isSelected ? "border-[#2563eb] bg-[#eff6ff]" : "border-[#d8e6f3] bg-white hover:bg-[#f8fbfe]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {!isRead ? <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" /> : null}
                        <p className="truncate text-sm font-black text-[#07183b]">{item.title}</p>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#52627a]">{item.text}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-[#d8e6f3] bg-white p-5 shadow-sm">
          {selectedItem ? (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#64748b]">{selectedItem.type}</p>
                  <h2 className="mt-2 text-2xl font-black text-[#07183b]">{selectedItem.title}</h2>
                </div>
                <StatusBadge status={selectedItem.status} />
              </div>
              <p className="mt-4 text-sm leading-7 text-[#52627a]">{selectedItem.text}</p>
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#f4f8fb] p-4">
                  <dt className="text-xs font-black uppercase tracking-[0.14em] text-[#64748b]">Received</dt>
                  <dd className="mt-1 text-sm font-bold text-[#07183b]">{formatDate(selectedItem.createdAt)}</dd>
                </div>
                <div className="rounded-2xl bg-[#f4f8fb] p-4">
                  <dt className="text-xs font-black uppercase tracking-[0.14em] text-[#64748b]">Read state</dt>
                  <dd className="mt-1 text-sm font-bold text-[#07183b]">{readIds.has(selectedItem.id) ? "Read" : "Unread"}</dd>
                </div>
              </dl>
              <div className="mt-6 flex flex-wrap gap-3">
                {selectedItem.href ? (
                  <Link href={selectedItem.href} className="dashboard-button">
                    Open related page
                  </Link>
                ) : null}
                <button type="button" onClick={() => setRead(selectedItem.id)} className="dashboard-secondary-button">
                  Mark read
                </button>
                <button type="button" onClick={() => toggleArchive(selectedItem.id)} className="dashboard-secondary-button">
                  {archivedIds.has(selectedItem.id) ? "Restore to inbox" : "Archive message"}
                </button>
              </div>
            </>
          ) : (
            <p className="rounded-2xl bg-[#f4f8fb] p-5 text-sm font-semibold text-[#52627a]">Select a message to view details.</p>
          )}
        </section>
      </div>
    </PageShell>
  );
}

export function RoleMySpacePage({ actor }) {
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const noteKey = `optima-${actor}-my-space-notes`;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setNotes(window.localStorage.getItem(noteKey) || "");
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [noteKey]);

  useEffect(() => {
    async function loadMySpace() {
      setError("");

      try {
        const headers = await getAuthHeaders();
        const [profileResult, taskResult, notificationResult] = await Promise.allSettled([
          fetchJson("/api/profile", headers),
          actor === "employee" ? fetchJson("/api/employee-tasks", headers) : fetchJson("/api/tasks", headers),
          fetchJson("/api/notifications", headers),
        ]);

        if (profileResult.status === "fulfilled") setProfile(profileResult.value);
        if (taskResult.status === "fulfilled") {
          const payload = taskResult.value;
          const rows =
            actor === "employee"
              ? [...(payload.assignedTasks ?? []).map((row) => row.task).filter(Boolean), ...(payload.availableTasks ?? [])]
              : payload.tasks ?? [];
          setTasks(rows);
        }
        if (notificationResult.status === "fulfilled") setNotifications(notificationResult.value.items ?? []);

        const failed = [profileResult, taskResult, notificationResult].find((result) => result.status === "rejected");
        if (failed) setError(failed.reason.message);
      } catch (loadError) {
        setError(loadError.message);
      }
    }

    loadMySpace();
  }, [actor]);

  function saveNotes(value) {
    setNotes(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(noteKey, value);
    }
  }

  const activeTasks = tasks.filter((task) => !["Completed", "Cancelled"].includes(task.status));
  const urgentTasks = activeTasks.filter((task) => task.priority === "High");

  return (
    <PageShell
      eyebrow={roleLabel(actor)}
      title="My Space"
      description="Manage your profile, avatar review, private notes, and current work focus."
    >
      {error ? <p className="dashboard-alert-error mb-5">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Active work" value={activeTasks.length} detail="open or in progress" />
        <StatCard label="High priority" value={urgentTasks.length} detail="needs attention" />
        <StatCard label="Inbox alerts" value={notifications.length} detail="latest notifications" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-[#d8e6f3] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#64748b]">Profile summary</p>
              <h2 className="mt-2 text-2xl font-black text-[#07183b]">
                {profile?.profile?.full_name || profile?.account?.username || "My profile"}
              </h2>
              <p className="mt-1 text-sm font-semibold text-[#52627a]">{profile?.account?.email || "Loading account..."}</p>
            </div>
            <UserTierBadge tier={profile?.account?.subscription_tier ?? "Starter"} />
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#f4f8fb] p-4">
              <dt className="text-xs font-black uppercase tracking-[0.14em] text-[#64748b]">Role</dt>
              <dd className="mt-1 text-sm font-bold text-[#07183b]">{profile?.account?.role?.role_name || roleLabel(actor)}</dd>
            </div>
            <div className="rounded-2xl bg-[#f4f8fb] p-4">
              <dt className="text-xs font-black uppercase tracking-[0.14em] text-[#64748b]">Avatar review</dt>
              <dd className="mt-1 text-sm font-bold text-[#07183b]">{profile?.avatarReview?.status || "No pending upload"}</dd>
            </div>
          </dl>
          <div className="mt-5">
            <Link href={roleHome(actor)} className="dashboard-secondary-button">
              Back to workspace
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-[#d8e6f3] bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#64748b]">Private notes</p>
          <h2 className="mt-2 text-2xl font-black text-[#07183b]">Focus pad</h2>
          <textarea
            value={notes}
            onChange={(event) => saveNotes(event.target.value)}
            placeholder="Keep personal handover notes, reminders, or follow-up items here."
            className="mt-4 min-h-40 w-full resize-y rounded-2xl border border-[#c7ddeb] bg-[#f8fbfe] px-4 py-3 text-sm font-semibold leading-6 text-[#07183b] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20"
          />
          <p className="mt-3 text-xs font-semibold text-[#64748b]">Saved locally in this browser for demo use.</p>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-2xl border border-[#d8e6f3] bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#64748b]">Current focus</p>
          <h2 className="mt-2 text-2xl font-black text-[#07183b]">Tasks to watch</h2>
          <div className="mt-4 space-y-3">
            {activeTasks.length === 0 ? <p className="rounded-2xl bg-[#f4f8fb] p-4 text-sm font-semibold text-[#52627a]">No active tasks right now.</p> : null}
            {activeTasks.slice(0, 5).map((task) => (
              <div key={task.task_id} className="rounded-2xl border border-[#d8e6f3] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-[#07183b]">{task.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#52627a]">{task.description || "No description."}</p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#d8e6f3] bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#64748b]">Latest alerts</p>
          <h2 className="mt-2 text-2xl font-black text-[#07183b]">Inbox preview</h2>
          <div className="mt-4 space-y-3">
            {notifications.length === 0 ? <p className="rounded-2xl bg-[#f4f8fb] p-4 text-sm font-semibold text-[#52627a]">No notifications yet.</p> : null}
            {notifications.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-2xl border border-[#d8e6f3] p-4">
                <p className="text-sm font-black text-[#07183b]">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-[#52627a]">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6">
        <ProfileSettingsForm />
      </div>
    </PageShell>
  );
}

export function ManagerArchivePage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("Archived workspaces");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadArchive() {
    setError("");

    try {
      const headers = await getAuthHeaders();
      const [workspacePayload, taskPayload] = await Promise.all([
        fetchJson("/api/workspaces", headers),
        fetchJson("/api/tasks", headers),
      ]);

      setWorkspaces(workspacePayload.workspaces ?? []);
      setTasks(taskPayload.tasks ?? []);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(loadArchive, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  async function restoreWorkspace(workspaceId) {
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/workspaces", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({ workspaceId, status: "Active" }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Could not restore workspace.");
      setMessage("Workspace restored.");
      await loadArchive();
    } catch (restoreError) {
      setError(restoreError.message);
    }
  }

  async function reopenTask(task) {
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({
          taskId: task.task_id,
          title: task.title,
          description: task.description,
          assignedTo: task.assigned_to,
          priority: task.priority,
          status: "Open",
          startDatetime: task.start_datetime,
          endDatetime: task.end_datetime,
        }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Could not reopen task.");
      setMessage("Task reopened.");
      await loadArchive();
    } catch (reopenError) {
      setError(reopenError.message);
    }
  }

  const archivedWorkspaces = workspaces.filter((workspace) => workspace.status === "Archived");
  const completedTasks = tasks.filter((task) => ["Completed", "Cancelled"].includes(task.status));

  return (
    <PageShell
      eyebrow="Manager"
      title="Archive"
      description="Review archived workspaces and completed or cancelled tasks, then restore items when operations need them again."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Archived workspaces" value={archivedWorkspaces.length} detail="can be restored" />
        <StatCard label="Closed tasks" value={completedTasks.length} detail="completed or cancelled" />
        <StatCard label="Active records" value={workspaces.length + tasks.length} detail="loaded from workspace data" />
      </div>

      {error ? <p className="dashboard-alert-error mt-5">{error}</p> : null}
      {message ? <p className="dashboard-alert-info mt-5">{message}</p> : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {["Archived workspaces", "Closed tasks"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-full px-4 py-2 text-sm font-black ${
              filter === item ? "bg-[#0d1e4c] text-white" : "bg-[#eef6fb] text-[#0d1e4c]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {filter === "Archived workspaces" &&
          (archivedWorkspaces.length ? (
            archivedWorkspaces.map((workspace) => (
              <section key={workspace.workspace_id} className="rounded-2xl border border-[#d8e6f3] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-[#07183b]">{workspace.workspace_name}</h2>
                    <p className="mt-2 text-sm leading-6 text-[#52627a]">{workspace.description || "No description."}</p>
                  </div>
                  <StatusBadge status={workspace.status} />
                </div>
                <p className="mt-4 text-sm font-semibold text-[#64748b]">Created {formatDate(workspace.created_at)}</p>
                <button type="button" onClick={() => restoreWorkspace(workspace.workspace_id)} className="dashboard-button mt-5">
                  Restore workspace
                </button>
              </section>
            ))
          ) : (
            <p className="rounded-2xl bg-white p-5 text-sm font-semibold text-[#52627a]">No archived workspaces.</p>
          ))}

        {filter === "Closed tasks" &&
          (completedTasks.length ? (
            completedTasks.map((task) => (
              <section key={task.task_id} className="rounded-2xl border border-[#d8e6f3] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-[#07183b]">{task.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[#52627a]">{task.description || "No description."}</p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[#f4f8fb] p-4">
                    <dt className="text-xs font-black uppercase tracking-[0.14em] text-[#64748b]">Priority</dt>
                    <dd className="mt-1 text-sm font-bold text-[#07183b]">{task.priority || "Medium"}</dd>
                  </div>
                  <div className="rounded-2xl bg-[#f4f8fb] p-4">
                    <dt className="text-xs font-black uppercase tracking-[0.14em] text-[#64748b]">Closed around</dt>
                    <dd className="mt-1 text-sm font-bold text-[#07183b]">{shortDate(task.updated_at || task.end_datetime)}</dd>
                  </div>
                </dl>
                <button type="button" onClick={() => reopenTask(task)} className="dashboard-button mt-5">
                  Reopen task
                </button>
              </section>
            ))
          ) : (
            <p className="rounded-2xl bg-white p-5 text-sm font-semibold text-[#52627a]">No closed tasks.</p>
          ))}
      </div>
    </PageShell>
  );
}

export function RoleSupportPage({ actor }) {
  const [activeGuide, setActiveGuide] = useState("Support flow");

  const guides = {
    "Support flow": [
      "Send the support request with issue category and context.",
      "Platform Admin receives the inquiry in the support queue.",
      "Paid accounts are flagged for priority response.",
    ],
    "Feedback flow": [
      "Submit workflow feedback with a 1 to 5 rating.",
      "Platform Admin reviews the feedback and analysis metrics.",
      "Approved feedback can be published to the public homepage.",
    ],
    "Account help": [
      "Password recovery requests route to User Admin support.",
      "Profile avatar uploads route to Platform Admin review.",
      "Rejected avatar uploads return a review note in notifications.",
    ],
  };

  return (
    <PageShell
      eyebrow={roleLabel(actor)}
      title="Support"
      description="Contact platform support, share workflow feedback, and understand how requests move through admin review."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {Object.keys(guides).map((guide) => (
          <button
            key={guide}
            type="button"
            onClick={() => setActiveGuide(guide)}
            className={`rounded-2xl border p-5 text-left shadow-sm transition ${
              activeGuide === guide ? "border-[#2563eb] bg-[#eff6ff]" : "border-[#d8e6f3] bg-white hover:bg-[#f8fbfe]"
            }`}
          >
            <p className="text-sm font-black text-[#07183b]">{guide}</p>
            <p className="mt-2 text-sm leading-6 text-[#52627a]">{guides[guide][0]}</p>
          </button>
        ))}
      </div>

      <section className="mt-5 rounded-2xl border border-[#d8e6f3] bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#64748b]">Workflow guide</p>
        <h2 className="mt-2 text-2xl font-black text-[#07183b]">{activeGuide}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {guides[activeGuide].map((item, index) => (
            <div key={item} className="rounded-2xl bg-[#f4f8fb] p-4">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0d1e4c] text-sm font-black text-white">
                {index + 1}
              </span>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#52627a]">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SupportInquiryForm />
        <UserFeedbackForm />
      </div>
    </PageShell>
  );
}
