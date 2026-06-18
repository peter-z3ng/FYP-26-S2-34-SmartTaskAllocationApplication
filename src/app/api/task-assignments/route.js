import { NextResponse } from "next/server";
import { requireManager } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  assignTaskToEmployee,
  getEmployeeById,
  getOrganizationIdForUser,
  getTaskById,
} from "@/lib/allocation";

export async function POST(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, error: authError } = await requireManager(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { taskId, userId } = await request.json();

    if (!taskId || !userId) {
      return NextResponse.json({ error: "Task and employee are required." }, { status: 400 });
    }

    const [task, employee, organizationId] = await Promise.all([
      getTaskById(supabase, taskId),
      getEmployeeById(supabase, userId),
      getOrganizationIdForUser(supabase, user),
    ]);

    if (!task || !employee || (organizationId && task.organization_id !== organizationId)) {
      return NextResponse.json({ error: "Task or employee was not found for this organization." }, { status: 404 });
    }

    const result = await assignTaskToEmployee(supabase, task, employee);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, assignment: result.assignment, evaluation: result.evaluation });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
