import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const FEEDBACK_ACTION = "User Feedback Submitted";

function parseDetails(row) {
  if (!row?.details) return {};

  try {
    return typeof row.details === "string" ? JSON.parse(row.details) : row.details;
  } catch {
    return { message: row.details };
  }
}

function normalizeRating(value) {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return 0;
  return Math.max(0, Math.min(5, Math.round(rating)));
}

function toPublicFeedback(row) {
  const details = parseDetails(row);
  const message = details.message || details.comment || details.details || "";
  const rating = normalizeRating(details.rating);

  return {
    id: `feedback-${row.log_id}`,
    sourceLogId: row.log_id,
    quote: details.quote || message || "Submitted workflow feedback",
    name: details.name || details.author || details.role || "Optima user",
    role: details.role || "Optima user",
    company: details.company || details.organization || "Optima workspace",
    rating,
    category: details.category || details.type || "General",
    date: row.created_at || new Date().toISOString(),
    details: message,
    status: details.status || "Pending",
  };
}

export async function loadPublishedFeedback(limit) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("action", FEEDBACK_ACTION)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    throw new Error(error.message);
  }

  const published = (data ?? [])
    .map(toPublicFeedback)
    .filter((item) => item.status === "Published" && item.rating > 0);

  return typeof limit === "number" ? published.slice(0, limit) : published;
}
