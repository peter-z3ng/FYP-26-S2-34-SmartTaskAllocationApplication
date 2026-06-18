import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { cleanString, getAccountForUser } from "@/lib/allocation";
import { isPaidTier, normalizeUserTier, paidFeatureError } from "@/lib/paidFeatures";

export async function POST(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { name, email, inquiryType, message, priority } = await request.json();
    const authorization = request.headers.get("authorization") ?? "";
    let account = null;

    if (authorization.startsWith("Bearer ")) {
      const { user } = await getAuthenticatedUser(request, supabase);
      account = user ? await getAccountForUser(supabase, user) : null;
    }
    const priorityRequested = Boolean(priority);
    const priorityEnabled = priorityRequested && isPaidTier(account?.subscription_tier);

    if (priorityRequested && !priorityEnabled) {
      return NextResponse.json({ error: paidFeatureError("Priority support") }, { status: 403 });
    }

    if (!cleanString(name) || !cleanString(email) || !cleanString(inquiryType) || !cleanString(message)) {
      return NextResponse.json({ error: "Name, email, inquiry type, and message are required." }, { status: 400 });
    }

    if (!cleanString(email).includes("@")) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    const { error } = await supabase.from("activity_log").insert({
      user_id: account?.user_id ?? null,
      action: "Contact Support Inquiry",
      details: JSON.stringify({
        name: cleanString(name),
        email: cleanString(email),
        inquiryType: cleanString(inquiryType),
        message: cleanString(message),
        priority: priorityEnabled,
        subscriptionTier: normalizeUserTier(account?.subscription_tier),
        status: "Open",
      }),
      created_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, priority: priorityEnabled });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
