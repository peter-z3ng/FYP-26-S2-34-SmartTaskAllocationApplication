"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

function initialFromName(name) {
  return (name || "User").trim().charAt(0).toUpperCase() || "U";
}

function displayName(account) {
  return account.full_name || account.username || account.email || "User";
}

function AccountAvatar({ account, size = "h-10 w-10", textSize = "text-sm" }) {
  const name = displayName(account);

  return (
    <span
      className={`relative flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#6b7280] ${textSize} font-bold text-white`}
    >
      {account.profile_picture_url ? (
        <Image
          src={account.profile_picture_url}
          alt={`${name} profile`}
          fill
          sizes="48px"
          unoptimized
          className="object-cover"
        />
      ) : (
        initialFromName(name)
      )}
    </span>
  );
}

export default function ManagerOrganizationChart() {
  const [organization, setOrganization] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [teams, setTeams] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [menu, setMenu] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const accountsByDepartment = useMemo(() => {
    const grouped = new Map();

    departments.forEach((department) => {
      grouped.set(department.department_id, []);
    });

    accounts.forEach((account) => {
      if (grouped.has(account.department_id)) {
        grouped.get(account.department_id).push(account);
      }
    });

    return grouped;
  }, [accounts, departments]);

  async function authHeaders() {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();

    return {
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
    };
  }

  async function loadOrganization() {
    setError("");

    try {
      const response = await fetch("/api/manager-organization", {
        headers: await authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load organization.");
      }

      setOrganization(result.organization ?? null);
      setDepartments(result.departments ?? []);
      setAccounts(result.accounts ?? []);
      setTeams(result.teams ?? []);
      setCurrentUserId(result.currentUserId ?? "");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(loadOrganization, 0);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function closeMenu() {
      setMenu(null);
    }

    window.addEventListener("click", closeMenu);

    return () => window.removeEventListener("click", closeMenu);
  }, []);

  function openContextMenu(event, account) {
    event.preventDefault();
    setMessage("");
    setError("");
    setMenu({
      account,
      x: event.clientX,
      y: event.clientY,
    });
  }

  function sendMessage(account) {
    setMenu(null);
    setMessage(`Message action ready for ${displayName(account)}. Inbox messaging can be connected here.`);
  }

  async function inviteToTeam(team, account) {
    setMenu(null);
    setMessage("");
    setError("");

    if (account.user_id === currentUserId) {
      setError("You cannot invite yourself to your own team.");
      return;
    }

    try {
      const response = await fetch("/api/team-invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          teamId: team.team_id,
          inviteeUserId: account.user_id,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not send team invitation.");
      }

      setMessage(`Invitation sent to ${displayName(account)} for ${team.team_name}.`);
    } catch (inviteError) {
      setError(inviteError.message);
    }
  }

  return (
    <div className="h-full min-h-0 overflow-hidden rounded-2xl border border-[#BBE1FA] bg-white shadow-sm">
      <section className="flex h-full min-h-0 flex-col bg-white">
        {error ? (
          <p className="mx-6 mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="mx-6 mt-5 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-[#0a2a66]">
            {message}
          </p>
        ) : null}

        <div className="min-h-0 flex-1 overflow-auto px-6 py-6">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm font-semibold text-[#52627a]">
              Loading organization...
            </div>
          ) : organization ? (
            <div className="min-h-full rounded-[32px] bg-[#fffafa] px-8 py-8">
              <div className="text-center">
                <h1 className="text-4xl font-semibold text-black">
                  {organization.organization_name}
                </h1>
                <p className="mt-2 text-sm text-[#667085]">
                  View assigned departments and invite people into your teams.
                </p>
              </div>

              {departments.length ? (
                <div className="mt-10 flex min-w-max gap-4 overflow-x-auto pb-4">
                  {departments.map((department) => {
                    const departmentAccounts =
                      accountsByDepartment.get(department.department_id) ?? [];

                    return (
                      <section
                        key={department.department_id}
                        className="flex min-h-[440px] w-72 shrink-0 flex-col rounded-[28px] bg-gradient-to-b from-[#d8efff] via-[#f8fcff] to-white shadow-sm"
                      >
                        <div className="px-4 py-7 text-center">
                          <h2 className="truncate text-xl font-bold text-[#061a40]">
                            {department.department_name}
                          </h2>
                        </div>
                        <div className="flex flex-1 flex-col gap-4 px-5 pb-5">
                          {departmentAccounts.map((account) => (
                            <button
                              key={account.user_id}
                              type="button"
                              onContextMenu={(event) => openContextMenu(event, account)}
                              className="flex items-center gap-4 rounded-2xl bg-white px-4 py-4 text-left shadow-[0_6px_18px_rgba(15,23,42,0.14)] transition hover:bg-[#f8fbff]"
                              title="Right-click for actions"
                            >
                              <AccountAvatar account={account} size="h-12 w-12" />
                              <span className="min-w-0">
                                <span className="block truncate text-base font-bold text-[#1f2937]">
                                  {displayName(account)}
                                </span>
                                <span className="block truncate text-sm text-[#667085]">
                                  {account.role?.role_name ?? "User"}
                                </span>
                              </span>
                            </button>
                          ))}

                          {!departmentAccounts.length ? (
                            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[#bfd0e8] px-4 text-center text-sm font-medium text-[#667085]">
                              No assigned users
                            </div>
                          ) : null}
                        </div>
                      </section>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-10 rounded-2xl border border-dashed border-[#bfd0e8] px-6 py-12 text-center text-sm font-medium text-[#667085]">
                  No departments have been set up yet.
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full min-h-[520px] items-center justify-center rounded-[32px] bg-[#fffafa] text-center">
              <div>
                <h1 className="text-4xl font-medium text-black">Organization</h1>
                <p className="mt-3 text-sm text-[#667085]">
                  Your account is not linked to an organization yet.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {menu ? (
        <OrganizationContextMenu
          account={menu.account}
          currentUserId={currentUserId}
          teams={teams}
          x={menu.x}
          y={menu.y}
          onInvite={inviteToTeam}
          onSendMessage={sendMessage}
        />
      ) : null}
    </div>
  );
}

function OrganizationContextMenu({
  account,
  currentUserId,
  teams,
  x,
  y,
  onInvite,
  onSendMessage,
}) {
  return (
    <div
      className="fixed z-50 w-64 rounded-2xl border border-white/60 bg-white/80 p-2 text-sm font-bold text-[#1f2937] shadow-2xl backdrop-blur-md"
      style={{ left: x, top: y }}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => onSendMessage(account)}
        className="flex w-full items-center rounded-xl px-3 py-3 text-left hover:bg-[#e8f3ff]"
      >
        Send message
      </button>

      <div className="group relative">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-[#e8f3ff]"
        >
          Invite to my team
          <span aria-hidden="true">›</span>
        </button>

        <div className="invisible absolute left-full top-0 ml-2 min-w-56 rounded-2xl border border-white/60 bg-white/90 p-2 opacity-0 shadow-2xl backdrop-blur-md transition group-hover:visible group-hover:opacity-100">
          {teams.length ? (
            teams.map((team) => (
              <button
                key={team.team_id}
                type="button"
                disabled={account.user_id === currentUserId}
                onClick={() => onInvite(team, account)}
                className="block w-full rounded-xl px-3 py-3 text-left hover:bg-[#e8f3ff] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {team.team_name}
              </button>
            ))
          ) : (
            <p className="px-3 py-3 text-sm font-semibold text-[#667085]">
              No owned teams yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
