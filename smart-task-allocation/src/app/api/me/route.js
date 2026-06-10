import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function GET(request) {
  try {
    const accessToken = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json({ account: null }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !userData.user) {
      return NextResponse.json({ account: null }, { status: 401 });
    }

    const { data: account, error: accountError } = await supabase
      .from("user_account")
      .select("*")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (accountError) {
      return NextResponse.json({ error: accountError.message }, { status: 400 });
    }

    return NextResponse.json({
      account: account
        ? {
            ...account,
            auth_email: userData.user.email,
          }
        : {
            user_id: userData.user.id,
            email: userData.user.email,
            username: userData.user.email,
            role_id: null,
          },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const accessToken = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const body = await request.json();
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!username) {
      return NextResponse.json({ error: "Username is required." }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const { data: account, error: accountLookupError } = await supabase
      .from("user_account")
      .select("user_id, role:role_id(role_name)")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (accountLookupError) {
      return NextResponse.json({ error: accountLookupError.message }, { status: 400 });
    }

    if (account?.role?.role_name !== "Platform Admin") {
      return NextResponse.json(
        { error: "Only Platform Admin accounts can update this profile." },
        { status: 403 },
      );
    }

    const { error: accountError } = await supabase
      .from("user_account")
      .update({
        username,
        email,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", account.user_id);

    if (accountError) {
      return NextResponse.json({ error: accountError.message }, { status: 400 });
    }

    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
      userData.user.id,
      {
        email,
        user_metadata: {
          username,
        },
      },
    );

    if (authUpdateError) {
      return NextResponse.json({ error: authUpdateError.message }, { status: 400 });
    }

    const { data: updatedAccount, error: updatedAccountError } = await supabase
      .from("user_account")
      .select("*")
      .eq("user_id", account.user_id)
      .maybeSingle();

    if (updatedAccountError) {
      return NextResponse.json({ error: updatedAccountError.message }, { status: 400 });
    }

    return NextResponse.json({
      account: {
        ...updatedAccount,
        auth_email: email,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
