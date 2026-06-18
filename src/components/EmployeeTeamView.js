"use client";

import { useEffect, useMemo, useState } from "react";
import GlassmorphismProfileCard from "@/components/ui/glassmorphism-profile-card";
import { Button } from "@/components/ui/button";
import { getAuthHeaders } from "@/lib/clientAuth";

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

export default function EmployeeTeamView() {
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [members, setMembers] = useState([]);
  const [receivedInvitations, setReceivedInvitations] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isTeamSidebarCollapsed, setIsTeamSidebarCollapsed] = useState(false);
  const [isResponding, setIsResponding] = useState(false);

  const selectedTeam = useMemo(
    () => teams.find((team) => String(team.team_id) === String(selectedTeamId)) ?? null,
    [selectedTeamId, teams],
  );

  const filteredMembers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return members;
    }

    return members.filter((member) => {
      const searchableValues = [
        memberDisplayName(member),
        member.email,
        member.department?.department_name,
        memberPositionText(member),
        memberAccessRole(member, selectedTeam),
      ];

      return searchableValues.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(normalizedSearch),
      );
    });
  }, [members, search, selectedTeam]);

  async function authHeaders() {
    return getAuthHeaders();
  }

  async function loadTeams(teamId = selectedTeamId) {
    setError("");

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
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  async function loadReceivedInvitations() {
    try {
      const response = await fetch("/api/team-invitations", { headers: await authHeaders() });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load invitations.");
      }

      setReceivedInvitations(result.invitations ?? []);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  async function respondToInvitation(invitationId, action) {
    setError("");
    setMessage("");
    setIsResponding(true);

    try {
      const response = await fetch("/api/team-invitations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ invitationId, action }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not respond to invitation.");
      }

      setMessage(action === "accept" ? "Invitation accepted." : "Invitation rejected.");
      await loadReceivedInvitations();
      await loadTeams("");
    } catch (responseError) {
      setError(responseError.message);
    } finally {
      setIsResponding(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadTeams("");
      loadReceivedInvitations();
    }, 0);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      className={`grid h-full min-h-0 overflow-hidden rounded-2xl border border-[#BBE1FA] bg-white shadow-sm transition-[grid-template-columns] ${
        isTeamSidebarCollapsed
          ? "lg:grid-cols-[40px_minmax(0,1fr)]"
          : "lg:grid-cols-[300px_minmax(0,1fr)]"
      }`}
    >
      <aside className="relative overflow-visible bg-[#BBE1FA] px-3 py-4 shadow-md shadow-[#2563EB]">
        <button
          type="button"
          onClick={() => setIsTeamSidebarCollapsed((current) => !current)}
          className="absolute right-1.5 top-6 flex items-center justify-center font-bold text-[#1E293B] hover:text-[#1E40AF]"
          aria-label={isTeamSidebarCollapsed ? "Expand team menu" : "Collapse team menu"}
          title={isTeamSidebarCollapsed ? "Expand team menu" : "Collapse team menu"}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "26px" }} aria-hidden="true">
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
          <>
            <h2 className="pt-2 text-lg font-medium text-[#0D1E4C]">Team</h2>

            <div className="mt-6">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#5d7290]">
                Invitations
              </p>
              <div className="mt-3 space-y-3">
                {receivedInvitations.map((invitation) => (
                  <div
                    key={invitation.invitation_id}
                    className="rounded-xl border border-white/70 bg-white/45 p-3 shadow-sm"
                  >
                    <p className="text-sm font-black text-[#07183b]">
                      {invitation.team?.team_name ?? "Team invitation"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#667085]">
                      From {invitation.inviter_account?.username ?? invitation.inviter_account?.email ?? "manager"}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        disabled={isResponding}
                        onClick={() => respondToInvitation(invitation.invitation_id, "accept")}
                        className="h-9 rounded-lg bg-[#0D6EFD] text-xs font-black text-white hover:bg-[#0b5ed7]"
                      >
                        Accept
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isResponding}
                        onClick={() => respondToInvitation(invitation.invitation_id, "reject")}
                        className="h-9 rounded-lg border-[#c4ccdc] bg-white/50 text-xs font-black text-[#07183b]"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}

                {!receivedInvitations.length ? (
                  <p className="rounded-md border border-dashed border-[#c4ccdc] px-3 py-4 text-sm text-[#667085]">
                    Team invitations will appear here.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-7">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#5d7290]">
                My teams
              </p>
              <div className="mt-3 space-y-2">
                {teams.map((team) => {
                  const isActive = String(team.team_id) === String(selectedTeamId);

                  return (
                    <button
                      key={team.team_id}
                      type="button"
                      onClick={() => loadTeams(team.team_id)}
                      className={`flex h-12 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition ${
                        isActive
                          ? "bg-[#cfe7ff] text-[#233246]"
                          : "text-[#667085] hover:bg-[#eef6ff] hover:text-[#233246]"
                      }`}
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-md text-xl text-[#475467]">
                        ◫
                      </span>
                      <span className="min-w-0 truncate">{team.team_name}</span>
                    </button>
                  );
                })}

                {!teams.length ? (
                  <p className="rounded-md border border-dashed border-[#c4ccdc] px-3 py-4 text-sm text-[#667085]">
                    Accepted teams will appear here.
                  </p>
                ) : null}
              </div>
            </div>
          </>
        )}
      </aside>

      <div className="min-h-0 overflow-y-auto bg-white">
        <div className="flex flex-col gap-4 border-b border-[#d6deed] px-8 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-black text-[#07183b]">
              {selectedTeam?.team_name ?? "My Team"}
            </h1>
            <p className="mt-1 text-sm font-medium text-[#52627a]">
              View accepted members in your team.
            </p>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search members..."
            className="h-12 w-full rounded-full border border-[#b7c4d8] bg-white px-6 text-sm font-medium text-[#07183b] shadow-sm outline-none transition focus:border-[#0D6EFD] lg:max-w-sm"
          />
        </div>

        <div className="px-8 py-6">
          {message ? (
            <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}

          {filteredMembers.length ? (
            <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
              {filteredMembers.map((member) => {
                const status = activityStatus(member.last_active_at);
                const availability = availabilityGlow(member.availability?.status);

                return (
                  <GlassmorphismProfileCard
                    key={member.user_id}
                    name={memberDisplayName(member)}
                    role={memberPositionText(member)}
                    email={member.email}
                    avatarSrc={member.profile?.profile_picture_url}
                    departmentName={member.department?.department_name ?? "No department"}
                    statusText={status.label}
                    statusColor={status.dotClass}
                    glowText={availability.text}
                    glowClassName={availability.className}
                  >
                    <div className="rounded-[14px] border border-black/10 bg-white/50 px-3 py-2 text-center text-xs font-black text-black">
                      {memberAccessRole(member, selectedTeam)}
                    </div>
                  </GlassmorphismProfileCard>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#b7c4d8] px-6 py-10 text-center text-sm font-medium text-[#667085]">
              No accepted members match your search.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
