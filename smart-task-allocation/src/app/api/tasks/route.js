import { NextResponse } from "next/server";
import { getAuthenticatedUser, requireManager } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

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
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    let query = supabase.from("task").select("*").order("created_at", { ascending: false });

    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    if (workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ tasks: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, error: authError } = await getAuthenticatedUser(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const managerCheck = await requireManager(request, supabase);

    if (managerCheck.error) {
      return NextResponse.json({ error: managerCheck.error }, { status: 403 });
    }

    const organizationId = await getManagerOrganizationId(supabase, user);
    const {
      workspaceId,
      title,
      description,
      assignedTo,
      status,
      priority,
      startDatetime,
      endDatetime,
    } = await request.json();

    if (!cleanString(title)) {
      return NextResponse.json({ error: "Task title is required." }, { status: 400 });
    }

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required." }, { status: 400 });
    }

    const { error } = await supabase.from("task").insert({
      organization_id: organizationId,
      workspace_id: workspaceId,
      title: cleanString(title),
      description: cleanString(description) || null,
      owner_id: user.id,
      assigned_to: assignedTo || null,
      status: cleanString(status) || "Open",
      priority: cleanString(priority) || "Medium",
      start_datetime: startDatetime || null,
      end_datetime: endDatetime || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
    const { error: authError } = await requireManager(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { taskId, title, description, assignedTo, status, priority, startDatetime, endDatetime } =
      await request.json();
    const { error } = await supabase
      .from("task")
      .update({
        title: cleanString(title),
        description: cleanString(description) || null,
        assigned_to: assignedTo || null,
        status: cleanString(status) || "Open",
        priority: cleanString(priority) || "Medium",
        start_datetime: startDatetime || null,
        end_datetime: endDatetime || null,
        updated_at: new Date().toISOString(),
      })
      .eq("task_id", taskId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { error: authError } = await requireManager(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    const { error } = await supabase.from("task").delete().eq("task_id", taskId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
