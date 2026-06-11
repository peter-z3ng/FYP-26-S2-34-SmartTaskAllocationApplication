import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAuthenticatedUser, getUserHomeRoute, requirePlatformAdmin } from "@/lib/serverAuth";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function priorityForTier(tier) {
  return tier === "Team" || tier === "Enterprise" ? "Priority" : "Standard";
}

function responseForTier(tier) {
  return tier === "Enterprise"
    ? "Within 4 business hours"
    : tier === "Team"
      ? "Within 1 business day"
      : "Within 2 business days";
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
    const { user, error: authError } = await getAuthenticatedUser(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { homeRoute, error: routeError } = await getUserHomeRoute(user, supabase);

    if (routeError) {
      return NextResponse.json({ error: routeError }, { status: 400 });
    }

    let query = supabase.from("support_request").select("*").order("created_at", { ascending: false });

    if (homeRoute !== "/platformadmin") {
      query = query.eq("requester_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ requests: data ?? [] });
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
      return NextResponse.json({ error: "Only Manager and Employee users can submit this support request." }, { status: 403 });
    }

    const { account, error: accountError } = await getAccountForUser(supabase, user);

    if (accountError || !account) {
      return NextResponse.json({ error: accountError || "Account record could not be loaded." }, { status: 400 });
    }

    const { subject, message, category = "General" } = await request.json();
    const title = cleanString(subject);
    const details = cleanString(message);

    if (!title || !details) {
      return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
    }

    const tier = account.subscription_tier ?? "Starter";
    const timestamp = new Date().toISOString();
    const payload = {
      request_id: `support-${Date.now()}`,
      subject: title,
      message: details,
      category: cleanString(category) || "General",
      status: "Open",
      requester_id: account.user_id,
      requester_name: account.username,
      requester_email: account.email,
      requester_role: homeRoute === "/manager" ? "Manager" : "Employee",
      subscription_tier: tier,
      priority: priorityForTier(tier),
      expected_response: responseForTier(tier),
      platform_reply: "",
      created_at: timestamp,
      updated_at: timestamp,
      replied_at: null,
    };

    const { data, error } = await supabase
      .from("support_request")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      request: data,
      message: "Support request sent to Platform Admin.",
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

    const { requestId, status = "Replied", reply = "" } = await request.json();
    const supportRequestId = cleanString(requestId);

    if (!supportRequestId) {
      return NextResponse.json({ error: "Support request ID is required." }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const updates = {
      status: cleanString(status) || "Replied",
      platform_reply: cleanString(reply),
      updated_at: timestamp,
      replied_at: cleanString(reply) ? timestamp : null,
    };

    const { data, error } = await supabase
      .from("support_request")
      .update(updates)
      .eq("request_id", supportRequestId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ request: data, success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
