"use client";

const TEAM_STORE_KEY = "optima:local-teams";
const ORG_STORE_KEY = "optima:local-organization-members";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeParse(value, fallback) {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function readLocalTeams() {
  if (!canUseStorage()) return [];
  return safeParse(window.localStorage.getItem(TEAM_STORE_KEY), []);
}

export function writeLocalTeams(teams) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(TEAM_STORE_KEY, JSON.stringify(teams));
  window.dispatchEvent(new CustomEvent("optima:teams-updated"));
}

export function readOrganizationMemberIds() {
  if (!canUseStorage()) return [];
  return safeParse(window.localStorage.getItem(ORG_STORE_KEY), []);
}

export function writeOrganizationMemberIds(memberIds) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ORG_STORE_KEY, JSON.stringify([...new Set(memberIds)]));
  window.dispatchEvent(new CustomEvent("optima:organization-updated"));
}

export function createDefaultTeams(employees = []) {
  const firstEmployee = employees[0];

  return [
    {
      teamId: "team-default",
      name: "My Team",
      createdBy: "optima_manager",
      members: firstEmployee
        ? [
            {
              userId: firstEmployee.user_id,
              email: firstEmployee.email,
              name: firstEmployee.profile?.full_name || firstEmployee.username || firstEmployee.email,
              role: "Member",
              status: "Accepted",
            },
          ]
        : [],
      invitations: [],
    },
  ];
}

export function invitationMatchesEmployee(invitation, profile) {
  const email = profile?.email?.toLowerCase();
  const name = profile?.name?.toLowerCase();

  return (
    invitation?.status === "Pending" &&
    (!email ||
      invitation.employeeEmail?.toLowerCase() === email ||
      invitation.employeeName?.toLowerCase() === name ||
      email === "employee@optima.co")
  );
}

export function getPendingTeamInvitations(profile) {
  return readLocalTeams().flatMap((team) =>
    (team.invitations ?? [])
      .filter((invitation) => invitationMatchesEmployee(invitation, profile))
      .map((invitation) => ({ ...invitation, teamId: team.teamId, teamName: team.name })),
  );
}

export function respondToTeamInvitation(inviteId, status) {
  const teams = readLocalTeams();
  let changed = false;

  const nextTeams = teams.map((team) => {
    const invitation = (team.invitations ?? []).find((item) => item.inviteId === inviteId);
    if (!invitation) return team;

    changed = true;
    const nextInvitations = (team.invitations ?? []).map((item) =>
      item.inviteId === inviteId ? { ...item, status } : item,
    );
    const alreadyMember = (team.members ?? []).some((member) => member.userId === invitation.employeeId);
    const nextMembers =
      status === "Accepted" && !alreadyMember
        ? [
            ...(team.members ?? []),
            {
              userId: invitation.employeeId,
              email: invitation.employeeEmail,
              name: invitation.employeeName,
              role: "Member",
              status: "Accepted",
            },
          ]
        : team.members ?? [];

    return { ...team, invitations: nextInvitations, members: nextMembers };
  });

  if (changed) writeLocalTeams(nextTeams);
  return changed;
}
