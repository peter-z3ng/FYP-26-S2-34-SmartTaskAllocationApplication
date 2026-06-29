"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import GlassmorphismProfileCard from "@/components/ui/glassmorphism-profile-card";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

function memberAccessRole(member, team) {
  if (team?.created_by && member.user_id === team.created_by) {
    return "Owner";
  }

  return member.team_role ?? "Member";
}

function memberPositionText(member) {
  const reservedTeamRoles = new Set(["Owner", "Admin", "Member"]);

  if (member.position && !reservedTeamRoles.has(member.position)) {
    return member.position;
  }

  return member.role?.role_name ?? "Team member";
}

function memberDisplayName(member) {
  return member.profile?.full_name || member.username || member.email || "Team member";
}

function activityStatus(lastActiveAt) {
  if (!lastActiveAt) {
    return { label: "Inactive", dotClass: "bg-slate-400" };
  }

  const minutesSinceActive = (Date.now() - new Date(lastActiveAt).getTime()) / 60000;

  if (minutesSinceActive <= 15) {
    return { label: "Active", dotClass: "bg-emerald-500" };
  }

  if (minutesSinceActive <= 120) {
    return { label: "Away", dotClass: "bg-amber-400" };
  }

  return { label: "Inactive", dotClass: "bg-slate-400" };
}

function availabilityGlow(status) {
  const normalizedStatus = status?.toLowerCase() ?? "";

  if (normalizedStatus.includes("busy")) {
    return {
      text: status,
      className: "bg-amber-300 shadow-[0_28px_60px_-18px_rgba(251,191,36,0.78)]",
    };
  }

  if (
    normalizedStatus.includes("not available") ||
    normalizedStatus.includes("unavailable") ||
    normalizedStatus.includes("offline")
  ) {
    return {
      text: status,
      className: "bg-red-400 shadow-[0_28px_60px_-18px_rgba(248,113,113,0.78)]",
    };
  }

  if (normalizedStatus.includes("available")) {
    return {
      text: status,
      className: "bg-lime-400 shadow-[0_28px_60px_-18px_rgba(132,204,22,0.75)]",
    };
  }

  return {
    text: "No availability set",
    className: "bg-slate-200 shadow-[0_28px_60px_-18px_rgba(100,116,139,0.45)]",
  };
}

