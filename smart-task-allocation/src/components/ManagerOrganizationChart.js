"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { getAuthHeaders } from "@/lib/clientAuth";
import { getDefaultAvatarUrl } from "@/lib/defaultAvatars";
import { readLocalTeams, readOrganizationMemberIds, writeOrganizationMemberIds } from "@/lib/localTeamStore";

function displayName(account) {
  return account.full_name || account.username || account.email || "Team member";
}

function departmentName(account) {
  return account.department || account.department_name || account.role?.role_name || "Operations";
}

function AccountAvatar({ account }) {
  const name = displayName(account);
  const avatar = account.profile_picture_url || account.profile?.profile_picture_url || getDefaultAvatarUrl(account);

  return (
    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0D1E4C] text-sm font-black text-white shadow-sm">
      <Image src={avatar} alt={`${name} profile`} fill sizes="48px" className="object-cover" />
    </span>
  );
}

export default function ManagerOrganizationChart() {
  const [employees, setEmployees] = useState([]);
  const [localTeams, setLocalTeams] = useState([]);
  const [organizationMemberIds, setOrganizationMemberIds] = useState([]);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const acceptedTeamMemberIds = useMemo(() => {
    const ids = new Set();

    localTeams.forEach((team) => {
      (team.members ?? []).forEach((member) => {
        if (member.status === "Accepted" && member.userId) ids.add(member.userId);
      });
    });

    return [...ids];
  }, [localTeams]);

  const eligibleTeamMembers = useMemo(
    () =>
      employees.filter(
        (employee) =>
          acceptedTeamMemberIds.includes(employee.user_id) &&
          !organizationMemberIds.includes(employee.user_id),
      ),
    [acceptedTeamMemberIds, employees, organizationMemberIds],
  );

  const organizationEmployees = useMemo(
    () =>
      organizationMemberIds.length
        ? employees.filter((employee) => organizationMemberIds.includes(employee.user_id))
        : employees,
    [employees, organizationMemberIds],
  );

  const groupedDepartments = useMemo(() => {
    const groups = new Map();

    organizationEmployees.forEach((employee) => {
      const key = departmentName(employee);
      groups.set(key, [...(groups.get(key) ?? []), employee]);
    });

    return [...groups.entries()].map(([name, members]) => ({ name, members }));
  }, [organizationEmployees]);

  useEffect(() => {
    async function loadEmployees() {
      try {
        setError("");
        const response = await fetch("/api/employees", { headers: await getAuthHeaders() });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Could not load organization members.");
        }

        setEmployees(result.employees ?? result.user_accounts ?? []);
        setLocalTeams(readLocalTeams());
        setOrganizationMemberIds(readOrganizationMemberIds());
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }

    const timeout = setTimeout(loadEmployees, 0);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    function handleOrganizationUpdated() {
      setLocalTeams(readLocalTeams());
      setOrganizationMemberIds(readOrganizationMemberIds());
    }

    window.addEventListener("optima:organization-updated", handleOrganizationUpdated);
    window.addEventListener("optima:teams-updated", handleOrganizationUpdated);
    return () => {
      window.removeEventListener("optima:organization-updated", handleOrganizationUpdated);
      window.removeEventListener("optima:teams-updated", handleOrganizationUpdated);
    };
  }, []);

  function inviteTeamMemberToOrganization(event) {
    event.preventDefault();

    if (!selectedTeamMemberId) {
      setError("Select an accepted team member first.");
      return;
    }

    const nextIds = [...new Set([...organizationMemberIds, selectedTeamMemberId])];
    setOrganizationMemberIds(nextIds);
    setSelectedTeamMemberId("");
    setError("");
    writeOrganizationMemberIds(nextIds);
  }

  return (
    <div className="manager-reference-panel h-full min-h-[620px] overflow-hidden rounded-2xl border border-[#BBE1FA] bg-white shadow-sm">
      <section className="flex h-full min-h-0 flex-col bg-white">
        {error ? (
          <p className="mx-6 mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <div className="min-h-0 flex-1 overflow-auto px-6 py-6">
          <div className="min-h-full rounded-[32px] bg-[#fffafa] px-8 py-8">
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5d7290]">
                Manager
              </p>
              <h1 className="mt-2 text-4xl font-semibold text-black">Organization</h1>
              <p className="mt-2 text-sm text-[#667085]">
                Invite accepted team members into the organization and review assigned departments.
              </p>
            </div>

            <form
              onSubmit={inviteTeamMemberToOrganization}
              className="mx-auto mt-8 grid max-w-4xl gap-3 rounded-3xl border border-[#d8e7f7] bg-white p-4 shadow-sm md:grid-cols-[1fr_auto]"
            >
              <select
                value={selectedTeamMemberId}
                onChange={(event) => setSelectedTeamMemberId(event.target.value)}
                className="h-12 rounded-2xl border border-[#c4d7ec] bg-[#f8fcff] px-4 text-sm font-bold text-[#07183b] outline-none"
                aria-label="Accepted team member"
              >
                <option value="">Select accepted team member</option>
                {eligibleTeamMembers.map((employee) => (
                  <option key={employee.user_id} value={employee.user_id}>
                    {displayName(employee)} · {departmentName(employee)}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="h-12 rounded-2xl bg-[#0a72e8] px-5 text-sm font-black text-white shadow-sm"
              >
                Invite to organization
              </button>
              <p className="text-xs font-bold text-[#667085] md:col-span-2">
                {eligibleTeamMembers.length
                  ? `${eligibleTeamMembers.length} accepted team member(s) available for organization invite.`
                  : "No accepted team members waiting for organization invite."}
              </p>
            </form>

            {isLoading ? (
              <div className="flex min-h-[420px] items-center justify-center text-sm font-semibold text-[#52627a]">
                Loading organization...
              </div>
            ) : groupedDepartments.length ? (
              <div className="mt-10 flex min-w-max gap-4 overflow-x-auto pb-4">
                {groupedDepartments.map((department) => (
                  <section
                    key={department.name}
                    className="flex min-h-[440px] w-72 shrink-0 flex-col rounded-[28px] bg-gradient-to-b from-[#d8efff] via-[#f8fcff] to-white shadow-sm"
                  >
                    <div className="px-4 py-7 text-center">
                      <h2 className="truncate text-xl font-bold text-[#061a40]">
                        {department.name}
                      </h2>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#667085]">
                        {department.members.length} members
                      </p>
                    </div>

                    <div className="flex flex-1 flex-col gap-4 px-5 pb-5">
                      {department.members.map((member) => (
                        <article
                          key={member.user_id || member.email}
                          className="flex items-center gap-4 rounded-2xl bg-white px-4 py-4 text-left shadow-[0_6px_18px_rgba(15,23,42,0.14)] transition hover:bg-[#f8fbff]"
                        >
                          <AccountAvatar account={member} />
                          <span className="min-w-0">
                            <span className="block truncate text-base font-bold text-[#1f2937]">
                              {displayName(member)}
                            </span>
                            <span className="block truncate text-sm text-[#667085]">
                              {member.role?.role_name || member.role || member.email || "User"}
                            </span>
                          </span>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="mt-10 rounded-2xl border border-dashed border-[#bfd0e8] px-6 py-12 text-center text-sm font-medium text-[#667085]">
                No organization members are available yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
