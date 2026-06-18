import { NextResponse } from "next/server";
import { isPlatformAdminRole, requireManager } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { clockStatusFromLatestLog, getLatestClockLogsForUsers } from "@/lib/allocation";

async function getManagerOrganizationId(supabase, user) {
  const { data } = await supabase
    .from("user_account")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (data?.organization_id) {
    return data.organization_id;
  }

  const byEmail = await supabase
    .from("user_account")
    .select("organization_id")
    .eq("email", user.email)
    .maybeSingle();

  return byEmail.data?.organization_id ?? null;
}

export async function GET(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, error: authError } = await requireManager(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const organizationId = await getManagerOrganizationId(supabase, user);

    // Accounts must belong to the requester's organization. If the requester
    // has no organization, they can see no one (never expose null-org accounts).
    if (!organizationId) {
      return NextResponse.json({ user_accounts: [], employees: [] });
    }

    const { data: rawData, error } = await supabase
      .from("user_account")
      .select(
        "user_id, username, email, account_status, role:role_id(role_name), department:department_id(department_name)"
      )
      .eq("organization_id", organizationId)
      .order("username", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Platform admins are not part of any organization's roster.
    const data = (rawData ?? []).filter(
      (employee) => !isPlatformAdminRole(employee.role?.role_name),
    );

    const employeeIds = data.map((employee) => employee.user_id);

    // Merge profile fields so the UI can show real names and roles.
    let fullNameByUserId = new Map();
    let jobTitleByUserId = new Map();
    if (employeeIds.length) {
      const { data: profiles } = await supabase
        .from("profile")
        .select("user_id, full_name, job_title")
        .in("user_id", employeeIds);
      fullNameByUserId = new Map(
        (profiles ?? []).map((profile) => [profile.user_id, profile.full_name]),
      );
      jobTitleByUserId = new Map(
        (profiles ?? []).map((profile) => [profile.user_id, profile.job_title]),
      );
    }
    let skillRows = [];
    let availabilityRows = [];
    let skillError = null;
    let availabilityError = null;
    let clockLogsByUserId = new Map();

    if (employeeIds.length) {
      const [skillResult, availabilityResult, clockLogs] = await Promise.all([
        supabase
          .from("user_skill")
          .select("user_id, proficiency_level, skill:skill_id(skill_name)")
          .in("user_id", employeeIds),
        supabase
          .from("availability")
          .select("user_id, status, availability_start, availability_end")
          .in("user_id", employeeIds)
          .order("availability_start", { ascending: false }),
        getLatestClockLogsForUsers(supabase, employeeIds),
      ]);

      skillRows = skillResult.data ?? [];
      availabilityRows = availabilityResult.data ?? [];
      skillError = skillResult.error;
      availabilityError = availabilityResult.error;
      clockLogsByUserId = clockLogs;
    }

    if (skillError) {
      return NextResponse.json({ error: skillError.message }, { status: 400 });
    }

    if (availabilityError) {
      return NextResponse.json({ error: availabilityError.message }, { status: 400 });
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);

    const workedHoursByUserId = new Map();
    if (employeeIds.length) {
      const { data: workLogs } = await supabase
        .from("work_log")
        .select("user_id, clock_in_at, clock_out_at")
        .in("user_id", employeeIds)
        .gte("clock_in_at", weekStart.toISOString());

      for (const log of workLogs ?? []) {
        const start = new Date(log.clock_in_at);
        if (Number.isNaN(start.getTime())) continue;
        const end = log.clock_out_at ? new Date(log.clock_out_at) : now;
        if (Number.isNaN(end.getTime())) continue;
        const minutes = Math.max(0, (end.getTime() - start.getTime()) / 60000);
        workedHoursByUserId.set(
          log.user_id,
          (workedHoursByUserId.get(log.user_id) ?? 0) + minutes,
        );
      }
    }

    const skillsByUserId = new Map();
    const skillDetailsByUserId = new Map();
    const availabilityByUserId = new Map();

    for (const row of skillRows ?? []) {
      const skillName = row.skill?.skill_name;

      if (!skillName) {
        continue;
      }

      const currentSkills = skillsByUserId.get(row.user_id) ?? [];
      currentSkills.push(skillName);
      skillsByUserId.set(row.user_id, currentSkills);

      const currentDetails = skillDetailsByUserId.get(row.user_id) ?? [];
      currentDetails.push({ name: skillName, level: row.proficiency_level ?? 1 });
      skillDetailsByUserId.set(row.user_id, currentDetails);
    }

    const availabilitiesByUserId = new Map();

    for (const row of availabilityRows ?? []) {
      if (!availabilityByUserId.has(row.user_id)) {
        availabilityByUserId.set(row.user_id, row);
      }
      const list = availabilitiesByUserId.get(row.user_id) ?? [];
      list.push(row);
      availabilitiesByUserId.set(row.user_id, list);
    }

    const userAccounts = (data ?? []).map((employee) => {
      const clock = clockStatusFromLatestLog(clockLogsByUserId.get(employee.user_id));

      return {
        ...employee,
        full_name: fullNameByUserId.get(employee.user_id) ?? null,
        job_title: jobTitleByUserId.get(employee.user_id) ?? null,
        availability: availabilityByUserId.get(employee.user_id) ?? null,
        availabilities: availabilitiesByUserId.get(employee.user_id) ?? [],
        clock,
        clockedIn: clock.clockedIn,
        worked_minutes_this_week: Math.round(workedHoursByUserId.get(employee.user_id) ?? 0),
        worked_hours_this_week: Math.round((workedHoursByUserId.get(employee.user_id) ?? 0) / 60),
        skills: skillsByUserId.get(employee.user_id) ?? [],
        skill_details: skillDetailsByUserId.get(employee.user_id) ?? [],
      };
    });

    return NextResponse.json({
      user_accounts: userAccounts,
      employees: userAccounts,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
