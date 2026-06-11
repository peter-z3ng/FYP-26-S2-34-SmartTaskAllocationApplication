import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAuthenticatedUser, getUserHomeRoute, requirePlatformAdmin } from "@/lib/serverAuth";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function getAccountForUser(supabase, user) {
  const { data, error } = await supabase
    .from("user_account")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  return { account: data };
}

export async function GET(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { searchParams } = new URL(request.url);

    if (searchParams.get("scope") === "public") {
      const { data, error } = await supabase
        .from("workflow_feedback")
        .select("*")
        .eq("display_status", "Shown")
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ feedback: data ?? [] });
    }

    const { user, error: authError } = await getAuthenticatedUser(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { homeRoute, error: routeError } = await getUserHomeRoute(user, supabase);

    if (routeError) {
      return NextResponse.json({ error: routeError }, { status: 400 });
    }

    let query = supabase.from("workflow_feedback").select("*").order("created_at", { ascending: false });

    if (homeRoute !== "/platformadmin") {
      query = query.eq("requester_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ feedback: data ?? [] });
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

    const { homeRoute, error: routeError } = await getUserHomeRoute(user, supabase);

    if (routeError) {
      return NextResponse.json({ error: routeError }, { status: 400 });
    }

    if (!["/manager", "/employee/workspace"].includes(homeRoute)) {
      return NextResponse.json({ error: "Only Manager and Employee users can submit workflow feedback." }, { status: 403 });
    }

    const { account, error: accountError } = await getAccountForUser(supabase, user);

    if (accountError || !account) {
      return NextResponse.json({ error: accountError || "Account record could not be loaded." }, { status: 400 });
    }

    const { title, message, rating } = await request.json();
    const feedbackTitle = cleanString(title);
    const feedbackMessage = cleanString(message);
    const numericRating = Number(rating);

    if (!feedbackTitle || !feedbackMessage) {
      return NextResponse.json({ error: "Feedback title and message are required." }, { status: 400 });
    }

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: "Rating must be a whole number from 1 to 5." }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const payload = {
      feedback_id: `feedback-${Date.now()}`,
      title: feedbackTitle,
      message: feedbackMessage,
      rating: numericRating,
      status: "Open",
      display_status: "Hidden",
      requester_id: account.user_id,
      requester_name: account.username,
      requester_email: account.email,
      requester_role: homeRoute === "/manager" ? "Manager" : "Employee",
      subscription_tier: account.subscription_tier ?? "Starter",
      platform_reply: "",
      created_at: timestamp,
      updated_at: timestamp,
    };

    const { data, error } = await supabase
      .from("workflow_feedback")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      feedback: data,
      message: "Workflow feedback sent to Platform Admin for homepage review.",
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

    const { feedbackId, status, displayStatus, reply = "" } = await request.json();
    const targetFeedbackId = cleanString(feedbackId);

    if (!targetFeedbackId) {
      return NextResponse.json({ error: "Feedback ID is required." }, { status: 400 });
    }

    const updates = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) {
      updates.status = cleanString(status) || "Open";
    }

    if (displayStatus !== undefined) {
      updates.display_status = cleanString(displayStatus) === "Shown" ? "Shown" : "Hidden";
    }

    if (reply !== undefined) {
      updates.platform_reply = cleanString(reply);
    }

    const { data, error } = await supabase
      .from("workflow_feedback")
      .update(updates)
      .eq("feedback_id", targetFeedbackId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ feedback: data, success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
