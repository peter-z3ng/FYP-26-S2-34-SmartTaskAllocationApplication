import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { cleanString } from "@/lib/allocation";

const ACTIONS = {
  homepage: "Homepage Content Updated",
  plan: "Subscription Plan Saved",
  feedback: "User Feedback Submitted",
  inquiry: "Contact Support Inquiry",
  avatarReview: "Avatar Review Submitted",
};

const MODERATABLE_FEEDBACK_STATUSES = new Set(["Pending", "Published", "Hidden"]);
const INQUIRY_STATUSES = new Set(["Open", "Resolved"]);
const AVATAR_REVIEW_STATUSES = new Set(["Approved", "Rejected"]);

function parseDetails(row) {
  if (!row?.details) {
    return {};
  }

  try {
    return typeof row.details === "string" ? JSON.parse(row.details) : row.details;
  } catch {
    return { message: row.details };
  }
}

async function loadLogs(supabase) {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

function mapRecord(row) {
  return {
    ...row,
    details: parseDetails(row),
  };
}

async function loadLogById(supabase, logId) {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("log_id", logId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function updateModeratedLog(supabase, { sourceLog, status, userId, note }) {
  const previousDetails = parseDetails(sourceLog);
  const updatedDetails = {
    ...previousDetails,
    status,
    moderatedAt: new Date().toISOString(),
    moderatedBy: userId,
  };

  const cleanNote = cleanString(note);
  if (cleanNote) {
    updatedDetails.moderationNote = cleanNote;
  }

  const { error } = await supabase
    .from("activity_log")
    .update({ details: JSON.stringify(updatedDetails) })
    .eq("log_id", sourceLog.log_id);

  if (error) {
    throw new Error(error.message);
  }

  return updatedDetails;
}

async function publishApprovedAvatar(supabase, details) {
  if (!details.userId || !details.avatarDataUrl) {
    throw new Error("Avatar review is missing required user data.");
  }

  const { data: existingProfile, error: profileError } = await supabase
    .from("profile")
    .select("*")
    .eq("user_id", details.userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (existingProfile) {
    const { error } = await supabase
      .from("profile")
      .update({
        profile_picture_url: details.avatarDataUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", details.userId);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabase.from("profile").upsert(
    {
      profile_id: details.userId,
      user_id: details.userId,
      full_name: details.name || details.email || "User",
      profile_picture_url: details.avatarDataUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function GET(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { error: authError } = await requirePlatformAdmin(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const logs = await loadLogs(supabase);
    const feedback = logs.filter((row) => row.action === ACTIONS.feedback).map(mapRecord);
    const inquiries = logs.filter((row) => row.action === ACTIONS.inquiry).map(mapRecord);
    const avatarReviews = logs.filter((row) => row.action === ACTIONS.avatarReview).map(mapRecord);
    const homepage = logs.find((row) => row.action === ACTIONS.homepage);
    const plans = logs.filter((row) => row.action === ACTIONS.plan).map(mapRecord);

    return NextResponse.json({
      logs: logs.map(mapRecord),
      feedback,
      inquiries,
      avatarReviews,
      homepage: homepage ? mapRecord(homepage) : null,
      plans,
      analytics: {
        feedbackCount: feedback.length,
        averageRating:
          feedback.length === 0
            ? 0
            : Math.round(
                (feedback.reduce((total, row) => total + (Number(row.details.rating) || 0), 0) /
                  feedback.length) *
                  10,
              ) / 10,
        openInquiryCount: inquiries.filter((row) => row.details.status !== "Resolved").length,
        pendingFeedbackCount: feedback.filter((row) => row.details.status === "Pending").length,
        publishedFeedbackCount: feedback.filter((row) => row.details.status === "Published").length,
        hiddenFeedbackCount: feedback.filter((row) => row.details.status === "Hidden").length,
        pendingAvatarReviewCount: avatarReviews.filter((row) => row.details.status === "Pending").length,
        logCount: logs.length,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, error: authError } = await requirePlatformAdmin(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const payload = await request.json();
    const type = cleanString(payload.type);
    let action = "";
    let details = {};

    if (type === "homepage") {
      action = ACTIONS.homepage;
      details = {
        heroTitle: cleanString(payload.heroTitle),
        announcement: cleanString(payload.announcement),
      };
    }

    if (type === "plan") {
      action = ACTIONS.plan;
      details = {
        name: cleanString(payload.name),
        price: cleanString(payload.price),
        features: cleanString(payload.features)
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      };
    }

    if (type === "feedback-status" || type === "inquiry-status" || type === "avatar-review-status") {
      const sourceLog = await loadLogById(supabase, payload.logId);
      const isFeedback = type === "feedback-status";
      const isInquiry = type === "inquiry-status";
      const allowedAction = isFeedback ? ACTIONS.feedback : isInquiry ? ACTIONS.inquiry : ACTIONS.avatarReview;
      const allowedStatuses = isFeedback ? MODERATABLE_FEEDBACK_STATUSES : isInquiry ? INQUIRY_STATUSES : AVATAR_REVIEW_STATUSES;
      const status = cleanString(payload.status);

      if (!sourceLog || sourceLog.action !== allowedAction) {
        return NextResponse.json({ error: "Source record could not be found for this platform action." }, { status: 404 });
      }

      if (!allowedStatuses.has(status)) {
        return NextResponse.json({ error: "A valid moderation status is required." }, { status: 400 });
      }

      await updateModeratedLog(supabase, {
        sourceLog,
        status,
        userId: user.id,
        note: payload.note,
      });

      if (type === "avatar-review-status" && status === "Approved") {
        await publishApprovedAvatar(supabase, parseDetails(sourceLog));
      }

      action = isFeedback ? "Feedback Moderation Updated" : isInquiry ? "Contact Inquiry Updated" : "Avatar Review Updated";
      details = {
        sourceLogId: sourceLog.log_id,
        status,
        note: cleanString(payload.note),
      };
    }

    if (!action) {
      return NextResponse.json({ error: "A valid platform management action is required." }, { status: 400 });
    }

    const { error } = await supabase.from("activity_log").insert({
      user_id: user.id,
      action,
      details: JSON.stringify(details),
      created_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
