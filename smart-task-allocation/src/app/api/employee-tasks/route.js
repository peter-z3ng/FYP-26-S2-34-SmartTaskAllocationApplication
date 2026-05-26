import { NextResponse } from "next/server";
import { requireEmployee } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAccountForUser } from "@/lib/allocation";

const EMPLOYEE_TASK_STATUSES = ["Assigned", "In Progress", "Completed"];

export async function GET(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, error: authError } = await requireEmployee(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const account = await getAccountForUser(supabase, user);

    if (!account) {
      return NextResponse.json({ error: "Employee account was not found." }, { status: 404 });
    }

    const [assignedResult, requestsResult] = await Promise.all([
      supabase
        .from("task_assignment")
        .select("assignment_id, assigned_at, status, task:task_id(*)")
        .eq("user_id", account.user_id)
        .in("status", EMPLOYEE_TASK_STATUSES)
        .order("assigned_at", { ascending: false }),
      supabase
        .from("task_assignment_request")
        .select("request_id, task_id, status")
        .eq("user_id", account.user_id),
    ]);

    if (assignedResult.error) {
      return NextResponse.json({ error: assignedResult.error.message }, { status: 400 });
    }

    if (requestsResult.error) {
      return NextResponse.json({ error: requestsResult.error.message }, { status: 400 });
    }

    const assignedTaskIds = new Set(
      (assignedResult.data ?? []).map((assignment) => assignment.task?.task_id).filter(Boolean),
    );
    const requestedTaskIds = new Set((requestsResult.data ?? []).map((requestRow) => requestRow.task_id));

    let availableQuery = supabase
      .from("task")
      .select("*")
      .eq("status", "Open")
      .order("created_at", { ascending: false });

    if (account.organization_id) {
      availableQuery = availableQuery.eq("organization_id", account.organization_id);
    }

    const { data: tasks, error: tasksError } = await availableQuery;

    if (tasksError) {
      return NextResponse.json({ error: tasksError.message }, { status: 400 });
    }

    const availableTasks = (tasks ?? []).filter(
      (task) => !assignedTaskIds.has(task.task_id) && !requestedTaskIds.has(task.task_id),
    );

    return NextResponse.json({
      assignedTasks: assignedResult.data ?? [],
      availableTasks,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, error: authError } = await requireEmployee(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const account = await getAccountForUser(supabase, user);
    const { assignmentId, status } = await request.json();
    const cleanStatus = typeof status === "string" ? status.trim() : "";

    if (!assignmentId || !["Assigned", "In Progress", "Completed"].includes(cleanStatus)) {
      return NextResponse.json({ error: "A valid assignment and status are required." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("task_assignment")
      .update({ status: cleanStatus })
      .eq("assignment_id", assignmentId)
      .eq("user_id", account.user_id)
      .select("task_id")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: "Assignment was not found." }, { status: 404 });
    }

    await supabase
      .from("task")
      .update({ status: cleanStatus === "Completed" ? "Completed" : "In Progress", updated_at: new Date().toISOString() })
      .eq("task_id", data.task_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
