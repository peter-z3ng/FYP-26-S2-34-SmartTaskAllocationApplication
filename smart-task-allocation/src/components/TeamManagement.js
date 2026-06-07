"use client";

import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import UserTierBadge from "@/components/UserTierBadge";
import { getAuthHeaders } from "@/lib/clientAuth";

function confidenceFromEvaluation(evaluation) {
  const totalChecks = Math.max(1, evaluation?.reasons?.length ?? 3);
  return Math.round(((evaluation?.score ?? 0) / totalChecks) * 100);
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

function formatAvailability(row) {
  return `${row.day_of_week ?? "Day"} ${String(row.start_time ?? "").slice(0, 5)}-${String(row.end_time ?? "").slice(0, 5)}`;
}

export default function TeamManagement() {
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [paidFeatures, setPaidFeatures] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [selectedRosterEmployeeId, setSelectedRosterEmployeeId] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTasks, setSelectedTasks] = useState({});
  const [selectedAutoTask, setSelectedAutoTask] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isCheckingRecommendation, setIsCheckingRecommendation] = useState(false);
  const [assigningCandidateId, setAssigningCandidateId] = useState("");

  const isPaid = paidFeatures?.isPaid === true;
  const membershipLoaded = paidFeatures !== null;
  const paidLockedMessage =
    paidFeatures?.upgradeMessage ??
    "Upgrade to Paid Pro to unlock smart allocation, availability checks, request approval, AI recommendations, priority support, and custom reporting.";

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
      const employeesResult = await employeesResponse.json();
      const tasksResult = await tasksResponse.json();
      const requestsResult = await requestsResponse.json();
      const assignmentsResult = await assignmentsResponse.json();
      const paidFeaturesResult = await paidFeaturesResponse.json();

      if (!employeesResponse.ok) throw new Error(employeesResult.error || "Could not load employees.");
      if (!tasksResponse.ok) throw new Error(tasksResult.error || "Could not load tasks.");
      if (!requestsResponse.ok) throw new Error(requestsResult.error || "Could not load task requests.");
      if (!assignmentsResponse.ok) throw new Error(assignmentsResult.error || "Could not load assignment history.");
      if (!paidFeaturesResponse.ok) throw new Error(paidFeaturesResult.error || "Could not load paid features.");

      setEmployees(employeesResult.employees);
      setSelectedRosterEmployeeId((current) => current || employeesResult.employees?.[0]?.user_id || "");
      setTasks(tasksResult.tasks);
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

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return employees.filter((employee) =>
      `${employee.username} ${employee.email}`.toLowerCase().includes(normalizedSearch),
    );
  }, [employees, search]);

  const selectedRosterEmployee = useMemo(
    () =>
      filteredEmployees.find((employee) => employee.user_id === selectedRosterEmployeeId) ??
      filteredEmployees[0] ??
      employees.find((employee) => employee.user_id === selectedRosterEmployeeId) ??
      employees[0] ??
      null,
    [employees, filteredEmployees, selectedRosterEmployeeId],
  );

  async function assignTask(employee) {
    const taskId = selectedTasks[employee.user_id];

    if (!taskId) {
      setError("Select a task first.");
      return;
    }

    try {
      const response = await fetch("/api/task-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({
          taskId,
          userId: employee.user_id,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not assign task.");
      }

      if (isPaid && result.evaluation) {
        const confidence = confidenceFromEvaluation(result.evaluation);
        setRecommendation({
          task: tasks.find((task) => String(task.task_id) === String(taskId)) ?? null,
          recommendations: [{ employee, evaluation: result.evaluation, confidence }],
          recommendation: {
            title: "Availability checks complete",
            confidence,
            summary: `${employee.username} passed paid availability and eligibility checks for ${taskTitle(tasks, taskId)}.`,
            rationale: result.evaluation.reasons ?? [],
            coverage: "Manual assignment checked before save.",
          },
        });
      }

      setMessage(`Task assigned to ${employee.username}.`);
      setError("");
      await loadData();
    } catch (assignError) {
      setError(assignError.message);
    }
  }

  async function previewRecommendation() {
    if (!selectedAutoTask) {
      setError("Select a task before checking recommendations.");
      return;
    }

    if (!isPaid) {
      setError(paidLockedMessage);
      return;
    }

    setIsCheckingRecommendation(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/allocation-recommendations?taskId=${encodeURIComponent(selectedAutoTask)}`, {
        headers: await getAuthHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not generate recommendations.");
      }

      setRecommendation(result);
      setMessage(result.recommendation?.summary ?? "Recommendation preview generated.");
    } catch (recommendationError) {
      setError(recommendationError.message);
    } finally {
      setIsCheckingRecommendation(false);
    }
  }

  async function autoAssignTask() {
    if (!selectedAutoTask) {
      setError("Select a task for automatic assignment.");
      return;
    }

    if (!isPaid) {
      setError(paidLockedMessage);
      return;
    }

    try {
      const response = await fetch("/api/task-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({
          taskId: selectedAutoTask,
          mode: "auto",
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not automatically assign task.");
      }

      setRecommendation({
        task: tasks.find((task) => String(task.task_id) === String(selectedAutoTask)) ?? null,
        assignedEmployeeId: result.employee?.user_id ?? "",
        assignmentSaved: true,
        recommendations: [
          {
            employee: result.employee,
            evaluation: result.evaluation,
            confidence: confidenceFromEvaluation(result.evaluation),
          },
        ],
        recommendation: result.recommendation,
      });
      setMessage(result.recommendation?.summary ?? `Task automatically assigned to ${result.employee?.username ?? "an eligible employee"}.`);
      setError("");
      setSelectedAutoTask("");
      await loadData();
    } catch (assignError) {
      setError(assignError.message);
    }
  }

  async function assignRecommendedCandidate(candidate) {
    const taskId = recommendation?.task?.task_id;
    const userId = candidate?.employee?.user_id;

    if (!taskId || !userId) {
      setError("Recommendation task or employee is missing.");
      return;
    }

    setAssigningCandidateId(userId);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/task-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({
          taskId,
          userId,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not assign recommended employee.");
      }

      setRecommendation((current) => {
        if (!current) return current;

        return {
          ...current,
          assignedEmployeeId: userId,
          assignmentSaved: true,
          recommendation: {
            title: "Assignment saved",
            confidence: candidate.confidence ?? confidenceFromEvaluation(result.evaluation),
            summary: `${candidate.employee?.username ?? "Recommended employee"} has been assigned to ${
              current.task?.title ?? "the selected task"
            }.`,
            rationale: result.evaluation?.reasons ?? candidate.evaluation?.reasons ?? [],
            coverage: current.recommendation?.coverage ?? "Recommendation converted into a task assignment.",
          },
        };
      });
      setMessage(`Assigned ${candidate.employee?.username ?? "recommended employee"} to ${recommendation.task?.title ?? "the selected task"}.`);
      await loadData();
    } catch (assignError) {
      setError(assignError.message);
    } finally {
      setAssigningCandidateId("");
    }
  }

  async function reviewRequest(requestId, status) {
    if (!isPaid) {
      setError(paidLockedMessage);
      return;
    }

    try {
      const response = await fetch("/api/task-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({ requestId, status }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update request.");
      }

      setMessage(`Task request ${status.toLowerCase()}.`);
      setError("");
      await loadData();
    } catch (reviewError) {
      setError(reviewError.message);
    }
  }

  return (
    <div className="space-y-6">
      <PaidFeatureOverview paidFeatures={paidFeatures} />

      <section className="dashboard-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="dashboard-eyebrow">Paid Pro Automation</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Smart allocation and AI recommendations</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Preview availability, conflict, skill, and qualification checks before assigning. Paid Pro can then assign
              the strongest eligible match automatically.
            </p>
          </div>
          <UserTierBadge tier={paidFeatures?.tier ?? "Free"} />
        </div>

        {!membershipLoaded ? (
          <p className="mt-5 dashboard-alert-info">Loading membership capabilities...</p>
        ) : null}

        {membershipLoaded && !isPaid ? <p className="mt-5 dashboard-alert-error">{paidLockedMessage}</p> : null}

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <select
            value={selectedAutoTask}
            onChange={(event) => {
              setSelectedAutoTask(event.target.value);
              setRecommendation(null);
            }}
            className="dashboard-input"
          >
            <option value="">Select task</option>
            {tasks.map((task) => (
              <option key={task.task_id} value={task.task_id}>
                {task.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={previewRecommendation}
            disabled={!membershipLoaded || !isPaid || isCheckingRecommendation}
            className="dashboard-button disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCheckingRecommendation ? "Checking..." : "Preview Recommendation"}
          </button>
          <button
            type="button"
            onClick={autoAssignTask}
            disabled={!membershipLoaded || !isPaid}
            className="dashboard-button bg-[#0a2a66] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Auto Assign
          </button>
        </div>
      </section>

      {recommendation ? (
        <RecommendationPanel
          result={recommendation}
          assigningCandidateId={assigningCandidateId}
          onAssignCandidate={assignRecommendedCandidate}
        />
      ) : null}

      {error ? (
        <p className="dashboard-alert-error">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="dashboard-alert-info">
          {message}
        </p>
      ) : null}

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search employees"
        className="h-14 w-full rounded-full border border-white/20 bg-white/90 px-8 text-lg text-[#07183b] shadow-sm outline-none placeholder:text-[#64748b] focus:border-teal-300 focus:ring-4 focus:ring-teal-200/30"
      />

      <DispatchEmployeeBoard
        employees={filteredEmployees}
        selectedEmployee={selectedRosterEmployee}
        onSelect={(employee) => setSelectedRosterEmployeeId(employee.user_id)}
      />

      <section className="dashboard-card p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="dashboard-eyebrow">Availability checks</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Employees</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Manual assignment stays available, while Paid Pro unlocks detailed recommendation previews.
            </p>
          </div>
          <span className="rounded-full bg-teal-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-teal-700">
            {filteredEmployees.length} profiles
          </span>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {filteredEmployees.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#b8c4d8] p-5 text-sm text-[#52627a]">
              No employee records found.
            </p>
          ) : null}

          {filteredEmployees.map((employee, index) => (
            <article
              key={employee.user_id}
              className="motion-card rounded-2xl border border-[#d8e0ee] bg-white/82 p-5 shadow-sm"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#07183b]">{employee.username}</h2>
                  <p className="mt-1 text-sm text-[#52627a]">{employee.email}</p>
                </div>
                <UserTierBadge tier={employee.subscription_tier} size="sm" />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-[#eef2f8] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#0a2a66]">
                  {employee.account_status}
                </span>
                {isPaid ? (
                  <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                    Detailed checks enabled
                  </span>
                ) : null}
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <select
                  value={selectedTasks[employee.user_id] ?? ""}
                  onChange={(event) =>
                    setSelectedTasks((current) => ({
                      ...current,
                      [employee.user_id]: event.target.value,
                    }))
                  }
                  className="dashboard-input sm:flex-1"
                >
                  <option value="">Select task</option>
                  {tasks.map((task) => (
                    <option key={task.task_id} value={task.task_id}>
                      {task.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => assignTask(employee)}
                  className="dashboard-button bg-[#0a2a66]"
                >
                  Assign
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-card p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="dashboard-eyebrow">Request approval</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Task Assignment Requests</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Paid Pro managers can approve requests and trigger the same assignment checks automatically.
            </p>
          </div>
          <UserTierBadge tier={paidFeatures?.tier ?? "Free"} size="sm" />
        </div>
        <div className="mt-5 grid gap-4">
          {requests.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#b8c4d8] p-5 text-sm text-[#52627a]">
              No task assignment requests found.
            </p>
          ) : null}

          {requests.map((requestRow) => (
            <article key={requestRow.request_id} className="rounded-2xl border border-[#d8e0ee] bg-white/82 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="font-black text-[#07183b]">{requestRow.task?.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <p className="text-sm text-[#52627a]">
                      Requested by {requestRow.user?.username ?? requestRow.user?.email}
                    </p>
                    <UserTierBadge tier={requestRow.user?.subscription_tier} size="sm" />
                  </div>
                  <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black ${statusTone(requestRow.status)}`}>
                    {requestRow.status}
                  </span>
                </div>
                {requestRow.status === "Pending" ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => reviewRequest(requestRow.request_id, "Approved")}
                      disabled={!isPaid}
                      className="h-10 rounded-full bg-[#0a2a66] px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => reviewRequest(requestRow.request_id, "Rejected")}
                      disabled={!isPaid}
                      className="h-10 rounded-full border border-[#b8c4d8] bg-white px-4 text-sm font-black text-[#07183b] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <CustomReportSection paidFeatures={paidFeatures} />

      <section className="dashboard-card p-6">
        <h2 className="text-xl font-black text-[#07183b]">Task Allocation History</h2>
        <div className="mt-5 grid gap-4">
          {assignments.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#b8c4d8] p-5 text-sm text-[#52627a]">
              No allocation history found.
            </p>
          ) : null}

          {assignments.map((assignment) => (
            <article key={assignment.assignment_id} className="rounded-2xl border border-[#d8e0ee] bg-white/82 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-black text-[#07183b]">{assignment.task?.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <p className="text-sm text-[#52627a]">
                      Assigned to {assignment.user?.username ?? assignment.user?.email}
                    </p>
                    <UserTierBadge tier={assignment.user?.subscription_tier} size="sm" />
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${statusTone(assignment.status)}`}>
                    {assignment.status}
                  </span>
                  <p className="mt-1 text-xs text-[#57708f]">
                    {assignment.assigned_at ? new Date(assignment.assigned_at).toLocaleString() : ""}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function EmployeePhoto({ employee, className = "dispatch-avatar" }) {
  const photoUrl = employee.avatar?.photoUrl;

  return (
    <span className={`${className} tone-${employee.avatar?.tone ?? "teal"}`} aria-hidden="true">
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt=""
          fill
          loading="lazy"
          sizes={className === "dispatch-detail-avatar" ? "112px" : "91px"}
          unoptimized
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : null}
      <span>{employee.avatar?.initials ?? "TN"}</span>
    </span>
  );
}

function DispatchEmployeeBoard({ employees, selectedEmployee, onSelect }) {
  return (
    <section className="dispatch-board">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="dashboard-eyebrow text-teal-200">Manager dispatch board</p>
          <h2 className="mt-1 text-3xl font-black text-white">Employee Ability Grid</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Select an employee portrait to inspect profile details, current readiness, skill coverage, availability,
            and dispatch capacity.
          </p>
        </div>
        <span className="dispatch-live-pill">{employees.length} operators online</span>
      </div>

      <div className="dispatch-roster mt-6" role="list" aria-label="Employee ability roster">
        {employees.length === 0 ? <p className="manager-empty">No employee profiles match the current search.</p> : null}
        {employees.map((employee) => (
          <button
            key={employee.user_id}
            type="button"
            role="listitem"
            onClick={() => onSelect(employee)}
            className={`dispatch-card tone-${employee.avatar?.tone ?? "teal"} ${
              selectedEmployee?.user_id === employee.user_id ? "is-selected" : ""
            } ${employee.account_status !== "Active" ? "is-muted" : ""}`}
          >
            <span className="dispatch-card-status">{employee.account_status === "Active" ? "Standby" : "Offline"}</span>
            <EmployeePhoto employee={employee} />
            <span className="dispatch-name">{employee.username}</span>
            <span className="dispatch-role">{employee.subscription_tier === "Paid" ? "Paid Pro" : "Free"}</span>
          </button>
        ))}
      </div>

      <EmployeeAbilityDetail employee={selectedEmployee} />
    </section>
  );
}

function EmployeeAbilityDetail({ employee }) {
  if (!employee) {
    return null;
  }

  const skills = employee.skills ?? [];
  const availability = employee.availability ?? [];
  const abilities = employee.abilities ?? [];
  const topAbility = [...abilities].sort((left, right) => right.score - left.score)[0];

  return (
    <article className="dispatch-detail mt-6">
      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="dispatch-profile-card">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <EmployeePhoto employee={employee} className="dispatch-detail-avatar" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-2xl font-black text-white">{employee.username}</h3>
                <UserTierBadge tier={employee.subscription_tier} size="sm" />
              </div>
              <p className="mt-2 break-words text-sm font-bold text-slate-300">{employee.email}</p>
              {employee.avatar?.source ? (
                <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-teal-100">
                  Portrait source: {employee.avatar.source}
                </p>
              ) : null}
              <p className="mt-4 rounded-2xl bg-white/10 p-4 text-sm leading-6 text-slate-200">
                {employee.profile?.bio || "No employee biography has been added yet."}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <DispatchStat label="Status" value={employee.account_status} />
            <DispatchStat label="Load" value={`${employee.active_assignment_count ?? 0} active`} />
            <DispatchStat label="Best ability" value={topAbility?.label ?? "Pending"} />
          </div>

          <div className="mt-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-100">Skill chips</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.length === 0 ? <span className="dispatch-chip">No skills recorded</span> : null}
              {skills.map((skill) => (
                <span key={`${employee.user_id}-${skill.skill_id}`} className="dispatch-chip">
                  {skill.skill_name} L{skill.proficiency_level}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-100">Availability</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {availability.length === 0 ? (
                <span className="dispatch-chip">No availability rules</span>
              ) : null}
              {availability.slice(0, 6).map((row) => (
                <span key={row.availability_id ?? `${row.day_of_week}-${row.start_time}`} className="dispatch-chip">
                  {formatAvailability(row)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="dispatch-capability-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="dashboard-eyebrow text-teal-200">Capability map</p>
              <h3 className="mt-1 text-2xl font-black text-white">Dispatch readiness</h3>
            </div>
            <span className="dispatch-live-pill">
              {employee.account_status === "Active" ? "Ready for routing" : "Account suspended"}
            </span>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
            <AbilityRadar abilities={abilities} />
            <div className="space-y-4">
              {abilities.map((ability) => (
                <div key={ability.key}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-300">
                      {ability.label}
                    </span>
                    <span className="text-sm font-black text-white">{ability.score}%</span>
                  </div>
                  <div className="dispatch-meter">
                    <span style={{ "--meter-width": `${ability.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function DispatchStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-teal-100">{label}</p>
      <p className="mt-2 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function AbilityRadar({ abilities }) {
  const safeAbilities = abilities.length
    ? abilities
    : [
        { label: "Customer", score: 0 },
        { label: "Inventory", score: 0 },
        { label: "Availability", score: 0 },
        { label: "Readiness", score: 0 },
        { label: "Capacity", score: 0 },
      ];
  const size = 240;
  const center = size / 2;
  const maxRadius = 82;
  const points = safeAbilities.map((ability, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / safeAbilities.length;
    const radius = (Math.max(0, Math.min(100, ability.score)) / 100) * maxRadius;
    return {
      ...ability,
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
      labelX: center + Math.cos(angle) * (maxRadius + 26),
      labelY: center + Math.sin(angle) * (maxRadius + 26),
    };
  });
  const polygon = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <svg className="dispatch-radar" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Employee capability radar">
      {[0.33, 0.66, 1].map((level) => (
        <polygon
          key={level}
          points={safeAbilities
            .map((_, index) => {
              const angle = -Math.PI / 2 + (index * Math.PI * 2) / safeAbilities.length;
              return `${center + Math.cos(angle) * maxRadius * level},${center + Math.sin(angle) * maxRadius * level}`;
            })
            .join(" ")}
          className="dispatch-radar-grid"
        />
      ))}
      {points.map((point) => (
        <line key={`axis-${point.label}`} x1={center} y1={center} x2={point.labelX} y2={point.labelY} className="dispatch-radar-axis" />
      ))}
      <polygon points={polygon} className="dispatch-radar-shape" />
      {points.map((point) => (
        <g key={point.label}>
          <circle cx={point.x} cy={point.y} r="4" className="dispatch-radar-dot" />
          <text x={point.labelX} y={point.labelY} textAnchor="middle" dominantBaseline="middle" className="dispatch-radar-label">
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function PaidFeatureOverview({ paidFeatures }) {
  const features = paidFeatures?.features ?? [];
  const isPaid = paidFeatures?.isPaid === true;

  return (
    <section className="manager-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="dashboard-eyebrow text-teal-200">Membership features</p>
          <h2 className="mt-1 text-3xl font-black text-white">Paid Pro operation suite</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Smart allocation, eligibility checking, request approval, recommendation reasoning, priority support, and
            custom reports are handled as paid capabilities with server-side permission checks.
          </p>
        </div>
        <UserTierBadge tier={paidFeatures?.tier ?? "Free"} />
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {features.length === 0 ? <p className="manager-empty">Loading feature list...</p> : null}
        {features.map((feature, index) => (
          <article
            key={feature.key}
            className="rounded-2xl border border-white/12 bg-white/10 p-4"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-white">{feature.title}</h3>
              <span className={`rounded-full px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.14em] ${
                isPaid ? "bg-teal-200 text-teal-950" : "bg-white/10 text-slate-300"
              }`}>
                {isPaid ? "Available" : "Locked"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function RecommendationPanel({ result, assigningCandidateId, onAssignCandidate }) {
  const recommendation = result.recommendation;
  const candidates = result.recommendations ?? [];
  const taskId = result.task?.task_id;

  return (
    <section className="manager-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="dashboard-eyebrow text-teal-200">AI recommendations</p>
          <h2 className="mt-1 text-2xl font-black text-white">{recommendation?.title ?? "Recommendation preview"}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            {recommendation?.summary ?? "Review employee fit before saving an assignment."}
          </p>
        </div>
        <div className="manager-radial" style={{ "--progress": `${recommendation?.confidence ?? 0}%` }}>
          <span>{recommendation?.confidence ?? 0}%</span>
        </div>
      </div>

      {recommendation?.coverage ? (
        <p className="mt-4 rounded-2xl border border-teal-200/20 bg-white/10 px-4 py-3 text-sm font-bold text-teal-100">
          {recommendation.coverage}
        </p>
      ) : null}

      {recommendation?.rationale?.length ? (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {recommendation.rationale.map((reason) => (
            <div key={reason} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-bold leading-6 text-slate-200">
              {reason}
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {candidates.slice(0, 4).map((candidate) => {
          const candidateId = candidate.employee?.user_id ?? "";
          const isAssignedCandidate = result.assignedEmployeeId === candidateId;
          const canAssign = Boolean(taskId && candidate.evaluation?.eligible && onAssignCandidate);

          return (
            <article key={candidateId} className="rounded-2xl border border-white/10 bg-white/10 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-white">{candidate.employee?.username ?? candidate.employee?.email}</h3>
                  <p className="mt-1 text-xs font-bold text-slate-300">{candidate.employee?.account_status}</p>
                </div>
                <UserTierBadge tier={candidate.employee?.subscription_tier} size="sm" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-black ${
                  candidate.evaluation?.eligible ? "bg-teal-200 text-teal-950" : "bg-rose-200 text-rose-950"
                }`}>
                  {candidate.evaluation?.eligible ? "Eligible" : "Not eligible"}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-200">
                  {candidate.confidence ?? confidenceFromEvaluation(candidate.evaluation)}% confidence
                </span>
                {isAssignedCandidate ? (
                  <span className="rounded-full bg-lime-200 px-3 py-1 text-xs font-black text-lime-950">
                    Assigned
                  </span>
                ) : null}
              </div>
              <ul className="mt-4 space-y-2">
                {(candidate.evaluation?.reasons ?? []).map((reason) => (
                  <li key={reason} className="text-sm font-bold leading-6 text-slate-300">
                    {reason}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onAssignCandidate(candidate)}
                disabled={!canAssign || Boolean(assigningCandidateId) || isAssignedCandidate}
                className="manager-action-button mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAssignedCandidate
                  ? "Assigned to Task"
                  : assigningCandidateId === candidateId
                    ? "Assigning..."
                    : candidate.evaluation?.eligible
                      ? "Assign to This Task"
                      : "Not Eligible"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CustomReportSection({ paidFeatures }) {
  const isPaid = paidFeatures?.isPaid === true;
  const report = paidFeatures?.report;
  const totals = report?.totals ?? {};
  const rates = report?.rates ?? {};
  const metrics = [
    { label: "Total tasks", value: totals.totalTasks ?? 0 },
    { label: "Active tasks", value: totals.activeTasks ?? 0 },
    { label: "Pending requests", value: totals.pendingRequests ?? 0 },
    { label: "Paid users", value: totals.paidUsers ?? 0 },
  ];

  return (
    <section className="manager-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="dashboard-eyebrow text-teal-200">Custom reporting</p>
          <h2 className="mt-1 text-2xl font-black text-white">Paid Pro allocation report</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Custom reporting summarizes workload coverage, task progress, paid/free user split, and next best actions.
          </p>
        </div>
        <UserTierBadge tier={paidFeatures?.tier ?? "Free"} size="sm" />
      </div>

      {!paidFeatures ? <p className="mt-5 manager-empty">Loading report...</p> : null}
      {paidFeatures && !isPaid ? <p className="mt-5 manager-empty">{paidFeatures.upgradeMessage}</p> : null}

      {isPaid && report ? (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="manager-chart-card">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-100">{metric.label}</p>
                <p className="mt-2 text-3xl font-black text-white">{metric.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <ReportRate label="Completion rate" value={rates.completionRate ?? 0} />
            <ReportRate label="Active assignment coverage" value={rates.assignmentCoverage ?? 0} />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
            <div className="manager-chart-card">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-100">AI action notes</p>
              <ul className="mt-4 space-y-3">
                {(report.insights ?? []).map((insight) => (
                  <li key={insight} className="rounded-2xl bg-white/10 p-3 text-sm font-bold leading-6 text-slate-200">
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            <div className="manager-chart-card">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-100">Employee load</p>
              <div className="mt-4 space-y-3">
                {(report.employeeLoad ?? []).slice(0, 5).map((employee) => (
                  <div key={employee.userId} className="rounded-2xl bg-white/10 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-black text-white">{employee.username}</span>
                      <span className="text-xs font-bold text-slate-300">{employee.assignedTasks} tasks</span>
                    </div>
                    <div className="manager-bar-track mt-3">
                      <span
                        className="manager-bar-fill is-load"
                        style={{ "--bar-width": `${Math.max(10, Math.min(100, employee.assignedTasks * 34))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

function ReportRate({ label, value }) {
  return (
    <div className="manager-radial-card">
      <div className="manager-radial" style={{ "--progress": `${value}%` }}>
        <span>{value}%</span>
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-100">{label}</p>
        <div className="manager-bar-track mt-3">
          <span className="manager-bar-fill" style={{ "--bar-width": `${value}%` }} />
        </div>
      </div>
    </div>
  );
}
