import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAuthenticatedUser } from "@/lib/serverAuth";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function loadAccount(supabase, userId) {
  const { data, error } = await supabase
    .from("user_account")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  return { account: data };
}

async function loadProfile(supabase, userId) {
  const { data, error } = await supabase
    .from("profile")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  return { profile: data };
}

async function loadLatestAvatarReview(supabase, userId) {
  const { data, error } = await supabase
    .from("avatar_review_request")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    return { error: error.message };
  }

  return { avatarReview: data?.[0] ?? null };
}

export async function GET(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, error: authError } = await getAuthenticatedUser(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const [{ account, error: accountError }, { profile, error: profileError }, { avatarReview, error: reviewError }] =
      await Promise.all([
        loadAccount(supabase, user.id),
        loadProfile(supabase, user.id),
        loadLatestAvatarReview(supabase, user.id),
      ]);

    if (accountError || profileError || reviewError) {
      return NextResponse.json({ error: accountError || profileError || reviewError }, { status: 400 });
    }

    return NextResponse.json({ account, profile, avatarReview });
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

    const { fullName, position, phoneNumber, bio } = await request.json();
    const updates = {
      full_name: cleanString(fullName),
      position: cleanString(position),
      phone_number: cleanString(phoneNumber),
      bio: cleanString(bio),
    };

    const { data: existingProfile, error: profileError } = await supabase
      .from("profile")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    let result;

    if (existingProfile) {
      result = await supabase
        .from("profile")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("profile")
        .insert({
          user_id: user.id,
          profile_picture_url: "",
          ...updates,
        })
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json({ profile: result.data, success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
