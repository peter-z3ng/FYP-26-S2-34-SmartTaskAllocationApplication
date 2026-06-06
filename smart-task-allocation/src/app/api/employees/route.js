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

    return NextResponse.json({ employees: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
