import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { cleanString, getAccountForUser } from "@/lib/allocation";

const MAX_PROFILE_PICTURE_URL_LENGTH = 700_000;
const PROFILE_PICTURE_DATA_URL_PATTERN = /^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i;

// Avatars are saved as compressed data URLs; this keeps uploads portable while still bounding row size.
function normalizeProfilePictureUrl(value) {
  if (value === undefined) {
    return { value: undefined };
  }

  const profilePictureUrl = cleanString(value);

  if (!profilePictureUrl) {
    return { value: null };
  }

  if (profilePictureUrl.length > MAX_PROFILE_PICTURE_URL_LENGTH) {
    return { error: "Profile avatar is too large. Please upload a smaller image." };
  }

  if (!PROFILE_PICTURE_DATA_URL_PATTERN.test(profilePictureUrl)) {
    return { error: "Profile avatar must be a JPG, PNG, or WebP image." };
  }

  return { value: profilePictureUrl };
}

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
    const { fullName, phoneNumber, address, bio, profilePictureUrl } = await request.json();

    if (!account) {
      return NextResponse.json({ error: "Account was not found." }, { status: 404 });
    }

    if (!cleanString(fullName)) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }

    const normalizedProfilePicture = normalizeProfilePictureUrl(profilePictureUrl);

    if (normalizedProfilePicture.error) {
      return NextResponse.json({ error: normalizedProfilePicture.error }, { status: 400 });
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

    // Undefined preserves older clients that do not submit avatar data; null means the user removed it.
    if (normalizedProfilePicture.value !== undefined) {
      payload.profile_picture_url = normalizedProfilePicture.value;
    }

    const { error } = await supabase.from("profile").upsert(payload, { onConflict: "user_id" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
