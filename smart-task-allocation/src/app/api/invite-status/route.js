import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

// Public, unauthenticated lookup used by the "Join an Organization" signup
// flow. Given an email, reports whether an invitation/account exists for it so
// the UI can guide the user to open their invite link (or tell them to ask
// their admin). Returns only a coarse status, never any account details.
export async function POST(request) {
  try {
    const { email } = await request.json();
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!cleanEmail) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("user_account")
      .select("account_status")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // No row → never invited. Otherwise surface the lifecycle status so the UI
    // can distinguish a pending invite from an already-active account.
    return NextResponse.json({
      found: Boolean(data),
      status: data?.account_status ?? null,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
