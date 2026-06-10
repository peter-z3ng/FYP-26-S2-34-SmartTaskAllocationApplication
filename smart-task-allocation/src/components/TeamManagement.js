"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import UserTierBadge from "@/components/UserTierBadge";
import { getAuthHeaders } from "@/lib/clientAuth";
import { getDefaultAvatarUrl } from "@/lib/defaultAvatars";
import { createDefaultTeams, readLocalTeams, writeLocalTeams } from "@/lib/localTeamStore";

const capabilityLabels = ["customer", "inventory", "availability", "readiness", "capacity"];
const avatarColors = [
  ["#5eead4", "#0f766e"],
  ["#bae6fd", "#0284c7"],
  ["#d9f99d", "#65a30d"],
  ["#fde68a", "#d97706"],
  ["#ddd6fe", "#7c3aed"],
  ["#fecdd3", "#e11d48"],
  ["#a5f3fc", "#0891b2"],
  ["#bbf7d0", "#059669"],
];

function confidenceFromEvaluation(evaluation) {
  const totalChecks = Math.max(1, evaluation?.reasons?.length ?? 3);
  return Math.round(((evaluation?.score ?? 0) / totalChecks) * 100);
}

function getDisplayName(employee) {
  return employee?.profile?.full_name || employee?.full_name || employee?.username || employee?.email || "Employee";
}

function getInitials(employee) {
  return getDisplayName(employee)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "E";
}

function taskTitle(tasks, taskId) {
  return tasks.find((task) => String(task.task_id) === String(taskId))?.title ?? "selected task";
}

function statusTone(status) {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized === "approved" || normalized === "assigned") return "bg-emerald-50 text-emerald-700";
  if (normalized === "rejected" || normalized === "cancelled") return "bg-rose-50 text-rose-700";
  return "bg-sky-50 text-sky-700";
}

function capabilityValue(employee, label) {
  const skills = employee?.skills ?? [];
  const supportSkill = skills.find((skill) => /support|customer/i.test(skill.skill_name ?? ""));
  const inventorySkill = skills.find((skill) => /inventory|stock|warehouse/i.test(skill.skill_name ?? ""));
  const active = employee?.account_status === "Active";

  if (label === "customer") return Math.min(100, (Number(supportSkill?.proficiency_level) || 2) * 20);
  if (label === "inventory") return Math.min(100, (Number(inventorySkill?.proficiency_level) || 2) * 20);
  if (label === "availability") return active ? 78 : 18;
  if (label === "readiness") return active ? 88 : 22;
  if (label === "capacity") return Math.max(18, 92 - Number(employee?.assignment_count ?? 0) * 18);
  return 50;
}

function employeeColorStyle(index) {
  const [a, b] = avatarColors[index % avatarColors.length];
  return {
    "--dispatch-a": a,
    "--dispatch-b": b,
    "--dispatch-glow": `${a}44`,
  };
}

