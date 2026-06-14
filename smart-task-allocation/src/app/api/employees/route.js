import { NextResponse } from "next/server";
import { isPlatformAdminRole, requireManager } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

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

    // Merge full_name from the profile table so the UI can show real names.
    let fullNameByUserId = new Map();
    if (employeeIds.length) {
      const { data: profiles } = await supabase
        .from("profile")
        .select("user_id, full_name")
        .in("user_id", employeeIds);
      fullNameByUserId = new Map(
        (profiles ?? []).map((profile) => [profile.user_id, profile.full_name]),
      );
    }
    const [{ data: skillRows, error: skillError }, { data: availabilityRows, error: availabilityError }] =
      employeeIds.length
        ? await Promise.all([
            supabase
              .from("user_skill")
              .select("user_id, skill:skill_id(skill_name)")
              .in("user_id", employeeIds),
            supabase
              .from("availability")
              .select("user_id, status, availability_start, availability_end")
              .in("user_id", employeeIds)
              .order("availability_start", { ascending: false }),
          ])
        : [
            { data: [], error: null },
            { data: [], error: null },
          ];

    if (skillError) {
      return NextResponse.json({ error: skillError.message }, { status: 400 });
    }

    if (availabilityError) {
      return NextResponse.json({ error: availabilityError.message }, { status: 400 });
    }

    const skillsByUserId = new Map();
    const availabilityByUserId = new Map();

    for (const row of skillRows ?? []) {
      const currentSkills = skillsByUserId.get(row.user_id) ?? [];
      const skillName = row.skill?.skill_name;

      if (skillName) {
        currentSkills.push(skillName);
      }

      skillsByUserId.set(row.user_id, currentSkills);
    }

    for (const row of availabilityRows ?? []) {
      if (!availabilityByUserId.has(row.user_id)) {
        availabilityByUserId.set(row.user_id, row);
      }
    }

    const userAccounts = (data ?? []).map((employee) => ({
      ...employee,
      full_name: fullNameByUserId.get(employee.user_id) ?? null,
      availability: availabilityByUserId.get(employee.user_id) ?? null,
      skills: skillsByUserId.get(employee.user_id) ?? [],
    }));

    return NextResponse.json({
      user_accounts: userAccounts,
      employees: userAccounts,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
