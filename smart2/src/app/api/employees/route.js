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
    const { data: employeeRole } = await supabase
      .from("role")
      .select("role_id")
      .ilike("role_name", "employee")
      .maybeSingle();

    let query = supabase
      .from("user_account")
      .select("user_id, username, email, account_status, role:role_id(role_name)");

    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    if (employeeRole?.role_id) {
      query = query.eq("role_id", employeeRole.role_id);
    }

    const { data, error } = await query.order("username", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const employeeIds = (data ?? []).map((employee) => employee.user_id);
    const { data: skillRows, error: skillError } = employeeIds.length
      ? await supabase
          .from("user_skill")
          .select("user_id, skill:skill_id(skill_name)")
          .in("user_id", employeeIds)
      : { data: [], error: null };

    if (skillError) {
      return NextResponse.json({ error: skillError.message }, { status: 400 });
    }

    const skillsByUserId = new Map();

    for (const row of skillRows ?? []) {
      const currentSkills = skillsByUserId.get(row.user_id) ?? [];
      const skillName = row.skill?.skill_name;

      if (skillName) {
        currentSkills.push(skillName);
      }

      skillsByUserId.set(row.user_id, currentSkills);
    }

    return NextResponse.json({
      employees: (data ?? []).map((employee) => ({
        ...employee,
        skills: skillsByUserId.get(employee.user_id) ?? [],
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
