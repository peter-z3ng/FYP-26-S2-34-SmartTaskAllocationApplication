import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { cleanString } from "@/lib/allocation";

const ACTIONS = {
  homepage: "Homepage Content Updated",
  plan: "Subscription Plan Saved",
  feedback: "User Feedback Submitted",
  inquiry: "Contact Support Inquiry",
};

function parseDetails(row) {
  if (!row?.details) {
    return {};
  }

  try {
    return JSON.parse(row.details);
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
    const homepage = logs.find((row) => row.action === ACTIONS.homepage);
    const plans = logs.filter((row) => row.action === ACTIONS.plan).map(mapRecord);

    return NextResponse.json({
      logs: logs.map(mapRecord),
      feedback,
      inquiries,
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

    if (type === "feedback-status" || type === "inquiry-status") {
      action = type === "feedback-status" ? "Feedback Moderation Updated" : "Contact Inquiry Updated";
      details = {
        sourceLogId: payload.logId,
        status: cleanString(payload.status),
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