function EmployeeAvatar({ employee, index = 0, className = "dispatch-avatar" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = employee?.profile_picture_url || employee?.profile?.profile_picture_url || getDefaultAvatarUrl(employee, index);
  const showImage = imageUrl && !imageFailed;

  return (
    <span className={className} style={employeeColorStyle(index)}>
      {showImage ? (
        <Image src={imageUrl} alt={getDisplayName(employee)} fill sizes="96px" unoptimized onError={() => setImageFailed(true)} />
      ) : (
        <span>{getInitials(employee)}</span>
      )}
    </span>
  );
}

function AbilityRadar({ employee, compact = false }) {
  const size = compact ? 190 : 260;
  const center = size / 2;
  const radius = compact ? 58 : 82;
  const points = capabilityLabels.map((label, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / capabilityLabels.length;
    const value = capabilityValue(employee, label) / 100;
    return [center + Math.cos(angle) * radius * value, center + Math.sin(angle) * radius * value];
  });
  const gridPoints = capabilityLabels.map((label, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / capabilityLabels.length;
    return [center + Math.cos(angle) * radius, center + Math.sin(angle) * radius];
  });

  return (
    <svg className="dispatch-radar" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Capability radar">
      {[0.33, 0.66, 1].map((scale) => (
        <polygon
          key={scale}
          className="dispatch-radar-grid"
          points={gridPoints.map(([x, y]) => `${center + (x - center) * scale},${center + (y - center) * scale}`).join(" ")}
        />
      ))}
      {gridPoints.map(([x, y], index) => (
        <line key={capabilityLabels[index]} className="dispatch-radar-axis" x1={center} y1={center} x2={x} y2={y} />
      ))}
      <polygon className="dispatch-radar-shape" points={points.map(([x, y]) => `${x},${y}`).join(" ")} />
      {points.map(([x, y], index) => (
        <circle key={capabilityLabels[index]} className="dispatch-radar-dot" cx={x} cy={y} r="3.5" />
      ))}
      {gridPoints.map(([x, y], index) => (
        <text
          key={capabilityLabels[index]}
          className="dispatch-radar-label"
          x={center + (x - center) * 1.18}
          y={center + (y - center) * 1.18}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {capabilityLabels[index].toUpperCase()}
        </text>
      ))}
    </svg>
  );
}

function CapabilityMeters({ employee, compact = false }) {
  return (
    <div className={compact ? "space-y-2" : "mt-5 space-y-3"}>
      {capabilityLabels.slice(0, compact ? 4 : capabilityLabels.length).map((label) => {
        const value = capabilityValue(employee, label);
        return (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between text-xs font-black uppercase tracking-[0.18em] text-[#57708f]">
              <span>{label}</span>
              <span className="tracking-normal text-[#07183b]">{value}%</span>
            </div>
            <div className={compact ? "recommendation-meter" : "dispatch-meter"}>
              <span style={{ "--meter-width": `${value}%`, width: `${value}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RequestApprovalPanel({ requests, onReview }) {
  const pendingRequests = requests.filter((request) => request.status === "Pending");

  return (
    <section className="dashboard-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="dashboard-eyebrow">Paid approval workflow</p>
          <h2 className="mt-1 text-2xl font-black text-[#07183b]">Employee task requests</h2>
          <p className="mt-2 text-sm leading-6 text-[#52627a]">
            Managers can approve or reject employee requests. Approved requests create an assignment.
          </p>
        </div>
        <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-black text-[#0a2a66]">
          {pendingRequests.length} pending
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {(requests.length ? requests : []).slice(0, 5).map((request) => (
          <article key={request.request_id} className="rounded-2xl border border-[#d8e3f2] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-black text-[#07183b]">{request.task?.title ?? "Task"}</p>
                <p className="mt-1 text-sm font-semibold text-[#52627a]">
                  {request.user?.username ?? request.user?.email ?? "Employee"}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${statusTone(request.status)}`}>
                {request.status}
              </span>
            </div>
            {request.status === "Pending" ? (
              <div className="mt-4 flex gap-2">
                <button type="button" className="dashboard-button min-h-10 px-4" onClick={() => onReview(request, "Approved")}>
                  Approve
                </button>
                <button
                  type="button"
                  className="rounded-full border border-[#fecdd3] bg-[#fff1f2] px-4 text-sm font-black text-[#be123c]"
                  onClick={() => onReview(request, "Rejected")}
                >
                  Reject
                </button>
              </div>
            ) : null}
          </article>
        ))}
        {!requests.length ? (
          <p className="rounded-2xl border border-dashed border-[#c8d8ec] bg-white p-5 text-sm font-bold text-[#52627a]">
            No employee requests yet.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function RecommendationPanel({ recommendation, employees, onAssign, assigningCandidateId }) {
  if (!recommendation) return null;

  const candidateRows = recommendation.recommendations ?? [];

  return (
    <section className="dashboard-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="dashboard-eyebrow">AI recommendations</p>
          <h2 className="mt-1 text-2xl font-black text-[#07183b]">
            {recommendation.recommendation?.title ?? "Best match recommendation"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#52627a]">
            {recommendation.recommendation?.summary ?? "Eligible employees ranked for the selected task."}
          </p>
        </div>
        <div className="confidence-dial">
          <span>{recommendation.recommendation?.confidence ?? candidateRows[0]?.confidence ?? 0}%</span>
        </div>
      </div>

      {recommendation.recommendation?.rationale?.length ? (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {recommendation.recommendation.rationale.slice(0, 3).map((item) => (
            <p key={item} className="rounded-2xl border border-[#d8e3f2] bg-white p-4 text-sm font-black text-[#52627a]">
              {item}
            </p>
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {candidateRows.slice(0, 4).map((entry, index) => {
          const fullEmployee =
            employees.find((employee) => employee.user_id === entry.employee?.user_id) ?? entry.employee;
          const eligible = entry.evaluation?.eligible !== false;

          return (
            <article key={entry.employee?.user_id ?? index} className="recommendation-employee-card">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div>
                  <div className="flex items-start gap-4">
                    <EmployeeAvatar employee={fullEmployee} index={index} className="recommendation-avatar" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black text-[#07183b]">{getDisplayName(fullEmployee)}</h3>
                        <UserTierBadge tier={fullEmployee?.subscription_tier} size="sm" />
                      </div>
                      <p className="mt-1 text-sm font-bold text-[#52627a]">{fullEmployee?.account_status ?? "Active"}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${eligible ? "bg-[#99f6e4] text-[#0f766e]" : "bg-[#ffe4e6] text-[#be123c]"}`}>
                      {eligible ? "Eligible" : "Blocked"}
                    </span>
                    <span className="rounded-full bg-[#eef2f8] px-3 py-1 text-xs font-black text-[#52627a]">
                      {entry.confidence}% confidence
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {(entry.evaluation?.reasons ?? ["Employee was evaluated for this task."]).map((reason) => (
                      <p key={reason} className="text-sm font-bold leading-6 text-[#52627a]">{reason}</p>
                    ))}
                  </div>

                  <div className="mt-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#57708f]">Skill chips</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(fullEmployee?.skills?.length ? fullEmployee.skills : [{ skill_name: "Customer Support", proficiency_level: 3 }]).slice(0, 3).map((skill) => (
                        <span key={`${fullEmployee?.user_id}-${skill.skill_name}`} className="recommendation-skill-chip">
                          {skill.skill_name} L{skill.proficiency_level ?? 3}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!eligible || assigningCandidateId === fullEmployee?.user_id}
                    onClick={() => onAssign(fullEmployee)}
                    className="mt-5 h-12 w-full rounded-full bg-[#0D1E4C] text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {assigningCandidateId === fullEmployee?.user_id ? "Assigning..." : "Assign to This Task"}
                  </button>
                </div>

                <div className="recommendation-radar-card">
                  <AbilityRadar employee={fullEmployee} compact />
                  <CapabilityMeters employee={fullEmployee} compact />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function DispatchBoard({ employees, selectedEmployee, onSelect }) {
  const [rosterSearch, setRosterSearch] = useState("");
  const visibleEmployees = useMemo(() => {
    const query = rosterSearch.trim().toLowerCase();

    if (!query) return employees;

    return employees.filter((employee) => {
      const searchableText = [
        getDisplayName(employee),
        employee.email,
        employee.account_status,
        employee.subscription_tier,
        ...(employee.skills ?? []).map((skill) => skill.skill_name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [employees, rosterSearch]);

  return (
    <section className="dispatch-board">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="dashboard-eyebrow text-teal-200">Manager dispatch board</p>
          <h2 className="mt-1 text-3xl font-black text-white">Employee Ability Grid</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Select an employee portrait to inspect profile details, readiness, skill coverage, availability, and dispatch capacity.
          </p>
        </div>
        <span className="dispatch-live-pill">{employees.filter((employee) => employee.account_status === "Active").length} operators online</span>
      </div>

      <div className="dispatch-search mt-5">
        <label htmlFor="employee-ability-search" className="sr-only">
          Search employees
        </label>
        <input
          id="employee-ability-search"
          type="search"
          value={rosterSearch}
          onChange={(event) => setRosterSearch(event.target.value)}
          placeholder="Search by name, email, skill, status, or plan"
        />
        {rosterSearch ? (
          <button type="button" onClick={() => setRosterSearch("")}>
            Clear
          </button>
        ) : null}
      </div>

      <div className="dispatch-roster mt-6" role="list" aria-label="Employee ability roster">
        {visibleEmployees.map((employee, index) => {
          const selected = selectedEmployee?.user_id === employee.user_id;
          return (
            <button
              key={employee.user_id}
              type="button"
              onClick={() => onSelect(employee.user_id)}
              className={`dispatch-card ${selected ? "is-selected" : ""} ${employee.account_status !== "Active" ? "is-muted" : ""}`}
              style={employeeColorStyle(index)}
            >
              <span className="dispatch-card-status">{employee.account_status === "Active" ? "Standby" : "Offline"}</span>
              <EmployeeAvatar employee={employee} index={index} />
              <span className="dispatch-name">{getDisplayName(employee)}</span>
              <span className="dispatch-role">{employee.subscription_tier ?? "Free"}</span>
            </button>
          );
        })}
        {!visibleEmployees.length ? (
          <p className="dispatch-empty-state">No employees match this search.</p>
        ) : null}
      </div>

      {selectedEmployee ? (
        <article className="dispatch-detail mt-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="dispatch-profile-card">
              <div className="flex items-start gap-4">
                <EmployeeAvatar employee={selectedEmployee} className="dispatch-detail-avatar" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-2xl font-black text-white">{getDisplayName(selectedEmployee)}</h3>
                    <UserTierBadge tier={selectedEmployee.subscription_tier} size="sm" />
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-300">{selectedEmployee.email}</p>
                </div>
              </div>
              <p className="dispatch-bio mt-5">
                {selectedEmployee.profile?.bio || "Employee profile ready for dispatch planning."}
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="dispatch-stat">
                  <p>Status</p>
                  <p>{selectedEmployee.account_status}</p>
                </div>
                <div className="dispatch-stat">
                  <p>Load</p>
                  <p>{selectedEmployee.assignment_count ?? 0}</p>
                </div>
                <div className="dispatch-stat">
                  <p>Tier</p>
                  <p>{selectedEmployee.subscription_tier ?? "Free"}</p>
                </div>
              </div>
              <div className="mt-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-200">Skill chips</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(selectedEmployee.skills?.length ? selectedEmployee.skills : [{ skill_name: "General Operations", proficiency_level: 3 }]).map((skill) => (
                    <span key={`${selectedEmployee.user_id}-${skill.skill_name}`} className="dispatch-chip">
                      {skill.skill_name} L{skill.proficiency_level ?? 3}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="dispatch-capability-card">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="dashboard-eyebrow text-teal-200">Capability map</p>
                  <h3 className="mt-1 text-2xl font-black text-white">Dispatch readiness</h3>
                </div>
                <span className="dispatch-live-pill">Ready for routing</span>
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                <AbilityRadar employee={selectedEmployee} />
                <CapabilityMeters employee={selectedEmployee} />
              </div>
            </div>
          </div>
        </article>
      ) : null}
    </section>
  );
}

function CustomReportSection({ report }) {
  if (!report) return null;

  return (
    <section className="dashboard-card optima-report-card p-6">
      <p className="optima-report-eyebrow">Custom reporting</p>
      <h2 className="mt-1 text-2xl font-black text-[#07183b]">AI action notes</h2>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {(report.insights ?? []).map((note) => (
          <p key={note} className="optima-report-note">{note}</p>
        ))}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="optima-report-load-row">
          <p className="text-sm font-black text-[#07183b]">Completion</p>
          <p className="mt-1 text-2xl font-black text-[#0a72e8]">{report.rates?.completionRate ?? 0}%</p>
        </div>
        <div className="optima-report-load-row">
          <p className="text-sm font-black text-[#07183b]">Assignment coverage</p>
          <p className="mt-1 text-2xl font-black text-[#0a72e8]">{report.rates?.assignmentCoverage ?? 0}%</p>
        </div>
        <div className="optima-report-load-row">
          <p className="text-sm font-black text-[#07183b]">Paid users</p>
          <p className="mt-1 text-2xl font-black text-[#0a72e8]">{report.totals?.paidUsers ?? 0}</p>
        </div>
      </div>
      {report.aiProvider ? (
        <p className="optimus-ai-provider">Source: {report.aiProvider === "openai" ? "Optimus AI API" : "Local rules fallback"}</p>
      ) : null}
    </section>
  );
}

function TeamBuilderPanel({
  employees,
  inviteEmployeeId,
  isSidebarCollapsed,
  selectedTeamId,
  teamDraft,
  teams,
  onCreateTeam,
  onInviteEmployee,
  onSelectTeam,
  onToggleSidebar,
  onSetInviteEmployeeId,
  onSetTeamDraft,
}) {
  const selectedTeam = teams.find((team) => team.teamId === selectedTeamId) ?? teams[0];
  const invitedIds = new Set([
    ...(selectedTeam?.members ?? []).map((member) => member.userId),
    ...(selectedTeam?.invitations ?? [])
      .filter((invitation) => invitation.status === "Pending")
      .map((invitation) => invitation.employeeId),
  ]);
  const availableEmployees = employees.filter((employee) => !invitedIds.has(employee.user_id));

  return (
    <section className={`team-builder-shell ${isSidebarCollapsed ? "is-sidebar-collapsed" : ""}`}>
      <aside className={`team-builder-sidebar ${isSidebarCollapsed ? "is-collapsed" : ""}`}>
        <div className="team-builder-sidebar-head">
          <h2>Team</h2>
          <button type="button" onClick={onToggleSidebar} aria-label="Toggle team sidebar">
            {isSidebarCollapsed ? "▷" : "◁"}
          </button>
        </div>
        <form className="team-builder-create" onSubmit={onCreateTeam}>
          <input
            value={teamDraft}
            onChange={(event) => onSetTeamDraft(event.target.value)}
            placeholder="Create team"
          />
          <button type="submit">Add</button>
        </form>
        <div className="team-builder-list">
          {teams.map((team) => (
            <button
              key={team.teamId}
              type="button"
              className={team.teamId === selectedTeam?.teamId ? "is-active" : ""}
              onClick={() => onSelectTeam(team.teamId)}
            >
              <span className="workspace-reference-square" aria-hidden="true" />
              <span>{team.name}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="team-builder-main">
        <div className="team-builder-title-row">
          <div>
            <p className="dashboard-eyebrow">Team management</p>
            <h1>My Team</h1>
            <p>Managers can create teams and invite employees. Employees receive a notification and decide whether to join.</p>
          </div>
          <form className="team-builder-invite" onSubmit={onInviteEmployee}>
            <select
              value={inviteEmployeeId}
              onChange={(event) => onSetInviteEmployeeId(event.target.value)}
              aria-label="Select employee to invite"
            >
              <option value="">Select employee</option>
              {availableEmployees.map((employee) => (
                <option key={employee.user_id} value={employee.user_id}>
                  {getDisplayName(employee)} · {employee.email}
                </option>
              ))}
            </select>
            <button type="submit">Invite employee</button>
          </form>
        </div>

        <div className="team-builder-cards">
          <article className="team-member-card is-owner">
            <div className="team-member-meta">
              <span className="team-member-dot" />
              <span>Inactive</span>
              <strong>Owner</strong>
            </div>
            <EmployeeAvatar
              employee={{ user_id: "optima-manager", username: "optima_manager", email: "manager@workflow.test" }}
              className="team-member-photo"
            />
            <h2>optima_manager</h2>
            <p>Manager</p>
            <span className="team-member-department">Information Technology</span>
            <div className="team-member-availability is-available">⚡ Available</div>
          </article>

          {(selectedTeam?.members ?? []).map((member, index) => {
            const employee = employees.find((item) => item.user_id === member.userId) ?? member;
            return (
              <article key={member.userId} className="team-member-card">
                <div className="team-member-meta">
                  <span className="team-member-dot" />
                  <span>{member.status === "Accepted" ? "Active" : "Inactive"}</span>
                  <strong>{member.role ?? "Member"}</strong>
                </div>
                <EmployeeAvatar employee={employee} index={index} className="team-member-photo" />
                <h2>{getDisplayName(employee)}</h2>
                <p>{employee.role?.role_name || "Employee"}</p>
                <span className="team-member-department">{employee.department || "Information Technology"}</span>
                <div className="team-member-availability">⚡ No availability set</div>
              </article>
            );
          })}

          {(selectedTeam?.invitations ?? [])
            .filter((invitation) => invitation.status !== "Accepted")
            .map((invitation) => (
              <article key={invitation.inviteId} className="team-member-card is-pending">
                <div className="team-member-meta">
                  <span className="team-member-dot" />
                  <span>{invitation.status}</span>
                  <strong>Invite</strong>
                </div>
                <EmployeeAvatar
                  employee={{
                    user_id: invitation.employeeId,
                    username: invitation.employeeName,
                    email: invitation.employeeEmail,
                  }}
                  className="team-member-photo"
                />
                <h2>{invitation.employeeName}</h2>
                <p>{invitation.employeeEmail}</p>
                <span className="team-member-department">Waiting for employee response</span>
                <div className="team-member-availability">⏳ Invitation pending</div>
              </article>
            ))}
        </div>
      </div>
    </section>
  );
}

export default function TeamManagement() {
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isTeamSidebarCollapsed, setIsTeamSidebarCollapsed] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [teamDraft, setTeamDraft] = useState("");
  const [inviteEmployeeId, setInviteEmployeeId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [paidFeatures, setPaidFeatures] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [selectedRosterEmployeeId, setSelectedRosterEmployeeId] = useState("");
  const [selectedAutoTask, setSelectedAutoTask] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isCheckingRecommendation, setIsCheckingRecommendation] = useState(false);
  const [assigningCandidateId, setAssigningCandidateId] = useState("");

  const selectedRosterEmployee = useMemo(
    () => employees.find((employee) => employee.user_id === selectedRosterEmployeeId) ?? employees[0] ?? null,
    [employees, selectedRosterEmployeeId],
  );

  async function loadData() {
    try {
      const headers = await getAuthHeaders();
      const [employeesResponse, tasksResponse, requestsResponse, assignmentsResponse, paidFeaturesResponse] =
        await Promise.all([
          fetch("/api/employees", { headers }),
          fetch("/api/tasks", { headers }),
          fetch("/api/task-requests", { headers }),
          fetch("/api/task-assignments", { headers }),
          fetch("/api/paid-features", { headers }),
        ]);
      const [employeesResult, tasksResult, requestsResult, assignmentsResult, paidFeaturesResult] =
        await Promise.all([
          employeesResponse.json(),
          tasksResponse.json(),
          requestsResponse.json(),
          assignmentsResponse.json(),
          paidFeaturesResponse.json(),
        ]);

      if (!employeesResponse.ok) throw new Error(employeesResult.error || "Could not load employees.");
      if (!tasksResponse.ok) throw new Error(tasksResult.error || "Could not load tasks.");
      if (!requestsResponse.ok) throw new Error(requestsResult.error || "Could not load task requests.");
      if (!assignmentsResponse.ok) throw new Error(assignmentsResult.error || "Could not load assignment history.");
      if (!paidFeaturesResponse.ok) throw new Error(paidFeaturesResult.error || "Could not load paid features.");

      const assignmentCounts = new Map();
      (assignmentsResult.assignments ?? []).forEach((assignment) => {
        const userId = assignment.user?.user_id ?? assignment.user_id;
        if (!userId) return;
        assignmentCounts.set(userId, (assignmentCounts.get(userId) ?? 0) + 1);
      });

      const employeeRows = (employeesResult.employees ?? []).map((employee) => ({
        ...employee,
        assignment_count: assignmentCounts.get(employee.user_id) ?? 0,
      }));
      const storedTeams = readLocalTeams();
      const nextTeams = storedTeams.length ? storedTeams : createDefaultTeams(employeeRows);

      setEmployees(employeeRows);
      setTeams(nextTeams);
      setSelectedTeamId((current) => current || nextTeams[0]?.teamId || "");
      if (!storedTeams.length) writeLocalTeams(nextTeams);
      setSelectedRosterEmployeeId((current) => current || employeeRows[0]?.user_id || "");
      setTasks(tasksResult.tasks ?? []);
      setSelectedAutoTask((current) => current || tasksResult.tasks?.[0]?.task_id || "");
      setRequests(requestsResult.requests ?? []);
      setAssignments(assignmentsResult.assignments ?? []);
      setPaidFeatures(paidFeaturesResult);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadData();
    }, 0);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    function handleTeamsUpdated() {
      const nextTeams = readLocalTeams();
      setTeams(nextTeams);
      setSelectedTeamId((current) => current || nextTeams[0]?.teamId || "");
    }

    window.addEventListener("optima:teams-updated", handleTeamsUpdated);
    return () => window.removeEventListener("optima:teams-updated", handleTeamsUpdated);
  }, []);

  function createTeam(event) {
    event.preventDefault();
    const name = teamDraft.trim();

    if (!name) {
      setError("Enter a team name first.");
      return;
    }

    const nextTeam = {
      teamId: `team-${teams.length + 1}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name,
      createdBy: "optima_manager",
      members: [],
      invitations: [],
    };
    const nextTeams = [...teams, nextTeam];

    setTeams(nextTeams);
    setSelectedTeamId(nextTeam.teamId);
    setTeamDraft("");
    setMessage("Team created.");
    setError("");
    writeLocalTeams(nextTeams);
  }

  function inviteEmployee(event) {
    event.preventDefault();
    const employee = employees.find((item) => item.user_id === inviteEmployeeId);
    const team = teams.find((item) => item.teamId === selectedTeamId) ?? teams[0];

    if (!team || !employee) {
      setError("Select a team and employee first.");
      return;
    }

    const nextInvite = {
      inviteId: `invite-${team.teamId}-${employee.user_id}`,
      employeeId: employee.user_id,
      employeeEmail: employee.email,
      employeeName: getDisplayName(employee),
      status: "Pending",
      createdAt: "Pending employee response",
    };
    const nextTeams = teams.map((item) =>
      item.teamId === team.teamId
        ? {
            ...item,
            invitations: [
              ...(item.invitations ?? []).filter((invitation) => invitation.employeeId !== employee.user_id),
              nextInvite,
            ],
          }
        : item,
    );

    setTeams(nextTeams);
    setInviteEmployeeId("");
    setMessage(`${getDisplayName(employee)} was invited to ${team.name}.`);
    setError("");
    writeLocalTeams(nextTeams);
  }

  async function assignTask(employee, taskId) {

    if (!taskId) {
      setError("Select a task first.");
      return;
    }

    try {
      setAssigningCandidateId(employee.user_id);
      const response = await fetch("/api/task-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({ taskId, userId: employee.user_id }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Could not assign task.");

      if (result.evaluation) {
        setRecommendation({
          task: tasks.find((task) => String(task.task_id) === String(taskId)) ?? null,
          recommendations: [{ employee, evaluation: result.evaluation, confidence: confidenceFromEvaluation(result.evaluation) }],
          recommendation: {
            title: "Availability checks complete",
            confidence: confidenceFromEvaluation(result.evaluation),
            summary: `${getDisplayName(employee)} passed availability and eligibility checks for ${taskTitle(tasks, taskId)}.`,
            rationale: result.evaluation.reasons ?? [],
          },
        });
      }

      setMessage(`Task assigned to ${getDisplayName(employee)}.`);
      setError("");
      await loadData();
    } catch (assignError) {
      setError(assignError.message);
    } finally {
      setAssigningCandidateId("");
    }
  }

  async function previewRecommendation() {
    if (!selectedAutoTask) {
      setError("Select a task before checking recommendations.");
      return;
    }

    try {
      setIsCheckingRecommendation(true);
      const response = await fetch(`/api/allocation-recommendations?taskId=${selectedAutoTask}`, {
        headers: await getAuthHeaders(),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Could not generate recommendation.");

      setRecommendation(result);
      setMessage(`${result.recommendation?.summary ?? "Recommendation generated."}`);
      setError("");
    } catch (recommendationError) {
      setError(recommendationError.message);
    } finally {
      setIsCheckingRecommendation(false);
    }
  }

  async function autoAssignTask() {
    if (!selectedAutoTask) {
      setError("Select a task before auto assigning.");
      return;
    }

    try {
      setIsCheckingRecommendation(true);
      const response = await fetch("/api/task-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({ taskId: selectedAutoTask, mode: "auto" }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Could not auto assign task.");

      setRecommendation({
        task: tasks.find((task) => String(task.task_id) === String(selectedAutoTask)) ?? null,
        recommendations: result.employee
          ? [{ employee: result.employee, evaluation: result.evaluation, confidence: confidenceFromEvaluation(result.evaluation) }]
          : [],
        recommendation: result.recommendation,
      });
      setMessage(`Auto assigned ${taskTitle(tasks, selectedAutoTask)}.`);
      setError("");
      await loadData();
    } catch (assignError) {
      setError(assignError.message);
    } finally {
      setIsCheckingRecommendation(false);
    }
  }

  async function reviewRequest(request, status) {
    try {
      const response = await fetch("/api/task-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({ requestId: request.request_id, status }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Could not update request.");

      setMessage(`Request ${status.toLowerCase()}.`);
      setError("");
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="space-y-6">
      <TeamBuilderPanel
        employees={employees}
        inviteEmployeeId={inviteEmployeeId}
        isSidebarCollapsed={isTeamSidebarCollapsed}
        selectedTeamId={selectedTeamId}
        teamDraft={teamDraft}
        teams={teams}
        onCreateTeam={createTeam}
        onInviteEmployee={inviteEmployee}
        onSelectTeam={setSelectedTeamId}
        onToggleSidebar={() => setIsTeamSidebarCollapsed((current) => !current)}
        onSetInviteEmployeeId={setInviteEmployeeId}
        onSetTeamDraft={setTeamDraft}
      />

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-[#0a2a66]">
          {message}
        </p>
      ) : null}

      <section className="dashboard-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="dashboard-eyebrow">Paid Pro automation</p>
            <h2 className="mt-1 text-2xl font-black text-[#07183b]">Smart allocation and AI recommendations</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#52627a]">
              Preview availability, conflict, skill, and qualification checks before assigning. Paid Pro can then assign the strongest eligible match automatically.
            </p>
          </div>
          <UserTierBadge tier={paidFeatures?.tier ?? "Free"} />
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <select
            value={selectedAutoTask}
            onChange={(event) => setSelectedAutoTask(event.target.value)}
            className="h-12 rounded-xl border border-[#b8c4d8] bg-white px-4 text-sm text-[#07183b] outline-none"
          >
            <option value="">Select task</option>
            {tasks.map((task) => (
              <option key={task.task_id} value={task.task_id}>{task.title}</option>
            ))}
          </select>
          <button type="button" className="dashboard-button" onClick={previewRecommendation} disabled={isCheckingRecommendation}>
            {isCheckingRecommendation ? "Checking..." : "Preview Recommendation"}
          </button>
          <button type="button" className="dashboard-button" onClick={autoAssignTask} disabled={isCheckingRecommendation}>
            Auto Assign
          </button>
        </div>
      </section>

      <RecommendationPanel
        recommendation={recommendation}
        employees={employees}
        onAssign={(employee) => assignTask(employee, selectedAutoTask)}
        assigningCandidateId={assigningCandidateId}
      />

      <RequestApprovalPanel requests={requests} onReview={reviewRequest} />

      <DispatchBoard
        employees={employees}
        selectedEmployee={selectedRosterEmployee}
        onSelect={setSelectedRosterEmployeeId}
      />

      <CustomReportSection report={paidFeatures?.report} />

      <p className="hidden">Assignments loaded: {assignments.length}</p>
    </div>
  );
}
