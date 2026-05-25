import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function POST(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, error: authError } = await getAuthenticatedUser(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { userId, email } = await request.json();

    if (userId !== user.id && email !== user.email) {
      return NextResponse.json(
        { error: "You can only activate your own account." },
        { status: 403 },
      );
    }

    let query = supabase.from("user_account").update({ account_status: "Active" });

    query = userId ? query.eq("user_id", userId) : query.eq("email", email);

    const { error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
