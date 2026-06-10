"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AuthStatus from "@/components/AuthStatus";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const EMPTY_USER = {
  full_name: "",
  username: "",
  email: "",
  password: "",
  role_id: "",
  organization_id: "",
  account_status: "Active",
  max_weekly_hours: 40,
};

const EMPTY_TASK = {
  title: "",
  description: "",
  start_datetime: "",
  end_datetime: "",
  skill_id: "",
  qualification_id: "",
};

const EMPTY_ORGANIZATION = {
  organization_name: "",
  organization_code: "",
  organization_email: "",
  organization_type: "",
};

const EMPTY_ROLE = {
  role_id: "",
  role_name: "",
  base_role_id: "",
  description: "",
};

const FALLBACK_ROLES = [
  { role_id: 2, role_name: "Platform Admin" },
  { role_id: 1, role_name: "User Admin" },
  { role_id: 3, role_name: "Manager" },
  { role_id: 4, role_name: "Employee" },
];

const CORE_ROLE_NAMES = ["Platform Admin", "User Admin", "Manager", "Employee"];

const statusStyles = {
  Active: "border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]",
  Suspended: "border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]",
  Open: "border-[#93C5FD] bg-[#93C5FD]/25 text-[#0D1E4C]",
  Assigned: "border-[#2563EB]/25 bg-[#2563EB]/10 text-[#1E40AF]",
  Completed: "border-[#C7DDEB] bg-[#E0E5E9] text-[#1F293B]",
  Pending: "border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]",
  Approved: "border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]",
  "In Progress": "border-[#2563EB]/25 bg-[#2563EB]/10 text-[#1E40AF]",
  Eligible: "border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]",
  Blocked: "border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444]",
};

function normalize(value) {
  return value?.toLowerCase().replaceAll(" ", "_") ?? "";
}

function roleName(roleId, roles) {
  return roles.find((role) => Number(role.role_id) === Number(roleId))?.role_name ?? "";
}

function findRoleId(roles, name) {
  return roles.find((role) => normalize(role.role_name) === normalize(name))?.role_id ?? "";
}

function formatDateTime(value) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function taskHours(task) {
  if (!task?.start_datetime || !task?.end_datetime) return 0;
  return Math.max(0, (new Date(task.end_datetime) - new Date(task.start_datetime)) / 36e5);
}

