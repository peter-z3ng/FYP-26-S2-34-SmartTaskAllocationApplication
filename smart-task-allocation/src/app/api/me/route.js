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
