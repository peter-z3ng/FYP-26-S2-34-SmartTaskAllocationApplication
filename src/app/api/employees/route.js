import { NextResponse } from "next/server";
import { requireManager } from "@/lib/serverAuth";
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
    let query = supabase
      .from("user_account")
      .select(
        "user_id, username, email, account_status, role:role_id(role_name), department:department_id(department_name)"
      );

    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    query = query.eq("role_id", 4);

    const { data, error } = await query.order("username", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const employeeIds = (data ?? []).map((employee) => employee.user_id);
    const [
      { data: skillRows, error: skillError },
      { data: availabilityRows, error: availabilityError },
      { data: profileRows, error: profileError },
    ] =
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
            supabase
              .from("profile")
              .select("user_id, full_name, profile_picture_url, position")
              .in("user_id", employeeIds),
          ])
        : [
            { data: [], error: null },
            { data: [], error: null },
            { data: [], error: null },
          ];

    if (skillError) {
      return NextResponse.json({ error: skillError.message }, { status: 400 });
    }

    if (availabilityError) {
      return NextResponse.json({ error: availabilityError.message }, { status: 400 });
    }

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    const skillsByUserId = new Map();
    const availabilityByUserId = new Map();
    const profilesByUserId = new Map((profileRows ?? []).map((profile) => [profile.user_id, profile]));

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
      profile: profilesByUserId.get(employee.user_id) ?? null,
      full_name: profilesByUserId.get(employee.user_id)?.full_name ?? employee.username,
      profile_picture_url: profilesByUserId.get(employee.user_id)?.profile_picture_url ?? "",
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