function Chip({ children, tone = "Active" }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[tone] ?? statusStyles.Active}`}>
      {children}
    </span>
  );
}

function Section({ title, action, id, children }) {
  return (
    <section id={id} className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-[#07183b]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="space-y-1.5 text-sm font-semibold text-[var(--optima-primary)]">
      <span>{label}</span>
      {children}
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="h-11 w-full rounded-md border border-[#b8c4d8] bg-white px-3 text-sm text-[#2f3442] outline-none transition focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20 disabled:bg-white/70 disabled:text-[#64748B]"
    />
  );
}

function SelectInput(props) {
  return (
    <select
      {...props}
      className="h-11 w-full rounded-md border border-[#b8c4d8] bg-white px-3 text-sm text-[#2f3442] outline-none transition focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
    />
  );
}

function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex h-11 items-center justify-center rounded-md bg-[#0D1E4C] px-5 text-sm font-bold text-white transition hover:bg-[#0B1B32] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex h-10 items-center justify-center rounded-full border border-[#83A6CE] bg-white/60 px-5 text-sm font-bold text-[#0A2540] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export default function WorkflowDashboard({ embedded = false }) {
  const [activeRoleId, setActiveRoleId] = useState("");
  const [currentAccount, setCurrentAccount] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState(EMPTY_USER);
  const [newTask, setNewTask] = useState(EMPTY_TASK);
  const [newOrganization, setNewOrganization] = useState(EMPTY_ORGANIZATION);
  const [newRole, setNewRole] = useState(EMPTY_ROLE);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [showOrganizationForm, setShowOrganizationForm] = useState(false);
  const [organizationSearch, setOrganizationSearch] = useState("");
  const [data, setData] = useState({
    organizations: [],
    roles: [],
    users: [],
    profiles: [],
    skills: [],
    userSkills: [],
    qualifications: [],
    userQualifications: [],
    tasks: [],
    taskSkills: [],
    taskQualifications: [],
    assignments: [],
    requests: [],
    availability: [],
    activityLogs: [],
    taskComments: [],
  });

  const supabaseReady =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const roles = data.roles.length ? data.roles : FALLBACK_ROLES;
  const organization = data.organizations[0];
  const activeRole = roleName(activeRoleId, roles);
  const employeeRoleId = findRoleId(roles, "Employee");
  const managerRoleId = findRoleId(roles, "Manager");
  const userAdminRoleId = findRoleId(roles, "User Admin");
  const platformAdminRoleId = findRoleId(roles, "Platform Admin");
  const hasSignedInAccount = Boolean(currentAccount);
  const isPlatformAdmin = hasSignedInAccount && Number(activeRoleId) === Number(platformAdminRoleId);
  const isUserAdmin = hasSignedInAccount && Number(activeRoleId) === Number(userAdminRoleId);
  const canManageUsers =
    hasSignedInAccount &&
    [platformAdminRoleId, userAdminRoleId, managerRoleId].filter(Boolean).includes(Number(activeRoleId));
  const canCreateOrganization = isPlatformAdmin;
  const canCreateRole = isPlatformAdmin || isUserAdmin;
  const availableOrganizations = isPlatformAdmin
    ? data.organizations
    : data.organizations.filter((item) => item.organization_id === currentAccount?.organization_id);
  const accountOrganizations = availableOrganizations.length
    ? availableOrganizations
    : currentAccount?.organization_id
      ? [
          {
            organization_id: currentAccount.organization_id,
            organization_name: "Current organization",
          },
        ]
      : [];

  const enrichedUsers = useMemo(() => {
    return data.users.map((user) => {
      const profile = data.profiles.find((item) => item.user_id === user.user_id);
      const userSkillIds = data.userSkills.filter((item) => item.user_id === user.user_id).map((item) => item.skill_id);
      const userQualificationIds = data.userQualifications
        .filter((item) => item.user_id === user.user_id)
        .map((item) => item.qualification_id);
      const assignedHours = data.assignments
        .filter((assignment) => assignment.user_id === user.user_id && assignment.status !== "Completed")
        .reduce((total, assignment) => total + taskHours(data.tasks.find((task) => task.task_id === assignment.task_id)), 0);

      return {
        ...user,
        ...profile,
        skills: userSkillIds,
        qualifications: userQualificationIds,
        weekly_hours: assignedHours,
        max_weekly_hours: profile?.max_weekly_hours ?? 40,
      };
    });
  }, [data.assignments, data.profiles, data.tasks, data.userQualifications, data.userSkills, data.users]);

  const employeeUsers = enrichedUsers.filter((user) => Number(user.role_id) === Number(employeeRoleId));
  const selectedTask = data.tasks.find((task) => Number(task.task_id) === Number(selectedTaskId));
  const taskAssignments = data.assignments.map((assignment) => ({
    ...assignment,
    task: data.tasks.find((task) => task.task_id === assignment.task_id),
    user: enrichedUsers.find((user) => user.user_id === assignment.user_id),
  }));

  const loadData = useCallback(async () => {
    if (!supabaseReady) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session?.access_token) {
        setCurrentAccount(null);
        setActiveRoleId((currentRoleId) => currentRoleId || FALLBACK_ROLES[0].role_id);
        return;
      }

      const response = await fetch("/api/dashboard-data", {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load dashboard records.");
      }

      const nextData = result.data;

      setData(nextData);
      setCurrentAccount(result.currentAccount ?? null);
      setActiveRoleId((currentRoleId) =>
        result.currentAccount?.role_id ?? currentRoleId ?? nextData.roles[0]?.role_id ?? FALLBACK_ROLES[0].role_id,
      );
      setSelectedTaskId((currentTaskId) => currentTaskId || nextData.tasks[0]?.task_id || "");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [supabaseReady]);

  useEffect(() => {
    // Data loading is the external system sync for this screen.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  async function writeActivity(action, details) {
    const supabase = getSupabaseBrowserClient();
    const { error: activityError } = await supabase.from("activity_log").insert({ action, details });
    if (activityError && !activityError.message.includes("activity_log")) {
      throw activityError;
    }
  }

  async function createOrganization(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      if (!canCreateOrganization) {
        throw new Error("Only Platform Admins can create organisations.");
      }

      const supabase = getSupabaseBrowserClient();
      const { error: organizationError } = await supabase.from("organization").insert(newOrganization);
      if (organizationError) throw organizationError;

      setNewOrganization(EMPTY_ORGANIZATION);
      setShowOrganizationForm(false);
      setMessage("Organisation created.");
      await loadData();
    } catch (organizationError) {
      setError(organizationError.message);
    }
  }

  async function updateOrganization(organizationId, updates) {
    setError("");
    setMessage("");

    try {
      if (!canCreateOrganization) {
        throw new Error("Only Platform Admins can edit organisations.");
      }

      const supabase = getSupabaseBrowserClient();
      const { error: organizationError } = await supabase
        .from("organization")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("organization_id", organizationId);

      if (organizationError) throw organizationError;

      setMessage("Organisation updated.");
      await loadData();
    } catch (organizationError) {
      setError(organizationError.message);
    }
  }

  async function createRole(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      if (!canCreateRole) {
        throw new Error("Only Platform Admins can create roles.");
      }

      const supabase = getSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Log in as a Platform Admin before creating roles.");

      const response = await fetch("/api/roles", {
        method: newRole.role_id ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role_id: newRole.role_id,
          role_name: newRole.role_name,
          description: newRole.description,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to create role.");

      setNewRole(EMPTY_ROLE);
      setShowRoleForm(false);
      setMessage(newRole.role_id ? "Role updated." : "Role created.");
      await loadData();
    } catch (roleError) {
      setError(roleError.message);
    }
  }

  async function createUser(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const targetOrganizationId = newUser.organization_id || currentAccount?.organization_id || organization?.organization_id;
      if (!targetOrganizationId) throw new Error("Choose an organisation before adding users.");

      const supabase = getSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Log in as a User Admin or Manager before creating users.");

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newUser,
          organization_id: targetOrganizationId,
          role_id: Number(newUser.role_id || employeeRoleId),
          max_weekly_hours: Number(newUser.max_weekly_hours),
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to create user.");

      setNewUser({ ...EMPTY_USER, role_id: employeeRoleId || "" });
      setMessage("User account created.");
      await loadData();
    } catch (createError) {
      setError(createError.message);
    }
  }

  async function updateUser(userId, updates) {
    setError("");
    const supabase = getSupabaseBrowserClient();
    const { error: updateError } = await supabase
      .from("user_account")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await writeActivity("User updated", `Updated account ${userId}.`);
    await loadData();
  }

  async function createTask(event) {
    event.preventDefault();
    setError("");

    try {
      if (!organization?.organization_id) throw new Error("Create an organisation before adding tasks.");

      const supabase = getSupabaseBrowserClient();
      const { data: insertedTask, error: taskError } = await supabase
        .from("task")
        .insert({
          organization_id: organization.organization_id,
          task_code: `TASK-${Date.now()}`,
          title: newTask.title,
          description: newTask.description,
          status: "Open",
          start_datetime: newTask.start_datetime,
          end_datetime: newTask.end_datetime,
        })
        .select()
        .single();

      if (taskError) throw taskError;

      if (newTask.skill_id) {
        const { error: skillError } = await supabase.from("task_skill").insert({
          task_id: insertedTask.task_id,
          skill_id: Number(newTask.skill_id),
        });
        if (skillError) throw skillError;
      }

      if (newTask.qualification_id) {
        const { error: qualificationError } = await supabase.from("task_qualification").insert({
          task_id: insertedTask.task_id,
          qualification_id: Number(newTask.qualification_id),
        });
        if (qualificationError) throw qualificationError;
      }

      await writeActivity("Task created", `${insertedTask.task_code} created for allocation.`);
      setNewTask(EMPTY_TASK);
      setSelectedTaskId(insertedTask.task_id);
      setMessage("Task created.");
      await loadData();
    } catch (taskError) {
      setError(taskError.message);
    }
  }

  function taskSkillIds(taskId) {
    return data.taskSkills.filter((item) => item.task_id === taskId).map((item) => item.skill_id);
  }

  function taskQualificationIds(taskId) {
    return data.taskQualifications.filter((item) => item.task_id === taskId).map((item) => item.qualification_id);
  }

  function names(ids, source, key, label) {
    return ids.map((id) => source.find((item) => item[key] === id)?.[label]).filter(Boolean);
  }

  function evaluateEmployee(employee, task = selectedTask) {
    if (!task) return { eligible: false, reasons: ["Select a task first"] };

    const requiredSkills = taskSkillIds(task.task_id);
    const requiredQualifications = taskQualificationIds(task.task_id);
    const missingSkills = requiredSkills.filter((skillId) => !employee.skills.includes(skillId));
    const missingQualifications = requiredQualifications.filter((qualificationId) => !employee.qualifications.includes(qualificationId));
    const exceedsHours = employee.weekly_hours + taskHours(task) > employee.max_weekly_hours;
    const inactive = employee.account_status !== "Active";
    const assignedElsewhere = data.assignments.some((assignment) => assignment.user_id === employee.user_id && assignment.status !== "Completed");
    const eligible = !missingSkills.length && !missingQualifications.length && !exceedsHours && !inactive && !assignedElsewhere;

    return {
      eligible,
      reasons: [
        missingSkills.length ? `Missing skill: ${names(missingSkills, data.skills, "skill_id", "skill_name").join(", ")}` : "",
        missingQualifications.length
          ? `Missing qualification: ${names(missingQualifications, data.qualifications, "qualification_id", "qualification_name").join(", ")}`
          : "",
        exceedsHours ? "Weekly hour limit exceeded" : "",
        inactive ? "Account is not active" : "",
        assignedElsewhere ? "Already has an active assignment" : "",
      ].filter(Boolean),
    };
  }

  async function assignTask(userId, taskId = selectedTask?.task_id) {
    setError("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: assignmentError } = await supabase.from("task_assignment").insert({
        task_id: taskId,
        user_id: userId,
        assigned_at: new Date().toISOString(),
        status: "In Progress",
      });
      if (assignmentError) throw assignmentError;

      const { error: taskError } = await supabase.from("task").update({ status: "Assigned", updated_at: new Date().toISOString() }).eq("task_id", taskId);
      if (taskError) throw taskError;

      await supabase.from("task_assignment_request").update({ status: "Approved" }).eq("task_id", taskId).eq("user_id", userId);
      await writeActivity("Task assigned", `Task ${taskId} assigned to user ${userId}.`);
      setMessage("Task assigned.");
      await loadData();
    } catch (assignError) {
      setError(assignError.message);
    }
  }

  async function requestTask(taskId, userId) {
    setError("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: requestError } = await supabase.from("task_assignment_request").insert({
        task_id: taskId,
        user_id: userId,
        requested_at: new Date().toISOString(),
        status: "Pending",
      });
      if (requestError) throw requestError;

      await writeActivity("Task requested", `User ${userId} requested task ${taskId}.`);
      setMessage("Task request submitted.");
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  if (!supabaseReady) {
    return <SetupNotice />;
  }

  return (
    <main
      className={
        embedded
          ? "min-h-full text-[#07183b]"
          : "min-h-screen bg-[var(--background)] text-[var(--foreground)]"
      }
    >
      {!embedded ? (
      <header className="border-b border-[var(--optima-border)] bg-[var(--optima-surface)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <Link href="/" className="text-2xl font-black text-[var(--optima-primary)]">
              Optima
            </Link>
            <p className="text-sm font-semibold text-[var(--optima-muted)]">Smart Task Allocation Platform</p>
          </div>
          <AuthStatus />
        </div>
      </header>
      ) : null}

      <div className={embedded ? "pb-6" : "mx-auto max-w-7xl px-4 py-6 sm:px-6"}>
        {error ? <p className="mb-4 rounded-md border border-[#EF4444]/30 bg-[var(--optima-danger-bg)] px-4 py-3 text-sm font-semibold text-[var(--optima-danger)]">{error}</p> : null}
        {message ? <p className="mb-4 rounded-md border border-[#10B981]/30 bg-[var(--optima-success-bg)] px-4 py-3 text-sm font-semibold text-[var(--optima-success)]">{message}</p> : null}

        <section className={embedded ? "mb-6 grid gap-6 lg:grid-cols-2" : "mb-6 grid gap-4 lg:grid-cols-2"}>
          <div className={embedded ? "rounded-2xl bg-white p-6 shadow-sm" : "rounded-lg border border-[var(--optima-border)] bg-[var(--optima-surface)] p-5 shadow-sm"}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className={embedded ? "text-xl font-bold text-[#07183b]" : "text-xl font-black text-[var(--optima-primary)]"}>
                  Workspace Overview
                </h2>
                <p className={embedded ? "mt-2 max-w-2xl text-sm leading-6 text-[#52627a]" : "mt-1 max-w-2xl text-sm leading-6 text-[var(--optima-muted)]"}>
                  A platform summary area for organisations, users, roles, and active accounts.
                </p>
              </div>
              {!isPlatformAdmin && organization?.organization_code ? <Chip>{organization.organization_code}</Chip> : null}
            </div>
          </div>

          <div className={embedded ? "rounded-2xl bg-white p-6 shadow-sm" : "rounded-lg border border-[var(--optima-border)] bg-[var(--optima-surface)] p-5 shadow-sm"}>
            <h2 className={embedded ? "text-xl font-bold text-[#07183b]" : "text-lg font-bold text-[var(--optima-primary)]"}>Platform Overview</h2>
            <p className={embedded ? "mt-2 max-w-2xl text-sm leading-6 text-[#52627a]" : "mt-1 max-w-2xl text-sm leading-6 text-[var(--optima-muted)]"}>
              A quick view of platform organisations, users, roles, and account activity.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <Metric label="Organisations" value={data.organizations.length} />
              <Metric label="Users" value={enrichedUsers.length} />
              <Metric label="Roles" value={roles.length} />
              <Metric label="Active Accounts" value={enrichedUsers.filter((user) => user.account_status === "Active").length} />
            </div>
          </div>
        </section>

        {loading ? (
          <Section title="Loading">Loading database records...</Section>
        ) : !currentAccount ? (
          <SignInRequiredPanel />
        ) : !organization ? (
          <div className="space-y-6">
            {canCreateRole ? (
              <RoleAdminPanel
                roles={roles}
                organizations={accountOrganizations}
                currentAccount={currentAccount}
                newRole={newRole}
                setNewRole={setNewRole}
                createRole={createRole}
                showRoleForm={showRoleForm}
                setShowRoleForm={setShowRoleForm}
              />
            ) : null}
            {canManageUsers ? (
              <UserAdminPanel
                users={
                  isPlatformAdmin
                    ? enrichedUsers
                    : enrichedUsers.filter((user) => user.organization_id === currentAccount?.organization_id)
                }
                roles={roles}
                newUser={newUser}
                setNewUser={setNewUser}
                createUser={createUser}
                updateUser={updateUser}
                defaultRoleId={employeeRoleId}
                organizations={accountOrganizations}
                isPlatformAdmin={isPlatformAdmin}
                defaultOrganizationId={currentAccount?.organization_id || organization?.organization_id}
                showUserForm={showUserForm}
                setShowUserForm={setShowUserForm}
                userSearch={userSearch}
                setUserSearch={setUserSearch}
              />
            ) : null}
            <OrganizationSetupPanel
              organizations={accountOrganizations}
              newOrganization={newOrganization}
              setNewOrganization={setNewOrganization}
              createOrganization={createOrganization}
              updateOrganization={updateOrganization}
              canCreateOrganization={canCreateOrganization}
              showOrganizationForm={showOrganizationForm}
              setShowOrganizationForm={setShowOrganizationForm}
              organizationSearch={organizationSearch}
              setOrganizationSearch={setOrganizationSearch}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {canCreateOrganization ? (
              <OrganizationSetupPanel
                organizations={accountOrganizations}
                newOrganization={newOrganization}
                setNewOrganization={setNewOrganization}
                createOrganization={createOrganization}
                updateOrganization={updateOrganization}
                canCreateOrganization={canCreateOrganization}
                showOrganizationForm={showOrganizationForm}
                setShowOrganizationForm={setShowOrganizationForm}
                organizationSearch={organizationSearch}
                setOrganizationSearch={setOrganizationSearch}
              />
            ) : null}

            {canCreateRole ? (
              <RoleAdminPanel
                roles={roles}
                organizations={accountOrganizations}
                currentAccount={currentAccount}
                newRole={newRole}
                setNewRole={setNewRole}
                createRole={createRole}
                showRoleForm={showRoleForm}
                setShowRoleForm={setShowRoleForm}
              />
            ) : null}

            {canManageUsers ? (
              <UserAdminPanel
                users={
                  isPlatformAdmin
                    ? enrichedUsers
                    : enrichedUsers.filter((user) => user.organization_id === currentAccount?.organization_id)
                }
                roles={roles}
                newUser={newUser}
                setNewUser={setNewUser}
                createUser={createUser}
                updateUser={updateUser}
                defaultRoleId={employeeRoleId}
                organizations={accountOrganizations}
                isPlatformAdmin={isPlatformAdmin}
                defaultOrganizationId={currentAccount?.organization_id || organization?.organization_id}
                showUserForm={showUserForm}
                setShowUserForm={setShowUserForm}
                userSearch={userSearch}
                setUserSearch={setUserSearch}
              />
            ) : null}

            {normalize(activeRole).includes("manager") ? (
              <ManagerPanel
                data={data}
                tasks={data.tasks}
                selectedTask={selectedTask}
                selectedTaskId={selectedTaskId}
                setSelectedTaskId={setSelectedTaskId}
                employeeUsers={employeeUsers}
                evaluateEmployee={evaluateEmployee}
                assignTask={assignTask}
                createTask={createTask}
                newTask={newTask}
                setNewTask={setNewTask}
                taskSkillIds={taskSkillIds}
                taskQualificationIds={taskQualificationIds}
                names={names}
                users={enrichedUsers}
              />
            ) : null}

            {normalize(activeRole).includes("employee") ? (
              <EmployeePanel
                employee={employeeUsers[0]}
                data={data}
                assignments={taskAssignments}
                requestTask={requestTask}
              />
            ) : null}

            <UserFeedbackPanel comments={data.taskComments} tasks={data.tasks} users={enrichedUsers} />
          </div>
        )}
      </div>
    </main>
  );
}

function SetupNotice() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6">
      <section className="max-w-2xl rounded-lg border border-[var(--optima-border)] bg-[var(--optima-surface)] p-6 shadow-sm">
        <h1 className="text-2xl font-black text-[var(--optima-primary)]">Connect Supabase First</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Optima is database-backed. Add your Supabase keys to <code>.env.local</code>, then run the SQL setup file in your Supabase SQL editor.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-md bg-[var(--optima-primary)] p-4 text-sm text-white">
{`NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`}
        </pre>
      </section>
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md border border-[var(--optima-border)] bg-[var(--optima-surface-muted)] p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--optima-secondary)]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[var(--optima-primary)]">{value}</p>
    </div>
  );
}

function EmptyState({ text }) {
  return <p className="rounded-md border border-dashed border-[var(--optima-border)] bg-[var(--optima-surface-muted)] p-4 text-sm font-semibold text-[var(--optima-secondary)]">{text}</p>;
}

function UserFeedbackPanel({ comments, tasks, users }) {
  const feedbackItems = comments.map((comment) => {
    const task = tasks.find((item) => item.task_id === comment.task_id);
    const user = users.find((item) => item.user_id === comment.created_by);

    return {
      ...comment,
      task,
      user,
    };
  });

  return (
    <Section title="User Feedback Management">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-2xl text-sm leading-6 text-[var(--optima-muted)]">
          Review user-submitted feedback, identify common issues, and follow up with
          the relevant account or task owner.
        </p>
        <div className="rounded-full border border-[#83A6CE] bg-[#E0E5E9] px-4 py-2 text-sm font-black text-[#0D1E4C]">
          {feedbackItems.length} feedback item{feedbackItems.length === 1 ? "" : "s"}
        </div>
      </div>

      {feedbackItems.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {feedbackItems.map((feedback) => (
            <article
              key={feedback.comment_id}
              className="rounded-[24px] border-2 border-[#83A6CE] bg-[#E0E5E9] p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#57708f]">
                    {feedback.task?.title ?? `Task ${feedback.task_id}`}
                  </p>
                  <h3 className="mt-2 font-black text-[#07183b]">
                    {feedback.user?.full_name || feedback.user?.username || "Unknown user"}
                  </h3>
                </div>
                <Chip tone="Pending">Pending Review</Chip>
              </div>
              <p className="mt-4 text-sm leading-6 text-[#1F293B]">
                {feedback.comment_body || "No feedback message recorded."}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#52627a]">
                <span>{formatDateTime(feedback.created_at)}</span>
                <span className="font-semibold">Comment #{feedback.comment_id}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState text="No feedback yet." />
      )}
    </Section>
  );
}

function SignInRequiredPanel() {
  return (
    <Section title="Sign In Required">
      <p className="max-w-2xl text-sm leading-6 text-[var(--optima-muted)]">
        Dashboard actions are only available after logging in. Sign in with an assigned account to access organisation, user, task, and allocation tools.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link className="rounded-md bg-[var(--optima-button)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--optima-button-hover)]" href="/login">
          Log in
        </Link>
        <Link className="rounded-md border border-[var(--optima-border)] bg-[var(--optima-surface)] px-4 py-2 text-sm font-bold text-[var(--optima-primary)] hover:bg-[#93C5FD]/20" href="/">
          Back to Home
        </Link>
      </div>
    </Section>
  );
}

function OrganizationSetupPanel({
  organizations,
  newOrganization,
  setNewOrganization,
  createOrganization,
  updateOrganization,
  canCreateOrganization,
  showOrganizationForm,
  setShowOrganizationForm,
  organizationSearch,
  setOrganizationSearch,
}) {
  const normalizedSearch = organizationSearch.trim().toLowerCase();
  const filteredOrganizations = normalizedSearch
    ? organizations.filter((item) =>
        [
          item.organization_id,
          item.organization_name,
          item.organization_code,
          item.organization_email,
          item.organization_type,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch)),
      )
    : organizations;

  return (
    <Section
      id="organisations"
      title="Organisation Management"
      action={
        <PrimaryButton type="button" disabled={!canCreateOrganization} onClick={() => setShowOrganizationForm((current) => !current)}>
          {showOrganizationForm ? "Hide Form" : "Create Organisation"}
        </PrimaryButton>
      }
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-2xl text-sm leading-6 text-[var(--optima-muted)]">
          Search, create, and edit organisations. Platform Admins create companies before assigning User Admins, Managers, and Employees to them.
        </p>
        <div className="w-full sm:w-80">
          <Field label="Search organisations">
            <TextInput
              value={organizationSearch}
              onChange={(event) => setOrganizationSearch(event.target.value)}
              placeholder="Search name, code, email, type"
            />
          </Field>
        </div>
      </div>
      {!canCreateOrganization ? (
        <EmptyState text="Only Platform Admins can create organisations. Switch to Platform Admin or ask a Platform Admin to set up the company first." />
      ) : null}

      {showOrganizationForm ? (
        <form onSubmit={createOrganization} className="mb-4 grid gap-4 rounded-[24px] border-2 border-[#83A6CE] bg-[#E0E5E9] p-5 shadow-sm lg:grid-cols-4">
          <Field label="Organisation name">
            <TextInput
              required
              disabled={!canCreateOrganization}
              value={newOrganization.organization_name}
              onChange={(event) => setNewOrganization({ ...newOrganization, organization_name: event.target.value })}
            />
          </Field>
          <Field label="Organisation code">
            <TextInput
              required
              disabled={!canCreateOrganization}
              value={newOrganization.organization_code}
              onChange={(event) => setNewOrganization({ ...newOrganization, organization_code: event.target.value })}
            />
          </Field>
          <Field label="Email">
            <TextInput
              required
              type="email"
              disabled={!canCreateOrganization}
              value={newOrganization.organization_email}
              onChange={(event) => setNewOrganization({ ...newOrganization, organization_email: event.target.value })}
            />
          </Field>
          <Field label="Type">
            <TextInput
              disabled={!canCreateOrganization}
              value={newOrganization.organization_type}
              onChange={(event) => setNewOrganization({ ...newOrganization, organization_type: event.target.value })}
            />
          </Field>
          <PrimaryButton disabled={!canCreateOrganization} type="submit">Save Organisation</PrimaryButton>
        </form>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="py-3 pr-4">Organisation ID</th>
              <th className="py-3 pr-4">Name</th>
              <th className="py-3 pr-4">Code</th>
              <th className="py-3 pr-4">Email</th>
              <th className="py-3 pr-4">Type</th>
              <th className="py-3 pr-4">Created at</th>
              <th className="py-3 pr-4">Updated at</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrganizations.map((item) => (
              <tr key={item.organization_id} className="border-b border-slate-100">
                <td className="max-w-[220px] truncate py-3 pr-4 font-mono text-xs text-slate-700">{item.organization_id}</td>
                <td className="py-3 pr-4">
                  <TextInput
                    value={item.organization_name ?? ""}
                    onChange={(event) => updateOrganization(item.organization_id, { organization_name: event.target.value })}
                  />
                </td>
                <td className="py-3 pr-4">
                  <TextInput
                    value={item.organization_code ?? ""}
                    onChange={(event) => updateOrganization(item.organization_id, { organization_code: event.target.value })}
                  />
                </td>
                <td className="py-3 pr-4">
                  <TextInput
                    type="email"
                    value={item.organization_email ?? ""}
                    onChange={(event) => updateOrganization(item.organization_id, { organization_email: event.target.value })}
                  />
                </td>
                <td className="py-3 pr-4">
                  <TextInput
                    value={item.organization_type ?? ""}
                    onChange={(event) => updateOrganization(item.organization_id, { organization_type: event.target.value })}
                  />
                </td>
                <td className="py-3 pr-4 text-slate-700">{formatDateTime(item.created_at)}</td>
                <td className="py-3 pr-4 text-slate-700">{item.updated_at ? formatDateTime(item.updated_at) : "NULL"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filteredOrganizations.length ? <EmptyState text="No organisations match your search." /> : null}
      </div>
    </Section>
  );
}

function RoleAdminPanel({ roles, organizations, currentAccount, newRole, setNewRole, createRole, showRoleForm, setShowRoleForm }) {
  function startEditRole(role) {
    setNewRole({
      role_id: role.role_id,
      role_name: role.role_name,
      base_role_id: "",
      description: role.description ?? "",
    });
    setShowRoleForm(true);
  }

  function cancelRoleForm() {
    setNewRole(EMPTY_ROLE);
    setShowRoleForm(false);
  }

  const selectedBaseRole = roles.find((role) => Number(role.role_id) === Number(newRole.base_role_id));
  const currentOrganization = organizations.find((item) => item.organization_id === currentAccount?.organization_id) || organizations[0];

  return (
    <Section id="roles" title="Role Management">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm leading-6 text-[var(--optima-muted)]">
          Roles define what a type of user can do. Edit each role to maintain its permissions description.
          {currentOrganization ? ` Current organisation: ${currentOrganization.organization_name}.` : ""}
        </p>
      </div>

      {showRoleForm ? (
        <form onSubmit={createRole} className="mb-4 grid gap-4 rounded-[24px] border-2 border-[#83A6CE] bg-[#E0E5E9] p-5 shadow-sm lg:grid-cols-3">
          <Field label="Name">
            <TextInput
              required
              disabled={CORE_ROLE_NAMES.includes(newRole.role_name)}
              value={newRole.role_name}
              onChange={(event) => setNewRole({ ...newRole, role_name: event.target.value })}
              placeholder="e.g. Store Supervisor"
            />
          </Field>
          <Field label="Role type">
            <SelectInput
              value={newRole.base_role_id}
              onChange={(event) => {
                const baseRole = roles.find((role) => Number(role.role_id) === Number(event.target.value));
                setNewRole({
                  ...newRole,
                  base_role_id: event.target.value,
                  description: newRole.description || baseRole?.description || "",
                });
              }}
            >
              <option value="">Choose a base role</option>
              {roles.map((role) => (
                <option key={role.role_id} value={role.role_id}>
                  {role.role_name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <div className="flex items-end gap-2">
            <PrimaryButton type="submit">Save Changes</PrimaryButton>
            <SecondaryButton type="button" onClick={cancelRoleForm}>Cancel</SecondaryButton>
          </div>
          <label className="space-y-1.5 text-sm font-semibold text-[var(--optima-primary)] lg:col-span-3">
            <span>What this role can do / permissions</span>
            <textarea
              required
              value={newRole.description}
              onChange={(event) => setNewRole({ ...newRole, description: event.target.value })}
              placeholder={selectedBaseRole ? `Describe permissions based on ${selectedBaseRole.role_name}` : "Describe what this role can access and manage"}
              className="min-h-28 w-full rounded-md border border-[var(--optima-border)] bg-[var(--optima-surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--optima-button)] focus:ring-2 focus:ring-[var(--optima-accent)]/35"
            />
          </label>
        </form>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        {roles.map((role) => (
          <div key={role.role_id} className="rounded-[24px] border-2 border-[#83A6CE] bg-[#E0E5E9] p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-black text-[var(--optima-primary)]">{role.role_name}</p>
                <p className="mt-1 text-sm leading-6 text-[var(--optima-muted)]">
                  {role.description || "No permissions description added yet."}
                </p>
              </div>
              <SecondaryButton type="button" onClick={() => startEditRole(role)}>
                Edit
              </SecondaryButton>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function UserAdminPanel({
  users,
  roles,
  newUser,
  setNewUser,
  createUser,
  updateUser,
  defaultRoleId,
  organizations,
  isPlatformAdmin,
  defaultOrganizationId,
  showUserForm,
  setShowUserForm,
  userSearch,
  setUserSearch,
}) {
  const selectedOrganizationId = newUser.organization_id || defaultOrganizationId || "";
  function organizationName(organizationId) {
    return organizations.find((item) => item.organization_id === organizationId)?.organization_name || "Current organization";
  }

  const normalizedSearch = userSearch.trim().toLowerCase();
  const filteredUsers = normalizedSearch
    ? users.filter((user) =>
        [
          user.user_id,
          user.role_id,
          user.organization_id,
          organizationName(user.organization_id),
          user.username,
          user.email,
          user.account_status,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch)),
      )
    : users;

  return (
    <Section
      id="users"
      title="User Management"
      action={
        <PrimaryButton type="button" onClick={() => setShowUserForm((current) => !current)}>
          {showUserForm ? "Hide Form" : "Create User"}
        </PrimaryButton>
      }
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-2xl text-sm leading-6 text-[var(--optima-muted)]">
          Search, edit, suspend, or reactivate user accounts. User ID, created at, and updated at are generated by Supabase/database.
        </p>
        <div className="w-full sm:w-80">
          <Field label="Search users">
            <TextInput
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="Search username, email, status, ID"
            />
          </Field>
        </div>
      </div>

      {showUserForm ? (
        <form onSubmit={createUser} className="mb-4 grid gap-4 rounded-[24px] border-2 border-[#83A6CE] bg-[#E0E5E9] p-5 shadow-sm lg:grid-cols-4">
          <Field label="User ID">
            <TextInput disabled value="Generated after account creation" />
          </Field>
          <Field label="Role ID">
            <SelectInput value={newUser.role_id} onChange={(event) => setNewUser({ ...newUser, role_id: Number(event.target.value) })}>
              <option value="">{defaultRoleId ? "Employee" : "Select role"}</option>
              {roles.map((role) => (
                <option key={role.role_id} value={role.role_id}>
                  {role.role_id} - {role.role_name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Organisation">
            <SelectInput
              required
              disabled={!isPlatformAdmin}
              value={selectedOrganizationId}
              onChange={(event) => setNewUser({ ...newUser, organization_id: event.target.value })}
            >
              <option value="">Select organisation</option>
            {organizations.map((item) => (
              <option key={item.organization_id} value={item.organization_id}>
                {item.organization_name || "Organisation"}
              </option>
            ))}
          </SelectInput>
          </Field>
          <Field label="Username">
            <TextInput required value={newUser.username} onChange={(event) => setNewUser({ ...newUser, username: event.target.value })} />
          </Field>
          <Field label="Email">
            <TextInput required type="email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} />
          </Field>
          <Field label="Account status">
            <SelectInput value={newUser.account_status} onChange={(event) => setNewUser({ ...newUser, account_status: event.target.value })}>
              <option>Active</option>
              <option>Suspended</option>
            </SelectInput>
          </Field>
          <Field label="Created at">
            <TextInput disabled value="Generated automatically" />
          </Field>
          <Field label="Updated at">
            <TextInput disabled value="NULL until edited" />
          </Field>
          <Field label="Temporary password">
            <TextInput required minLength="6" type="password" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} />
          </Field>
          <PrimaryButton className="mt-auto" type="submit">Save User</PrimaryButton>
        </form>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="py-3 pr-4">User ID</th>
              <th className="py-3 pr-4">Role ID</th>
              <th className="py-3 pr-4">Organisation</th>
              <th className="py-3 pr-4">Username</th>
              <th className="py-3 pr-4">Email</th>
              <th className="py-3 pr-4">Account status</th>
              <th className="py-3 pr-4">Created at</th>
              <th className="py-3 pr-4">Updated at</th>
              <th className="py-3 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.user_id} className="border-b border-slate-100">
                <td className="max-w-[220px] truncate py-3 pr-4 font-mono text-xs text-slate-700">{user.user_id}</td>
                <td className="py-3 pr-4">
                  <SelectInput value={user.role_id ?? ""} onChange={(event) => updateUser(user.user_id, { role_id: Number(event.target.value) })}>
                    {roles.map((role) => (
                      <option key={role.role_id} value={role.role_id}>
                        {role.role_id} - {role.role_name}
                      </option>
                    ))}
                  </SelectInput>
                </td>
                <td className="py-3 pr-4 text-slate-700">{organizationName(user.organization_id)}</td>
                <td className="py-3 pr-4">
                  <TextInput value={user.username ?? ""} onChange={(event) => updateUser(user.user_id, { username: event.target.value })} />
                </td>
                <td className="py-3 pr-4">
                  <TextInput type="email" value={user.email ?? ""} onChange={(event) => updateUser(user.user_id, { email: event.target.value })} />
                </td>
                <td className="py-3 pr-4">
                  <SelectInput value={user.account_status} onChange={(event) => updateUser(user.user_id, { account_status: event.target.value })}>
                    <option>Active</option>
                    <option>Suspended</option>
                  </SelectInput>
                </td>
                <td className="py-3 pr-4 text-slate-700">{formatDateTime(user.created_at)}</td>
                <td className="py-3 pr-4 text-slate-700">{user.updated_at ? formatDateTime(user.updated_at) : "NULL"}</td>
                <td className="py-3 pr-4">
                  <SecondaryButton
                    type="button"
                    onClick={() =>
                      updateUser(user.user_id, {
                        account_status: user.account_status === "Suspended" ? "Active" : "Suspended",
                      })
                    }
                  >
                    {user.account_status === "Suspended" ? "Remove Suspension" : "Suspend"}
                  </SecondaryButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filteredUsers.length ? <EmptyState text="No users match your search." /> : null}
      </div>
    </Section>
  );
}

function ManagerPanel({ data, tasks, selectedTask, selectedTaskId, setSelectedTaskId, employeeUsers, evaluateEmployee, assignTask, createTask, newTask, setNewTask, taskSkillIds, taskQualificationIds, names, users }) {
  return (
    <div className="space-y-6">
      <Section title="Create Task">
        <form onSubmit={createTask} className="grid gap-3 lg:grid-cols-3">
          <Field label="Title">
            <TextInput required value={newTask.title} onChange={(event) => setNewTask({ ...newTask, title: event.target.value })} />
          </Field>
          <Field label="Required skill">
            <SelectInput value={newTask.skill_id} onChange={(event) => setNewTask({ ...newTask, skill_id: event.target.value })}>
              <option value="">None</option>
              {data.skills.map((skill) => (
                <option key={skill.skill_id} value={skill.skill_id}>{skill.skill_name}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Qualification">
            <SelectInput value={newTask.qualification_id} onChange={(event) => setNewTask({ ...newTask, qualification_id: event.target.value })}>
              <option value="">None</option>
              {data.qualifications.map((qualification) => (
                <option key={qualification.qualification_id} value={qualification.qualification_id}>{qualification.qualification_name}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Start">
            <TextInput required type="datetime-local" value={newTask.start_datetime} onChange={(event) => setNewTask({ ...newTask, start_datetime: event.target.value })} />
          </Field>
          <Field label="End">
            <TextInput required type="datetime-local" value={newTask.end_datetime} onChange={(event) => setNewTask({ ...newTask, end_datetime: event.target.value })} />
          </Field>
          <PrimaryButton className="mt-auto" type="submit">Create Task</PrimaryButton>
          <label className="space-y-1.5 text-sm font-semibold text-slate-700 lg:col-span-3">
            <span>Description</span>
            <textarea
              required
              value={newTask.description}
              onChange={(event) => setNewTask({ ...newTask, description: event.target.value })}
              className="min-h-24 w-full rounded-md border border-[var(--optima-border)] bg-[var(--optima-surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--optima-button)] focus:ring-2 focus:ring-[var(--optima-accent)]/35"
            />
          </label>
        </form>
      </Section>

      <Section
        title="Smart Allocation"
        action={
          <SelectInput value={selectedTaskId} onChange={(event) => setSelectedTaskId(Number(event.target.value))}>
            <option value="">Select task</option>
            {tasks.map((task) => (
              <option key={task.task_id} value={task.task_id}>{task.task_code} | {task.title}</option>
            ))}
          </SelectInput>
        }
      >
        {selectedTask ? (
          <>
            <div className="mb-4 rounded-[24px] border-2 border-[#83A6CE] bg-[#E0E5E9] p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold text-slate-950">{selectedTask.title}</h3>
                <Chip tone={selectedTask.status}>{selectedTask.status}</Chip>
              </div>
              <p className="mt-1 text-sm text-slate-600">{selectedTask.description}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                Required: {names(taskSkillIds(selectedTask.task_id), data.skills, "skill_id", "skill_name").join(", ") || "No skill requirement"}
                {taskQualificationIds(selectedTask.task_id).length
                  ? ` | ${names(taskQualificationIds(selectedTask.task_id), data.qualifications, "qualification_id", "qualification_name").join(", ")}`
                  : ""}
              </p>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {employeeUsers.map((employee) => {
                const result = evaluateEmployee(employee);
                return (
                  <div key={employee.user_id} className="rounded-[24px] border-2 border-[#83A6CE] bg-[#E0E5E9] p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-950">{employee.full_name || employee.username}</p>
                        <p className="text-sm text-slate-600">{employee.weekly_hours.toFixed(1)}/{employee.max_weekly_hours} weekly hours</p>
                      </div>
                      <Chip tone={result.eligible ? "Eligible" : "Blocked"}>{result.eligible ? "Eligible" : "Blocked"}</Chip>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      Skills: {names(employee.skills, data.skills, "skill_id", "skill_name").join(", ") || "None assigned"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {result.reasons.length ? result.reasons.join(" | ") : "Meets skills, qualification, account status, and hour checks."}
                    </p>
                    <PrimaryButton className="mt-3" disabled={!result.eligible} onClick={() => assignTask(employee.user_id)}>
                      Assign
                    </PrimaryButton>
                  </div>
                );
              })}
              {!employeeUsers.length ? <EmptyState text="No employees have been created yet." /> : null}
            </div>
          </>
        ) : (
          <EmptyState text="Create a task before running smart allocation." />
        )}
      </Section>

      <Section title="Employee Requests">
        <div className="space-y-3">
          {data.requests.map((request) => {
            const user = users.find((item) => item.user_id === request.user_id);
            const task = tasks.find((item) => item.task_id === request.task_id);
            return (
              <div key={request.request_id} className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border-2 border-[#83A6CE] bg-[#E0E5E9] p-5 shadow-sm">
                <div>
                  <p className="font-bold text-slate-950">{task?.title ?? "Task removed"}</p>
                  <p className="text-sm text-slate-600">{user?.full_name ?? user?.username ?? "Unknown user"} | {formatDateTime(request.requested_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Chip tone={request.status}>{request.status}</Chip>
                  <SecondaryButton disabled={request.status !== "Pending"} onClick={() => assignTask(request.user_id, request.task_id)}>
                    Approve
                  </SecondaryButton>
                </div>
              </div>
            );
          })}
          {!data.requests.length ? <EmptyState text="No employee task requests yet." /> : null}
        </div>
      </Section>
    </div>
  );
}

function EmployeePanel({ employee, data, assignments, requestTask }) {
  const assigned = assignments.filter((assignment) => assignment.user_id === employee?.user_id);
  const requestedTaskIds = data.requests.filter((request) => request.user_id === employee?.user_id).map((request) => request.task_id);
  const openTasks = data.tasks.filter((task) => task.status === "Open");

  if (!employee) return <Section title="Employee"><EmptyState text="Create at least one employee user to use this view." /></Section>;

  return (
    <div className="space-y-6">
      <Section title="My Work">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="font-bold text-slate-950">Assigned Tasks</h3>
            <div className="mt-3 space-y-3">
              {assigned.map((assignment) => (
                <div key={assignment.assignment_id} className="rounded-[24px] border-2 border-[#83A6CE] bg-[#E0E5E9] p-5 shadow-sm">
                  <p className="font-bold text-slate-950">{assignment.task?.title ?? "Task removed"}</p>
                  <p className="mt-1 text-sm text-slate-600">{assignment.task?.description}</p>
                  <Chip tone={assignment.status}>{assignment.status}</Chip>
                </div>
              ))}
              {!assigned.length ? <EmptyState text="No assigned tasks yet." /> : null}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-slate-950">Availability</h3>
            <div className="mt-3 space-y-2">
              {data.availability.filter((item) => item.user_id === employee.user_id).map((item) => (
                <div key={item.availability_id} className="flex justify-between rounded-[24px] border-2 border-[#83A6CE] bg-[#E0E5E9] p-5 text-sm shadow-sm">
                  <span className="font-bold text-slate-900">{item.day_of_week}</span>
                  <span className="text-slate-600">{item.start_time} - {item.end_time}</span>
                </div>
              ))}
              {!data.availability.some((item) => item.user_id === employee.user_id) ? <EmptyState text="No availability records yet." /> : null}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Request Available Tasks">
        <div className="grid gap-3 lg:grid-cols-2">
          {openTasks.map((task) => (
            <div key={task.task_id} className="rounded-[24px] border-2 border-[#83A6CE] bg-[#E0E5E9] p-5 shadow-sm">
              <p className="font-bold text-slate-950">{task.title}</p>
              <p className="mt-1 text-sm text-slate-600">{task.description}</p>
              <p className="mt-2 text-sm text-slate-600">{formatDateTime(task.start_datetime)}</p>
              <SecondaryButton className="mt-3" disabled={requestedTaskIds.includes(task.task_id)} onClick={() => requestTask(task.task_id, employee.user_id)}>
                {requestedTaskIds.includes(task.task_id) ? "Requested" : "Request Task"}
              </SecondaryButton>
            </div>
          ))}
          {!openTasks.length ? <EmptyState text="No open tasks are available for request." /> : null}
        </div>
      </Section>
    </div>
  );
}
