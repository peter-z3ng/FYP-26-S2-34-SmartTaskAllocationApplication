import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { cleanString } from "@/lib/allocation";

export async function POST(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user } = await getAuthenticatedUser(request, supabase);
    const { rating, category, message } = await request.json();
    const numericRating = Number(rating);

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5 || !cleanString(message)) {
      return NextResponse.json({ error: "Rating from 1 to 5 and feedback message are required." }, { status: 400 });
    }

    const { error } = await supabase.from("activity_log").insert({
      user_id: user?.id ?? null,
      action: "User Feedback Submitted",
      details: JSON.stringify({
        rating: numericRating,
        category: cleanString(category) || "General",
        message: cleanString(message),
        status: "Pending",
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
