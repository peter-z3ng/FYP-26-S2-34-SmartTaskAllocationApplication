import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { cleanString } from "@/lib/allocation";

export async function POST(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { name, email, inquiryType, message } = await request.json();

    if (!cleanString(name) || !cleanString(email) || !cleanString(inquiryType) || !cleanString(message)) {
      return NextResponse.json({ error: "Name, email, inquiry type, and message are required." }, { status: 400 });
    }

    if (!cleanString(email).includes("@")) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    const { error } = await supabase.from("activity_log").insert({
      user_id: null,
      action: "Contact Support Inquiry",
      details: JSON.stringify({
        name: cleanString(name),
        email: cleanString(email),
        inquiryType: cleanString(inquiryType),
        message: cleanString(message),
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
