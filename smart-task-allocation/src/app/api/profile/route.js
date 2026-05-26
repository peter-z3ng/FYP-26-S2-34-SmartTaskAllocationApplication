import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { cleanString, getAccountForUser } from "@/lib/allocation";

export async function GET(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, error: authError } = await getAuthenticatedUser(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const account = await getAccountForUser(supabase, user);

    if (!account) {
      return NextResponse.json({ error: "Account was not found." }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("profile")
      .select("*")
      .eq("user_id", account.user_id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ account, profile: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, error: authError } = await getAuthenticatedUser(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const account = await getAccountForUser(supabase, user);
    const { fullName, phoneNumber, address, bio } = await request.json();

    if (!account) {
      return NextResponse.json({ error: "Account was not found." }, { status: 404 });
    }

    if (!cleanString(fullName)) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }

    const payload = {
      profile_id: account.user_id,
      user_id: account.user_id,
      full_name: cleanString(fullName),
      phone_number: cleanString(phoneNumber) || null,
      address: cleanString(address) || null,
      bio: cleanString(bio) || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profile").upsert(payload, { onConflict: "user_id" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
