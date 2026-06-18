"use client";

import { useEffect, useMemo, useState } from "react";
import { getAuthHeaders } from "@/lib/clientAuth";
import EmployeeProfileCard from "@/components/EmployeeProfileCard";

const VIEWS = [{ value: "history", label: "Task Allocation History" }];

function formatDateHeader(iso) {
  const date = new Date(iso);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(iso) {
  const date = new Date(iso);
  const day = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} at ${time}`;
}

function HoverPill({ label, detail, tone = "slate", maxWidthClass = "max-w-[200px]", variant = "panel" }) {
  const tones = {
    slate: "border-[#0D1E4C]/15 bg-white/70 text-[#0D1E4C]",
    blue: "border-[#2563EB]/25 bg-[#2563EB]/10 text-[#1E40AF]",
    purple: "border-[#7C3AED]/25 bg-[#7C3AED]/10 text-[#5B21B6]",
  };
  return (
    <span className="group/pill relative inline-flex align-middle">
      <span
        className={`inline-block ${maxWidthClass} truncate rounded-full border px-3 py-1 text-sm font-bold leading-5 ${tones[tone]}`}
      >
        {label}
      </span>
      {detail ? (
        variant === "card" ? (
          <span className="absolute left-0 top-full z-40 hidden pt-2 text-left group-hover/pill:block">
            {detail}
          </span>
        ) : (
          <span className="pointer-events-none absolute left-0 top-full z-40 mt-2 hidden w-72 max-w-[80vw] rounded-2xl border border-white/60 bg-white/95 p-4 text-left shadow-[0_18px_50px_rgba(7,24,59,0.2)] backdrop-blur-md group-hover/pill:block">
            {detail}
          </span>
        )
      ) : null}
    </span>
  );
}

export default function AllocationHistory() {
  const [view, setView] = useState("history");
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [allocations, setAllocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [error, setError] = useState("");

  // Reassign modal: targets = array of allocations; phase = "edit" | "confirm".
  const [reassign, setReassign] = useState(null);
  const [reassignWorkspaceId, setReassignWorkspaceId] = useState("");
  const [reassignAssigneeId, setReassignAssigneeId] = useState("");
  const [reassignPhase, setReassignPhase] = useState("edit");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function authHeaders() {
    return {
      "Content-Type": "application/json",
      ...(await getAuthHeaders()),
    };
  }

  async function loadAll() {
    try {
      const headers = await authHeaders();
      const [allocRes, empRes, wsRes] = await Promise.all([
        fetch("/api/allocations", { headers }),
        fetch("/api/employees", { headers }),
        fetch("/api/workspaces", { headers }),
      ]);
      const allocData = await allocRes.json();
      const empData = await empRes.json();
      const wsData = await wsRes.json();
      if (!allocRes.ok) throw new Error(allocData.error || "Could not load allocations.");
      setAllocations(allocData.allocations ?? []);
      setEmployees(empData.employees ?? []);
      setWorkspaces(wsData.workspaces ?? []);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadAll();
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function close() {
      setIsViewOpen(false);
    }
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const employeeById = useMemo(
    () => new Map(employees.map((e) => [e.user_id, e])),
    [employees],
  );

  // Group allocations by calendar date (already sorted desc by API).
  const grouped = useMemo(() => {
    const groups = [];
    const indexByDate = new Map();
    for (const allocation of allocations) {
      const dateKey = formatDateHeader(allocation.assignedAt);
      if (!indexByDate.has(dateKey)) {
        indexByDate.set(dateKey, groups.length);
        groups.push({ dateKey, items: [] });
      }
      groups[indexByDate.get(dateKey)].items.push(allocation);
    }
    return groups;
  }, [allocations]);

  function toggleSelect(id) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openReassign(targets) {
    if (!targets.length) return;
    setReassign(targets);
    setReassignPhase("edit");
    setReassignWorkspaceId(targets[0].workspaceId ?? workspaces[0]?.workspace_id ?? "");
    setReassignAssigneeId(targets.length === 1 ? targets[0].assigneeUserId ?? "" : "");
    setError("");
  }

  function closeReassign() {
    setReassign(null);
    setReassignPhase("edit");
    setIsSubmitting(false);
  }

  async function confirmReassign() {
    if (!reassignWorkspaceId) {
      setError("Choose a workspace.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const headers = await authHeaders();
      for (const target of reassign) {
        // For bulk, keep each task's own assignee; for single, use the chosen one.
        const assignedTo =
          reassign.length === 1 ? reassignAssigneeId : target.assigneeUserId;
        await fetch("/api/tasks", {
          method: "POST",
          headers,
          body: JSON.stringify({
            workspaceId: reassignWorkspaceId,
            title: target.taskTitle,
            assignedTo,
          }),
        });
      }
      closeReassign();
      setSelectedIds(new Set());
      await loadAll();
    } catch (submitError) {
      setError(submitError.message);
      setIsSubmitting(false);
    }
  }

  const selectedAllocations = allocations.filter((a) => selectedIds.has(a.id));
  const workspaceName = (id) =>
    workspaces.find((w) => w.workspace_id === id)?.workspace_name ?? "—";

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header: dropdown title + Bulk Reassign */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
        <div className="relative">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsViewOpen((current) => !current);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/40 px-5 py-2 text-lg font-bold text-[#0D1E4C] backdrop-blur-sm transition hover:bg-white/60"
          >
            {VIEWS.find((v) => v.value === view)?.label}
          </button>
          {isViewOpen ? (
            <div
              className="absolute left-0 top-12 z-30 w-64 overflow-hidden rounded-2xl border border-white/60 bg-white/95 shadow-[0_18px_50px_rgba(7,24,59,0.18)] backdrop-blur-md"
              onClick={(event) => event.stopPropagation()}
            >
              {VIEWS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setView(option.value);
                    setIsViewOpen(false);
                  }}
                  className="block w-full px-4 py-3 text-left text-sm font-semibold text-[#0D1E4C] hover:bg-[#eef6ff]"
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => openReassign(selectedAllocations)}
          disabled={!selectedIds.size}
          className="rounded-full bg-[#0a72e8] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#075fc2] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Bulk Reassign{selectedIds.size ? ` (${selectedIds.size})` : ""}
        </button>
      </div>

      {error ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 space-y-8 overflow-y-auto pr-1">
        {grouped.map((group) => (
          <div key={group.dateKey}>
            <h3 className="mb-3 text-sm font-black uppercase tracking-[0.15em] text-[#0D1E4C]/60">
              {group.dateKey}
            </h3>
            <div className="space-y-2">
              {group.items.map((allocation) => {
                const employee = employeeById.get(allocation.assigneeUserId);
                const byAI = /optimus/i.test(allocation.assignedBy);
                return (
                  <div
                    key={allocation.id}
                    className="relative flex flex-wrap items-center gap-x-2 gap-y-2 rounded-full border border-white/50 bg-white/30 px-4 py-3 backdrop-blur-sm transition-[z-index] hover:z-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(allocation.id)}
                      onChange={() => toggleSelect(allocation.id)}
                      className="mr-2 h-5 w-5 rounded border-[#b8c4d8] text-[#07183b]"
                      aria-label="Select allocation"
                    />
                    <HoverPill
                      label={allocation.assigneeName}
                      tone="blue"
                      variant="card"
                      detail={
                        <EmployeeProfileCard
                          employee={employee ?? { full_name: allocation.assigneeName }}
                        />
                      }
                    />
                    <span className="text-sm leading-7 text-[#52627a]">was assigned to</span>
                    <HoverPill
                      label={allocation.taskTitle}
                      maxWidthClass="max-w-[340px]"
                      detail={
                        <span className="block text-sm text-[#0D1E4C]">
                          <span className="block font-bold break-words">{allocation.taskTitle}</span>
                          <span className="mt-1 block text-xs text-[#667085]">
                            Workspace: {workspaceName(allocation.workspaceId)}
                          </span>
                          <span className="block text-xs text-[#667085]">
                            Status: {allocation.status ?? "Assigned"}
                          </span>
                        </span>
                      }
                    />
                    <span className="text-sm leading-7 text-[#52627a]">by</span>
                    <HoverPill label={allocation.assignedBy} tone={byAI ? "purple" : "slate"} />
                    <span className="text-sm text-[#52627a]">
                      on {formatDateTime(allocation.assignedAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => openReassign([allocation])}
                      className="ml-auto rounded-full border border-[#0a72e8] px-4 py-1.5 text-sm font-bold text-[#0a72e8] transition hover:bg-[#0a72e8] hover:text-white"
                    >
                      Reassign
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {!grouped.length ? (
          <p className="rounded-2xl border border-dashed border-white/60 px-6 py-12 text-center text-sm font-medium text-[#0D1E4C]/60">
            No allocations yet.
          </p>
        ) : null}
      </div>

      {reassign ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={closeReassign}
        >
          <div
            className="w-full max-w-lg rounded-[28px] bg-white p-8 shadow-[0_28px_80px_rgba(0,0,0,0.3)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-2xl font-black text-[#0D1E4C]">
              {reassign.length > 1 ? `Reassign ${reassign.length} tasks` : "Reassign task"}
            </h2>

            {reassignPhase === "edit" ? (
              <div className="mt-6 space-y-5">
                {reassign.length === 1 ? (
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-[#0D1E4C]">Assignee</label>
                    <select
                      value={reassignAssigneeId}
                      onChange={(event) => setReassignAssigneeId(event.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-[#0D1E4C] outline-none focus:border-[#2563EB]"
                    >
                      <option value="">Unassigned</option>
                      {employees.map((employee) => (
                        <option key={employee.user_id} value={employee.user_id}>
                          {employee.full_name || employee.username || employee.email}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#0D1E4C]">Workspace</label>
                  <select
                    value={reassignWorkspaceId}
                    onChange={(event) => setReassignWorkspaceId(event.target.value)}
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-[#0D1E4C] outline-none focus:border-[#2563EB]"
                  >
                    <option value="">Choose a workspace…</option>
                    {workspaces.map((workspace) => (
                      <option key={workspace.workspace_id} value={workspace.workspace_id}>
                        {workspace.workspace_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeReassign}
                    className="rounded-full px-5 py-2.5 text-sm font-bold text-[#667085] hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!reassignWorkspaceId) {
                        setError("Choose a workspace.");
                        return;
                      }
                      setError("");
                      setReassignPhase("confirm");
                    }}
                    className="rounded-full bg-[#0D1E4C] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#0a1838]"
                  >
                    Review
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <p className="text-sm text-[#52627a]">
                  This will create {reassign.length > 1 ? "these tasks" : "this task"} in{" "}
                  <strong>{workspaceName(reassignWorkspaceId)}</strong> and log the assignment:
                </p>
                <ul className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {reassign.map((target) => {
                    const assigneeId =
                      reassign.length === 1 ? reassignAssigneeId : target.assigneeUserId;
                    const assignee = employeeById.get(assigneeId);
                    return (
                      <li key={target.id} className="text-sm text-[#0D1E4C]">
                        <strong>{target.taskTitle}</strong> →{" "}
                        {assignee
                          ? assignee.full_name || assignee.username || assignee.email
                          : "Unassigned"}
                      </li>
                    );
                  })}
                </ul>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReassignPhase("edit")}
                    className="rounded-full px-5 py-2.5 text-sm font-bold text-[#667085] hover:bg-slate-100"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={confirmReassign}
                    disabled={isSubmitting}
                    className="rounded-full bg-[#0a72e8] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#075fc2] disabled:opacity-60"
                  >
                    {isSubmitting ? "Reassigning…" : "Confirm reassign"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
