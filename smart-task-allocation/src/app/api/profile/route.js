import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { cleanString, getAccountForUser } from "@/lib/allocation";

const MAX_PROFILE_PICTURE_URL_LENGTH = 700_000;
const PROFILE_PICTURE_DATA_URL_PATTERN = /^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i;
const AVATAR_REVIEW_ACTION = "Avatar Review Submitted";

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

function parseDetails(row) {
  if (!row?.details) return {};

  try {
    return typeof row.details === "string" ? JSON.parse(row.details) : row.details;
  } catch {
    return {};
  }
}

async function loadLatestAvatarReview(supabase, userId) {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("action", AVATAR_REVIEW_ACTION)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    throw new Error(error.message);
  }

  const review = (data ?? [])
    .map((row) => ({ ...row, details: parseDetails(row) }))
    .find((row) => row.details.userId === userId);

  return review
    ? {
        logId: review.log_id,
        status: review.details.status || "Pending",
        avatarDataUrl: review.details.avatarDataUrl || "",
        submittedAt: review.created_at,
        moderatedAt: review.details.moderatedAt || null,
        moderationNote: review.details.moderationNote || "",
      }
    : null;
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

    const avatarReview = await loadLatestAvatarReview(supabase, account.user_id);

    return NextResponse.json({ account, profile: data, avatarReview });
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
    if (normalizedProfilePicture.value === null) {
      payload.profile_picture_url = normalizedProfilePicture.value;
    }

    const { error } = await supabase.from("profile").upsert(payload, { onConflict: "user_id" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (normalizedProfilePicture.value && normalizedProfilePicture.value !== account.profile?.profile_picture_url) {
      const { error: reviewError } = await supabase.from("activity_log").insert({
        user_id: account.user_id,
        action: AVATAR_REVIEW_ACTION,
        details: JSON.stringify({
          userId: account.user_id,
          name: cleanString(fullName) || account.username,
          email: account.email,
          avatarDataUrl: normalizedProfilePicture.value,
          status: "Pending",
          submittedAt: new Date().toISOString(),
        }),
        created_at: new Date().toISOString(),
      });

      if (reviewError) {
        return NextResponse.json({ error: reviewError.message }, { status: 400 });
      }
    }

    const avatarReview = await loadLatestAvatarReview(supabase, account.user_id);

    return NextResponse.json({ success: true, avatarReview });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