export default function TeamManagement() {
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [inviteCandidates, setInviteCandidates] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [inviteeUserId, setInviteeUserId] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isTeamSidebarCollapsed, setIsTeamSidebarCollapsed] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [workspaces, setWorkspaces] = useState([]);
  const [assignmentTasks, setAssignmentTasks] = useState([]);
  const [assignPanelMember, setAssignPanelMember] = useState(null);
  const [assignWorkspaceId, setAssignWorkspaceId] = useState("");
  const [assignTaskId, setAssignTaskId] = useState("");
  const [isAssigningTask, setIsAssigningTask] = useState(false);

  const selectedTeam = useMemo(
    () => teams.find((team) => String(team.team_id) === String(selectedTeamId)) ?? null,
    [selectedTeamId, teams]
  );

  const [openTeamMenuId, setOpenTeamMenuId] = useState("");
  const [editingTeamId, setEditingTeamId] = useState("");
  const [editingTeamName, setEditingTeamName] = useState("");

  useEffect(() => {
    function closeMenu() {
      setOpenTeamMenuId("");
    }
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  function startRenameTeam(team) {
    setEditingTeamId(team.team_id);
    setEditingTeamName(team.team_name);
  }

  function cancelRenameTeam() {
    setEditingTeamId("");
    setEditingTeamName("");
  }

  async function commitRenameTeam(team) {
    const nextName = editingTeamName.trim();
    if (!nextName || nextName === team.team_name) {
      cancelRenameTeam();
      return;
    }

    setError("");
    try {
      const response = await fetch("/api/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ teamId: team.team_id, teamName: nextName }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Could not rename team.");
      }
      cancelRenameTeam();
      await loadTeams(team.team_id);
    } catch (renameError) {
      setError(renameError.message);
    }
  }

  async function deleteTeam(team) {
    if (!window.confirm(`Delete "${team.team_name}"? Members and invitations will be removed.`)) {
      return;
    }

    setError("");
    try {
      const response = await fetch(`/api/teams?teamId=${team.team_id}`, {
        method: "DELETE",
        headers: await authHeaders(),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Could not delete team.");
      }
      await loadTeams();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function authHeaders() {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    return {
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
    };
  }

  async function loadTeams(teamId = selectedTeamId) {
    try {
      const query = teamId ? `?teamId=${teamId}` : "";
      const response = await fetch(`/api/teams${query}`, { headers: await authHeaders() });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load teams.");
      }

      setTeams(result.teams ?? []);
      setSelectedTeamId(String(result.selectedTeam?.team_id ?? ""));
      setMembers(result.members ?? []);
      setInvitations(result.invitations ?? []);
      setCurrentUserId(result.currentUserId ?? "");
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  async function loadInviteCandidates() {
    try {
      const response = await fetch("/api/employees", { headers: await authHeaders() });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load organization users.");
      }

      setInviteCandidates(result.user_accounts ?? result.employees ?? []);
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

      setWorkspaces(result.workspaces ?? []);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  async function loadWorkspaceTasks(workspaceId) {
    if (!workspaceId) {
      setAssignmentTasks([]);
      return;
    }

    try {
      const response = await fetch(`/api/tasks?workspaceId=${workspaceId}`, {
        headers: await authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load workspace tasks.");
      }

      setAssignmentTasks(result.tasks ?? []);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadTeams();
      loadInviteCandidates();
      loadWorkspaces();
    }, 0);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createTeam(event) {
    event.preventDefault();
    const nextTeamName = teamName.trim();

    if (!nextTeamName) {
      setError("Team name is required.");
      return;
    }

    setError("");

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ teamName: nextTeamName }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not create team.");
      }

      setTeamName("");
      setMessage(`${nextTeamName} created.`);
      await loadTeams(result.team?.team_id);
    } catch (createError) {
      setError(createError.message);
    }
  }

  async function inviteMember(event) {
    event.preventDefault();

    if (!selectedTeamId) {
      setError("Select or create a team first.");
      return;
    }

    if (!inviteeUserId) {
      setError("Choose a member to invite.");
      return;
    }

    setError("");

    try {
      const response = await fetch("/api/team-invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          teamId: selectedTeamId,
          inviteeUserId,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not invite member.");
      }

      setInviteeUserId("");
      setMessage("Invitation sent.");
      await loadTeams(selectedTeamId);
    } catch (inviteError) {
      setError(inviteError.message);
    }
  }

  function openAssignPanel(member) {
    if (member.user_id === currentUserId) {
      return;
    }

    setAssignPanelMember(member);
    setAssignWorkspaceId("");
    setAssignTaskId("");
    setAssignmentTasks([]);
    loadWorkspaces();
  }

  function closeAssignPanel() {
    setAssignPanelMember(null);
    setAssignWorkspaceId("");
    setAssignTaskId("");
    setAssignmentTasks([]);
  }

  async function assignSelectedTask() {
    const task = assignmentTasks.find((candidate) => String(candidate.task_id) === String(assignTaskId));

    if (!assignPanelMember || !task) {
      setError("Choose a workspace and task first.");
      return;
    }

    setIsAssigningTask(true);
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
          status: task.status ?? "Open",
          priority: task.priority ?? "Medium",
          assignedTo: assignPanelMember.user_id,
          startDatetime: task.start_datetime ?? "",
          endDatetime: task.end_datetime ?? "",
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not assign task.");
      }

      setMessage(`${task.title} assigned to ${memberDisplayName(assignPanelMember)}.`);
      closeAssignPanel();
    } catch (assignError) {
      setError(assignError.message);
    } finally {
      setIsAssigningTask(false);
    }
  }

  const acceptedMembers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return members.filter((member) =>
      [
        member.username,
        member.profile?.full_name,
        member.email,
        member.role?.role_name,
        member.department?.department_name,
        member.availability?.status,
        activityStatus(member.last_active_at).label,
        memberAccessRole(member, selectedTeam),
        member.team_role,
        member.position,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [members, search, selectedTeam]);

  const memberIds = useMemo(() => new Set(members.map((member) => member.user_id)), [members]);
  const pendingInviteeIds = useMemo(
    () => new Set(invitations.map((invitation) => invitation.invitee)),
    [invitations]
  );
  const availableInviteCandidates = inviteCandidates.filter(
    (candidate) => !memberIds.has(candidate.user_id) && !pendingInviteeIds.has(candidate.user_id)
  );

  return (
    <section
      className={`grid h-full min-h-0 overflow-hidden rounded-2xl transition-[grid-template-columns] ${
        isTeamSidebarCollapsed
          ? "lg:grid-cols-[40px_minmax(0,1fr)]"
          : "lg:grid-cols-[300px_minmax(0,1fr)]"
      }`}
    >
      <aside className="relative overflow-visible border-r border-white/40 px-3 py-4">
        <button
          type="button"
          onClick={() => setIsTeamSidebarCollapsed((current) => !current)}
          className="absolute right-1.5 top-6.5 flex items-center justify-center font-bold text-[#1E293B] hover:text-[#1E40AF]"
          aria-label={isTeamSidebarCollapsed ? "Expand team menu" : "Collapse team menu"}
          title={isTeamSidebarCollapsed ? "Expand team menu" : "Collapse team menu"}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "26px" }}
            aria-hidden="true"
          >
            {isTeamSidebarCollapsed ? "left_panel_open" : "left_panel_close"}
          </span>
        </button>

        {isTeamSidebarCollapsed ? (
          <div className="flex h-full flex-col items-center pt-20 text-[#07183b]">
            <span className="rotate-90 whitespace-nowrap text-md font-semibold tracking-widest">
              Team
            </span>
          </div>
        ) : (
          <div className="flex h-full flex-col">
          <h1 className="pt-2 text-lg font-medium text-[#0D1E4C]">Team</h1>

          <form onSubmit={createTeam} className="mt-6 flex gap-2">
            <input
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="Create team"
              className="h-12 min-w-0 flex-1 rounded-md border border-white/80 px-3 text-sm text-[#2f3442] outline-none focus:border-[#0a72e8] focus:ring-2 focus:ring-[#0a72e8]/15"
            />
            <button
              type="submit"
              className="h-12 rounded-md bg-[#2563EB] px-4 text-sm font-bold text-white transition hover:bg-[#1E40AF]"
            >
              Add
            </button>
          </form>

          <div className="mt-5 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {teams.map((team) => {
              const isActive = String(team.team_id) === String(selectedTeamId);

              return (
                <div
                  key={team.team_id}
                  className={`group relative flex h-12 w-full items-center gap-3 rounded-md pr-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-[#cfe7ff] text-[#233246]"
                      : "text-[#667085] hover:bg-[#eef6ff] hover:text-[#233246]"
                  }`}
                >
                  {editingTeamId === team.team_id ? (
                    <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xl text-[#475467]">
                        ▣
                      </span>
                      <input
                        value={editingTeamName}
                        autoFocus
                        onChange={(event) => setEditingTeamName(event.target.value)}
                        onBlur={() => commitRenameTeam(team)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.currentTarget.blur();
                          }
                          if (event.key === "Escape") {
                            cancelRenameTeam();
                          }
                        }}
                        className="h-8 min-w-0 flex-1 rounded-md border border-[#0a72e8] bg-white px-2 text-sm font-semibold text-[#233246] outline-none"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => loadTeams(team.team_id)}
                      className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xl text-[#475467]">
                        ▣
                      </span>
                      <span className="min-w-0 truncate">{team.team_name}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    aria-label={`Open ${team.team_name} menu`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenTeamMenuId((current) =>
                        current === team.team_id ? "" : team.team_id,
                      );
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-lg font-bold text-[#667085] opacity-0 transition hover:bg-white/60 group-hover:opacity-100"
                  >
                    ⋯
                  </button>

                  {openTeamMenuId === team.team_id ? (
                    <div
                      className="absolute right-2 top-12 z-30 w-40 overflow-hidden rounded-xl border border-white/60 bg-white/90 shadow-[0_18px_50px_rgba(7,24,59,0.18)] backdrop-blur-md"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setOpenTeamMenuId("");
                          startRenameTeam(team);
                        }}
                        className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-[#233246] hover:bg-[#eef6ff]"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenTeamMenuId("");
                          deleteTeam(team);
                        }}
                        className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}

            {!teams.length ? (
              <p className="rounded-md border border-dashed border-[#c4ccdc] px-3 py-4 text-sm text-[#667085]">
                Create your first team to invite members.
              </p>
            ) : null}
          </div>
        </div>
        )}
      </aside>

      <div className="min-h-0 overflow-y-auto px-8 py-3">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="mt-2 text-2xl font-black text-[#07183b]">
              {selectedTeam?.team_name ?? "Create a team"}
            </h2>
          </div>

          <div className="mt-4 flex items-center gap-3 xl:mt-0">
            <Link
              href="/manager/organization"
              className="inline-flex h-12 items-center rounded-full bg-[#0A2A66] px-6 text-sm font-black text-white shadow-[0_2px_8px_rgba(7,24,59,0.12)] transition hover:bg-[#07183b]"
            >
              Invite
            </Link>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search members..."
              className="h-12 w-80 rounded-full border border-[#b8c4d8] bg-white px-8 text-lg text-[#07183b] shadow-[0_2px_8px_rgba(7,24,59,0.12)] outline-none placeholder:text-[#7f8da4] xl:max-w-xl"
            />
          </div>
        </div>

        {error ? (
          <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="mt-5 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-[#0a2a66]">
            {message}
          </p>
        ) : null}

        {invitations.length ? (
          <div className="mt-4 rounded-2xl border border-[#d7e0ef] bg-white p-4">
            <p className="text-sm font-black uppercase tracking-wider text-[#57708f]">Pending invitations</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {invitations.map((invitation) => (
                <span
                  key={invitation.invitation_id}
                  className="rounded-full bg-[#eef2f8] px-3 py-1 text-xs font-bold text-[#52627a]"
                >
                  {invitation.invitee_account?.username ?? invitation.invitee_account?.email ?? "Invited member"}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-5 2xl:grid-cols-6">
          {acceptedMembers.map((member) => {
            const accessRole = memberAccessRole(member, selectedTeam);
            const activity = activityStatus(member.last_active_at);
            const availability = availabilityGlow(member.availability?.status);
            const isCurrentUser = member.user_id === currentUserId;

            return (
              <GlassmorphismProfileCard
                key={member.user_id}
                name={memberDisplayName(member)}
                email={member.email}
                role={memberPositionText(member)}
                avatarSrc={member.profile?.profile_picture_url}
                departmentName={accessRole}
                statusText={activity.label}
                statusColor={activity.dotClass}
                glowText={availability.text}
                glowClassName={availability.className}
              >
                <div className="space-y-2">
                  <div className="rounded-[12px] border border-black/10 bg-white/60 px-3 py-2 text-center text-xs font-black text-black">
                    {member.department?.department_name ?? "No department"}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isCurrentUser}
                    onClick={() => openAssignPanel(member)}
                    className="h-9 w-full rounded-[12px] border-black/10 bg-white/60 text-xs font-black text-black hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Assign task
                  </Button>
                </div>
              </GlassmorphismProfileCard>
            );
          })}
        </div>

        {selectedTeam && !acceptedMembers.length ? (
          <p className="mt-8 rounded-2xl border border-dashed border-[#b8c4d8] px-5 py-8 text-center text-sm font-medium text-[#52627a]">
            No accepted members match your search.
          </p>
        ) : null}
      </div>

      {assignPanelMember ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07183b]/20 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-white/60 bg-white/85 p-5 shadow-[0_24px_80px_rgba(7,24,59,0.24)] backdrop-blur-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#607089]">
                  Assign task
                </p>
                <h3 className="mt-1 text-2xl font-black text-[#07183b]">
                  {memberDisplayName(assignPanelMember)}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeAssignPanel}
                className="rounded-full px-3 py-1 text-xl font-black text-[#52627a] hover:bg-white"
                aria-label="Close assign task panel"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wider text-[#607089]">
                  Workspace
                </span>
                <select
                  value={assignWorkspaceId}
                  onChange={(event) => {
                    const workspaceId = event.target.value;
                    setAssignWorkspaceId(workspaceId);
                    setAssignTaskId("");
                    loadWorkspaceTasks(workspaceId);
                  }}
                  className="mt-2 h-11 w-full rounded-xl border border-[#bfccdd] bg-white px-3 text-sm font-bold text-[#07183b] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
                >
                  <option value="">Choose workspace</option>
                  {workspaces.map((workspace) => (
                    <option key={workspace.workspace_id} value={workspace.workspace_id}>
                      {workspace.workspace_name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-wider text-[#607089]">
                  Task
                </span>
                <select
                  value={assignTaskId}
                  onChange={(event) => setAssignTaskId(event.target.value)}
                  disabled={!assignWorkspaceId}
                  className="mt-2 h-11 w-full rounded-xl border border-[#bfccdd] bg-white px-3 text-sm font-bold text-[#07183b] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">
                    {assignWorkspaceId ? "Choose task" : "Choose a workspace first"}
                  </option>
                  {assignmentTasks.map((task) => (
                    <option key={task.task_id} value={task.task_id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeAssignPanel}
                className="h-10 rounded-xl border-[#bfccdd] bg-white px-5 text-sm font-black text-[#07183b]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={assignSelectedTask}
                disabled={!assignTaskId || isAssigningTask}
                className="h-10 rounded-xl bg-[#2563EB] px-5 text-sm font-black text-white hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAssigningTask ? "Assigning..." : "Assign task"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
