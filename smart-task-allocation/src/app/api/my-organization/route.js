import { NextResponse } from "next/server";
import { getAuthenticatedUser, requireUserAdmin } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function getUserAccount(supabase, user) {
  const { data, error } = await supabase
    .from("user_account")
    .select("user_id, organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || data) {
    return { account: data, error };
  }

  const byEmail = await supabase
    .from("user_account")
    .select("user_id, organization_id")
    .eq("email", user.email)
    .maybeSingle();

  return { account: byEmail.data, error: byEmail.error };
}

export async function GET(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, error: authError } = await getAuthenticatedUser(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { account, error: accountError } = await getUserAccount(supabase, user);

    if (accountError) {
      return NextResponse.json({ error: accountError.message }, { status: 400 });
    }

    if (!account?.organization_id) {
      return NextResponse.json({ organization: null });
    }

    const { data, error } = await supabase
      .from("organization")
      .select("*")
      .eq("organization_id", account.organization_id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ organization: data });
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

    const adminCheck = await requireUserAdmin(request, supabase);

    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: 403 });
    }

    const { account, error: accountError } = await getUserAccount(supabase, user);

    if (accountError) {
      return NextResponse.json({ error: accountError.message }, { status: 400 });
    }

    if (!account) {
      return NextResponse.json({ error: "User account was not found." }, { status: 400 });
    }

    const {
      organizationName,
      organizationCode,
      organizationEmail,
      organizationType,
      logoUrl,
    } = await request.json();
    const payload = {
      organization_name: cleanString(organizationName),
      organization_code: cleanString(organizationCode) || null,
      organization_email: cleanString(organizationEmail).toLowerCase() || null,
      organization_type: cleanString(organizationType) || null,
      logo_url: cleanString(logoUrl) || null,
      updated_at: new Date().toISOString(),
    };

    if (!payload.organization_name) {
      return NextResponse.json(
        { error: "Organization name is required." },
        { status: 400 },
      );
    }

    if (account.organization_id) {
      const { error } = await supabase
        .from("organization")
        .update(payload)
        .eq("organization_id", account.organization_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    const { data: createdOrganization, error: createError } = await supabase
      .from("organization")
      .insert({
        ...payload,
        created_at: new Date().toISOString(),
      })
      .select("organization_id")
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    const { error: linkError } = await supabase
      .from("user_account")
      .update({
        organization_id: createdOrganization.organization_id,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", account.user_id);

    if (linkError) {
      return NextResponse.json({ error: linkError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
