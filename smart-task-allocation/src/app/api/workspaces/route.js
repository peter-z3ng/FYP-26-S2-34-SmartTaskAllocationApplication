import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireManager } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function getAccountUserId(supabase, user) {
  const { data } = await supabase
    .from("user_account")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (data?.user_id) {
    return data.user_id;
  }

  const byEmail = await supabase
    .from("user_account")
    .select("user_id")
    .eq("email", user.email)
    .maybeSingle();

  return byEmail.data?.user_id ?? user.id;
}

export async function GET(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, error: authError } = await requireManager(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const accountUserId = await getAccountUserId(supabase, user);
    const { data, error } = await supabase
      .from("workspace")
      .select("workspace_id, workspace_name, description, status, visibility, created_at")
      .eq("created_by", accountUserId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ workspaces: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, error: authError } = await requireManager(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { workspaceName, description } = await request.json();
    const cleanedName = cleanString(workspaceName);

    if (!cleanedName) {
      return NextResponse.json({ error: "Workspace name is required." }, { status: 400 });
    }

    const accountUserId = await getAccountUserId(supabase, user);
    const workspaceId = randomUUID();
    const now = new Date().toISOString();
    const { error: workspaceError } = await supabase.from("workspace").insert({
      workspace_id: workspaceId,
      workspace_name: cleanedName,
      description: cleanString(description) || null,
      created_by: accountUserId,
      status: "Active",
      visibility: "Private",
      created_at: now,
      updated_at: now,
    });

    if (workspaceError) {
      return NextResponse.json({ error: workspaceError.message }, { status: 400 });
    }

    const { error: memberError } = await supabase.from("workspace_member").insert({
      workspace_id: workspaceId,
      user_id: accountUserId,
      joined_at: now,
    });

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 400 });
    }

    return NextResponse.json({
      workspace: {
        workspace_id: workspaceId,
        workspace_name: cleanedName,
        description: cleanString(description) || null,
        status: "Active",
        visibility: "Private",
        created_at: now,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
