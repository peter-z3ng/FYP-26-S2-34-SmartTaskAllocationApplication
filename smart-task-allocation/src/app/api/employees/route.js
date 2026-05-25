import { NextResponse } from "next/server";
import { requireManager } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function GET(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { error: authError } = await requireManager(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { data: employeeRole } = await supabase
      .from("role")
      .select("role_id")
      .ilike("role_name", "employee")
      .maybeSingle();

    let query = supabase
      .from("user_account")
      .select("user_id, username, email, account_status, role:role_id(role_name)");

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
