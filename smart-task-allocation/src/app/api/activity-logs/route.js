import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function GET(request) {
  try {
    const accessToken = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json({ error: "Authentication token is required." }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const { data: requesterAccount, error: requesterError } = await supabase
      .from("user_account")
      .select("role:role_id(role_name)")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (requesterError) {
      return NextResponse.json({ error: requesterError.message }, { status: 400 });
    }

    if (requesterAccount?.role?.role_name !== "Platform Admin") {
      return NextResponse.json(
        { error: "Only Platform Admin accounts can view activity logs." },
        { status: 403 },
      );
    }

    const { data: assignments, error: assignmentsError } = await supabase
      .from("task_assignment")
      .select("*")
      .order("assigned_at", { ascending: false })
      .limit(100);

    if (assignmentsError) {
      return NextResponse.json({ error: assignmentsError.message }, { status: 400 });
    }

    const taskIds = [...new Set((assignments ?? []).map((item) => item.task_id).filter(Boolean))];
    const userIds = [...new Set((assignments ?? []).map((item) => item.user_id).filter(Boolean))];

    const { data: tasks } = taskIds.length
      ? await supabase.from("task").select("task_id, title, status").in("task_id", taskIds)
      : { data: [] };
    const { data: users } = userIds.length
      ? await supabase
          .from("user_account")
          .select("user_id, username, email")
          .in("user_id", userIds)
      : { data: [] };

    const tasksById = new Map((tasks ?? []).map((task) => [task.task_id, task]));
    const usersById = new Map((users ?? []).map((user) => [user.user_id, user]));

    return NextResponse.json({
      logs: (assignments ?? []).map((assignment) => ({
        log_id: assignment.assignment_id,
        user_id: assignment.user_id,
        action: "Task assigned",
        details: `${tasksById.get(assignment.task_id)?.title ?? `Task ${assignment.task_id}`} was assigned with status ${assignment.status ?? "Assigned"}.`,
        created_at: assignment.assigned_at,
        user: usersById.get(assignment.user_id) ?? null,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
