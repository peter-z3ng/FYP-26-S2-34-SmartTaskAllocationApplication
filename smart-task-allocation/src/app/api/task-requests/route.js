import { NextResponse } from "next/server";
import { requireManagerOrEmployee } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  assignTaskToEmployee,
  getAccountForUser,
  getEmployeeById,
  getOrganizationIdForUser,
  getTaskById,
} from "@/lib/allocation";

function isManagerRoute(homeRoute) {
  return homeRoute === "/manager";
}

export async function GET(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, homeRoute, error: authError } = await requireManagerOrEmployee(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    if (isManagerRoute(homeRoute)) {
      const organizationId = await getOrganizationIdForUser(supabase, user);
      let query = supabase
        .from("task_assignment_request")
        .select(
          "request_id, requested_at, status, user:user_id(user_id, username, email), task:task_id!inner(task_id, title, organization_id, start_datetime, end_datetime)",
        )
        .order("requested_at", { ascending: false });

      if (organizationId) {
        query = query.eq("task.organization_id", organizationId);
      }

      const { data, error } = await query;

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ requests: data ?? [] });
    }

    const account = await getAccountForUser(supabase, user);

    if (!account) {
      return NextResponse.json({ error: "Employee account was not found." }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("task_assignment_request")
      .select("request_id, requested_at, status, task:task_id(*)")
      .eq("user_id", account.user_id)
      .order("requested_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ requests: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, homeRoute, error: authError } = await requireManagerOrEmployee(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    if (isManagerRoute(homeRoute)) {
      return NextResponse.json({ error: "Managers cannot create employee assignment requests." }, { status: 403 });
    }

    const account = await getAccountForUser(supabase, user);
    const { taskId } = await request.json();

    if (!account) {
      return NextResponse.json({ error: "Employee account was not found." }, { status: 404 });
    }

    if (!taskId) {
      return NextResponse.json({ error: "Task is required." }, { status: 400 });
    }

    const task = await getTaskById(supabase, taskId);

    if (!task || (account.organization_id && task.organization_id !== account.organization_id)) {
      return NextResponse.json({ error: "Selected task is no longer available." }, { status: 404 });
    }

    if (task.status !== "Open") {
      return NextResponse.json({ error: "Only open tasks can be requested." }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("task_assignment_request")
      .select("request_id")
      .eq("task_id", taskId)
      .eq("user_id", account.user_id)
      .neq("status", "Cancelled")
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "You already have an active request for this task." }, { status: 400 });
    }

    const { error } = await supabase.from("task_assignment_request").insert({
      task_id: taskId,
      user_id: account.user_id,
      requested_at: new Date().toISOString(),
      status: "Pending",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, homeRoute, error: authError } = await requireManagerOrEmployee(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { requestId, status } = await request.json();
    const nextStatus = typeof status === "string" ? status.trim() : "";

    if (!requestId || !["Approved", "Rejected", "Cancelled"].includes(nextStatus)) {
      return NextResponse.json({ error: "A valid request and status are required." }, { status: 400 });
    }

    const { data: requestRow, error: requestError } = await supabase
      .from("task_assignment_request")
      .select("request_id, task_id, user_id, status, task:task_id(*)")
      .eq("request_id", requestId)
      .maybeSingle();

    if (requestError) {
      return NextResponse.json({ error: requestError.message }, { status: 400 });
    }

    if (!requestRow) {
      return NextResponse.json({ error: "Task request was not found." }, { status: 404 });
    }

    if (nextStatus === "Cancelled") {
      if (isManagerRoute(homeRoute)) {
        return NextResponse.json({ error: "Managers should approve or reject requests." }, { status: 403 });
      }

      const account = await getAccountForUser(supabase, user);

      if (!account || requestRow.user_id !== account.user_id) {
        return NextResponse.json({ error: "This request does not belong to the current employee." }, { status: 403 });
      }

      if (requestRow.status === "Approved") {
        return NextResponse.json({ error: "Approved requests cannot be cancelled." }, { status: 400 });
      }
    } else if (!isManagerRoute(homeRoute)) {
      return NextResponse.json({ error: "Only managers can approve or reject requests." }, { status: 403 });
    } else {
      const organizationId = await getOrganizationIdForUser(supabase, user);

      if (organizationId && requestRow.task?.organization_id !== organizationId) {
        return NextResponse.json({ error: "This request is outside your organization." }, { status: 403 });
      }
    }

    if (nextStatus === "Approved") {
      const employee = await getEmployeeById(supabase, requestRow.user_id);
      const result = await assignTaskToEmployee(supabase, requestRow.task, employee);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    }

    const { error } = await supabase
      .from("task_assignment_request")
      .update({ status: nextStatus })
      .eq("request_id", requestId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
