import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAuthenticatedUser, getUserHomeRoute, requirePlatformAdmin } from "@/lib/serverAuth";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isDataImage(value) {
  return /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(String(value));
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

export async function GET(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, error: authError } = await getAuthenticatedUser(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { homeRoute, error: routeError } = await getUserHomeRoute(user, supabase);

    if (routeError) {
      return NextResponse.json({ error: routeError }, { status: 400 });
    }

    let query = supabase.from("avatar_review_request").select("*").order("created_at", { ascending: false });

    if (homeRoute !== "/platformadmin") {
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ reviews: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, error: authError } = await getAuthenticatedUser(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { avatarUrl } = await request.json();
    const cleanAvatarUrl = cleanString(avatarUrl);

    if (!isDataImage(cleanAvatarUrl)) {
      return NextResponse.json({ error: "Upload a PNG, JPG, or WEBP avatar image." }, { status: 400 });
    }

    const { account, error: accountError } = await loadAccount(supabase, user.id);

    if (accountError || !account) {
      return NextResponse.json({ error: accountError || "Account record could not be loaded." }, { status: 400 });
    }

    const { homeRoute, error: routeError } = await getUserHomeRoute(user, supabase);

    if (routeError) {
      return NextResponse.json({ error: routeError }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const payload = {
      review_id: `avatar-${Date.now()}`,
      user_id: account.user_id,
      user_name: account.username,
      user_email: account.email,
      role_name: homeRoute === "/manager" ? "Manager" : homeRoute === "/employee/workspace" ? "Employee" : account.role?.role_name ?? "User",
      avatar_url: cleanAvatarUrl,
      status: "Pending",
      admin_note: "",
      created_at: timestamp,
      updated_at: timestamp,
      reviewed_at: null,
    };

    const { data, error } = await supabase
      .from("avatar_review_request")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      review: data,
      message: "Avatar uploaded for Platform Admin review.",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { error: authError } = await requirePlatformAdmin(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { reviewId, status, adminNote = "" } = await request.json();
    const targetReviewId = cleanString(reviewId);
    const nextStatus = cleanString(status);

    if (!targetReviewId) {
      return NextResponse.json({ error: "Avatar review ID is required." }, { status: 400 });
    }

    if (!["Approved", "Rejected"].includes(nextStatus)) {
      return NextResponse.json({ error: "Avatar review status must be Approved or Rejected." }, { status: 400 });
    }

    const { data: existingReview, error: reviewLoadError } = await supabase
      .from("avatar_review_request")
      .select("*")
      .eq("review_id", targetReviewId)
      .maybeSingle();

    if (reviewLoadError || !existingReview) {
      return NextResponse.json({ error: reviewLoadError?.message || "Avatar review could not be loaded." }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const { data, error } = await supabase
      .from("avatar_review_request")
      .update({
        status: nextStatus,
        admin_note: cleanString(adminNote),
        updated_at: timestamp,
        reviewed_at: timestamp,
      })
      .eq("review_id", targetReviewId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (nextStatus === "Approved") {
      const { error: profileError } = await supabase
        .from("profile")
        .update({
          profile_picture_url: existingReview.avatar_url,
        })
        .eq("user_id", existingReview.user_id);

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ review: data, success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
