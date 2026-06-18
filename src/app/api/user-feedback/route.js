import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { cleanString } from "@/lib/allocation";

async function loadFeedbackAccount(supabase, user) {
  if (!user) return null;

  const selectFields =
    "user_id, username, email, role:role_id(role_name), organization:organization_id(organization_name)";
  const { data: accountById } = await supabase
    .from("user_account")
    .select(selectFields)
    .eq("user_id", user.id)
    .maybeSingle();

  if (accountById || !user.email) {
    return accountById;
  }

  const { data: accountByEmail } = await supabase
    .from("user_account")
    .select(selectFields)
    .eq("email", user.email)
    .maybeSingle();

  return accountByEmail;
}

export async function POST(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user } = await getAuthenticatedUser(request, supabase);
    const { rating, category, message } = await request.json();
    const numericRating = Number(rating);

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5 || !cleanString(message)) {
      return NextResponse.json({ error: "Rating from 1 to 5 and feedback message are required." }, { status: 400 });
    }

    const account = await loadFeedbackAccount(supabase, user);
    const displayName =
      cleanString(account?.username) ||
      cleanString(user?.user_metadata?.username) ||
      cleanString(user?.email?.split("@")[0]) ||
      "Optima user";

    const { error } = await supabase.from("activity_log").insert({
      user_id: user?.id ?? null,
      action: "User Feedback Submitted",
      details: JSON.stringify({
        name: displayName,
        role: cleanString(account?.role?.role_name) || "Optima user",
        company: cleanString(account?.organization?.organization_name) || "Optima workspace",
        rating: numericRating,
        category: cleanString(category) || "General",
        message: cleanString(message),
        status: "Pending",
        submittedBy: user?.id ?? null,
      }),
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
