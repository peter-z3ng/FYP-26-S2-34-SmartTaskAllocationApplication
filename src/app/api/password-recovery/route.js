import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { requireUserAdmin } from "@/lib/serverAuth";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value) {
  return cleanString(value).toLowerCase();
}

function publicRequestPayload(request, account, admin) {
  const timestamp = new Date().toISOString();

  return {
    request_id: `reset-${Date.now()}`,
    email: request.email,
    note: request.note,
    status: "Pending",
    requested_by_user_id: account?.user_id ?? null,
    requested_by_name: account?.username ?? "Unknown account",
    assigned_admin_id: admin?.user_id ?? null,
    admin_message: account
      ? `${account.username} requested help resetting their password.`
      : `A password reset was requested for ${request.email}. Verify the account before resetting.`,
    admin_note: "",
    created_at: timestamp,
    updated_at: timestamp,
    resolved_at: null,
  };
}

export async function POST(request) {
  try {
    const { email, note = "" } = await request.json();
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return NextResponse.json({ error: "A valid account email is required." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data: account, error: accountError } = await supabase
      .from("user_account")
      .select("user_id, username, email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (accountError) {
      return NextResponse.json({ error: accountError.message }, { status: 400 });
    }

    const { data: admin, error: adminError } = await supabase
      .from("user_account")
      .select("user_id, username, email")
      .eq("role_id", 2)
      .maybeSingle();

    if (adminError) {
      return NextResponse.json({ error: adminError.message }, { status: 400 });
    }

    const payload = publicRequestPayload(
      {
        email: normalizedEmail,
        note: cleanString(note),
      },
      account,
      admin,
    );

    const { data, error } = await supabase
      .from("password_reset_request")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      request: data,
      message: "Password reset request sent to the User Admin queue.",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { error: authError } = await requireUserAdmin(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("password_reset_request")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ requests: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { error: authError } = await requireUserAdmin(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { requestId, status = "Reset Sent", adminNote = "" } = await request.json();
    const resetRequestId = cleanString(requestId);

    if (!resetRequestId) {
      return NextResponse.json({ error: "Request ID is required." }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const updates = {
      status: cleanString(status) || "Reset Sent",
      admin_note: cleanString(adminNote),
      updated_at: timestamp,
    };

    if (updates.status === "Resolved" || updates.status === "Reset Sent") {
      updates.resolved_at = timestamp;
    }

    const { data, error } = await supabase
      .from("password_reset_request")
      .update(updates)
      .eq("request_id", resetRequestId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ request: data, success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
