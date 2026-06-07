const ACTIVE_ASSIGNMENT_STATUSES = ["Assigned", "In Progress"];

export function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export async function getAccountForUser(supabase, user) {
  const byUserId = await supabase
    .from("user_account")
    .select("user_id, organization_id, username, email, account_status, subscription_tier, role:role_id(role_name)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (byUserId.data) {
    return byUserId.data;
  }

  if (!user.email) {
    return null;
  }

  const byEmail = await supabase
    .from("user_account")
    .select("user_id, organization_id, username, email, account_status, subscription_tier, role:role_id(role_name)")
    .eq("email", user.email)
    .maybeSingle();

  return byEmail.data ?? null;
}

export async function getOrganizationIdForUser(supabase, user) {
  const account = await getAccountForUser(supabase, user);
  return account?.organization_id ?? null;
}

export async function getTaskById(supabase, taskId) {
  const { data, error } = await supabase
    .from("task")
    .select("*")
    .eq("task_id", taskId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getEmployeeById(supabase, userId) {
  const { data, error } = await supabase
    .from("user_account")
    .select("user_id, organization_id, username, email, account_status, subscription_tier")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function dayName(dateValue) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" })
    .format(new Date(dateValue))
    .toLowerCase();
}

function minutesFromTime(value) {
  if (!value) {
    return null;
  }

  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function taskTimeWindow(task) {
  if (!task?.start_datetime || !task?.end_datetime) {
    return null;
  }

  const start = new Date(task.start_datetime);
  const end = new Date(task.end_datetime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return null;
  }

  return { start, end };
}

function windowsOverlap(leftStart, leftEnd, rightStart, rightEnd) {
  return leftStart < rightEnd && rightStart < leftEnd;
}

async function loadRequiredIds(supabase, tableName, idColumn, taskId) {
  const { data, error } = await supabase.from(tableName).select(idColumn).eq("task_id", taskId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => row[idColumn]).filter((value) => value != null);
}

async function loadUserIds(supabase, tableName, idColumn, userId) {
  const { data, error } = await supabase.from(tableName).select(idColumn).eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return new Set((data ?? []).map((row) => row[idColumn]).filter((value) => value != null));
}

async function checkAvailability(supabase, task, userId) {
  const window = taskTimeWindow(task);

  if (!window) {
    return { ok: true, reason: "Task has no fixed time window." };
  }

  const taskDay = dayName(window.start);
  const taskStart = window.start.getUTCHours() * 60 + window.start.getUTCMinutes();
  const taskEnd = window.end.getUTCHours() * 60 + window.end.getUTCMinutes();

  const { data, error } = await supabase
    .from("availability")
    .select("day_of_week, start_time, end_time, status")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];

  if (rows.length === 0) {
    // Missing availability is treated as permissive so early demo data does not block every assignment.
    return { ok: true, reason: "No availability rules recorded." };
  }

  const match = rows.some((row) => {
    const status = cleanString(row.status).toLowerCase();
    const dayMatches = cleanString(row.day_of_week).toLowerCase() === taskDay;
    const available = !status || ["available", "active"].includes(status);
    const start = minutesFromTime(row.start_time);
    const end = minutesFromTime(row.end_time);

    return dayMatches && available && start != null && end != null && start <= taskStart && end >= taskEnd;
  });

  return {
    ok: match,
    reason: match ? "Employee is available for the task window." : "Employee is unavailable for this task time.",
  };
}

async function checkScheduleConflict(supabase, task, userId) {
  const window = taskTimeWindow(task);

  if (!window) {
    return { ok: true, reason: "Task has no fixed time window." };
  }

  const { data, error } = await supabase
    .from("task_assignment")
    .select("assignment_id, status, task:task_id(task_id, title, start_datetime, end_datetime)")
    .eq("user_id", userId)
    .in("status", ACTIVE_ASSIGNMENT_STATUSES);

  if (error) {
    throw new Error(error.message);
  }

  const conflict = (data ?? []).find((assignment) => {
    const assignedTask = assignment.task;
    const assignedWindow = taskTimeWindow(assignedTask);

    return assignedWindow && windowsOverlap(window.start, window.end, assignedWindow.start, assignedWindow.end);
  });

  return {
    ok: !conflict,
    reason: conflict ? `Conflicts with ${conflict.task?.title ?? "another assigned task"}.` : "No schedule conflict.",
  };
}

async function checkSkillsAndQualifications(supabase, taskId, userId) {
  const [requiredSkills, userSkills, requiredQualifications, userQualifications] = await Promise.all([
    loadRequiredIds(supabase, "task_skill", "skill_id", taskId),
    loadUserIds(supabase, "user_skill", "skill_id", userId),
    loadRequiredIds(supabase, "task_qualification", "qualification_id", taskId),
    loadUserIds(supabase, "user_qualification", "qualification_id", userId),
  ]);

  const missingSkills = requiredSkills.filter((skillId) => !userSkills.has(skillId));
  const missingQualifications = requiredQualifications.filter(
    (qualificationId) => !userQualifications.has(qualificationId),
  );

  return {
    ok: missingSkills.length === 0 && missingQualifications.length === 0,
    reason:
      missingSkills.length === 0 && missingQualifications.length === 0
        ? "Employee meets task skill and qualification requirements."
        : "Employee is missing required skills or qualifications.",
    missingSkills,
    missingQualifications,
  };
}

export async function evaluateEmployeeForTask(supabase, task, employee) {
  if (!task) {
    return { eligible: false, score: 0, reasons: ["Task does not exist."] };
  }

  if (!employee) {
    return { eligible: false, score: 0, reasons: ["Employee does not exist."] };
  }

  if (task.organization_id && employee.organization_id && task.organization_id !== employee.organization_id) {
    return { eligible: false, score: 0, reasons: ["Employee belongs to a different organization."] };
  }

  if (employee.account_status && employee.account_status !== "Active") {
    return { eligible: false, score: 0, reasons: ["Employee account is not active."] };
  }

  const [availability, conflict, requirements] = await Promise.all([
    checkAvailability(supabase, task, employee.user_id),
    checkScheduleConflict(supabase, task, employee.user_id),
    checkSkillsAndQualifications(supabase, task.task_id, employee.user_id),
  ]);

  const checks = [availability, conflict, requirements];
  // Score stays intentionally explainable: one point each for availability, conflicts, and requirements.
  const eligible = checks.every((check) => check.ok);
  const score = checks.reduce((total, check) => total + (check.ok ? 1 : 0), 0);

  return {
    eligible,
    score,
    reasons: checks.map((check) => check.reason),
    missingSkills: requirements.missingSkills,
    missingQualifications: requirements.missingQualifications,
  };
}

export async function assignTaskToEmployee(supabase, task, employee) {
  // Re-run eligibility during mutation so manual assignment cannot bypass allocation rules.
  const evaluation = await evaluateEmployeeForTask(supabase, task, employee);

  if (!evaluation.eligible) {
    return { error: evaluation.reasons.join(" ") };
  }

  const { data: existing } = await supabase
    .from("task_assignment")
    .select("assignment_id")
    .eq("task_id", task.task_id)
    .eq("user_id", employee.user_id)
    .maybeSingle();

  if (existing) {
    return { error: "This task is already assigned to the selected employee." };
  }

  const { data, error } = await supabase
    .from("task_assignment")
    .insert({
      task_id: task.task_id,
      user_id: employee.user_id,
      assigned_at: new Date().toISOString(),
      status: "Assigned",
    })
    .select("assignment_id")
    .single();

  if (error) {
    return { error: error.message };
  }

  return { assignment: data, evaluation };
}
