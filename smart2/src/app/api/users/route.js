import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function GET(request) {
  try {
    const accessToken = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json({ users: [] }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    const { data: requesterData, error: requesterError } = await supabase.auth.getUser(accessToken);

    if (requesterError || !requesterData.user) {
      return NextResponse.json({ users: [] }, { status: 401 });
    }

    const { data: requesterAccount, error: requesterAccountError } = await supabase
      .from("user_account")
      .select("organization_id, role:role_id(role_name)")
      .eq("user_id", requesterData.user.id)
      .single();

    if (requesterAccountError) {
      return NextResponse.json({ error: requesterAccountError.message }, { status: 403 });
    }

    const query = supabase.from("user_account").select("*").order("created_at", { ascending: false });
    const { data: users, error: usersError } =
      requesterAccount?.role?.role_name === "Platform Admin"
        ? await query
        : await query.eq("organization_id", requesterAccount.organization_id);

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 400 });
    }

    return NextResponse.json({ users: users ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      username,
      full_name,
      role_id,
      organization_id,
      account_status = "Active",
      max_weekly_hours = 40,
    } = body;

    if (!email || !password || !username || !role_id || !organization_id) {
      return NextResponse.json(
        { error: "Email, password, username, role, and organization are required." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();
    const accessToken = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json({ error: "You must be logged in to create users." }, { status: 401 });
    }

    const { data: requesterData, error: requesterError } = await supabase.auth.getUser(accessToken);
    if (requesterError || !requesterData.user) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const { data: requesterAccount, error: accountLookupError } = await supabase
      .from("user_account")
      .select("organization_id, role:role_id(role_name)")
      .eq("user_id", requesterData.user.id)
      .single();

    if (accountLookupError) {
      return NextResponse.json({ error: accountLookupError.message }, { status: 403 });
    }

    const requesterRole = requesterAccount?.role?.role_name;
    if (!["Platform Admin", "User Admin", "Manager"].includes(requesterRole)) {
      return NextResponse.json({ error: "Only Platform Admins, User Admins, and Managers can create users." }, { status: 403 });
    }

    if (requesterRole !== "Platform Admin" && requesterAccount.organization_id !== organization_id) {
      return NextResponse.json({ error: "You can only create users inside your own organization." }, { status: 403 });
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        full_name,
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;
    const { error: accountError } = await supabase.from("user_account").insert({
      user_id: userId,
      role_id,
      organization_id,
      username,
      email,
      account_status,
    });

    if (accountError) {
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: accountError.message }, { status: 400 });
    }

    await supabase.from("activity_log").insert({
      user_id: userId,
      action: "User created",
      details: `${username} was created by an administrator.`,
    });

    return NextResponse.json({ user_id: userId });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
