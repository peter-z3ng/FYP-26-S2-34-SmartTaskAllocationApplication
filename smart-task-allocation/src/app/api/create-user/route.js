import { NextResponse } from "next/server";
import { requireUserAdmin } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSubscriptionTier(value) {
  return cleanString(value).toLowerCase() === "paid" ? "Paid" : "Free";
}

export async function POST(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { error: authError } = await requireUserAdmin(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { email, username, password, roleId, organizationId, subscriptionTier } = await request.json();
    const cleanEmail = cleanString(email).toLowerCase();
    const cleanUsername = cleanString(username);
    const cleanPassword = cleanString(password);
    const numericRoleId = Number(roleId);
    const cleanOrganizationId = cleanString(organizationId);
    const cleanSubscriptionTier = normalizeSubscriptionTier(subscriptionTier);

    if (
      !cleanEmail ||
      !cleanUsername ||
      cleanPassword.length < 6 ||
      !Number.isInteger(numericRoleId)
    ) {
      return NextResponse.json(
        { error: "Email, username, password, and role are required." },
        { status: 400 },
      );
    }

    const { data: createdData, error: createError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password: cleanPassword,
      email_confirm: true,
      user_metadata: {
        username: cleanUsername,
        role_id: numericRoleId,
        subscription_tier: cleanSubscriptionTier,
      },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    const createdUserId = createdData.user?.id;

    if (!createdUserId) {
      return NextResponse.json(
        { error: "Supabase did not return a created user ID." },
        { status: 400 },
      );
    }

    const { error: accountError } = await supabase.from("user_account").upsert(
      {
        user_id: createdUserId,
        role_id: numericRoleId,
        organization_id: cleanOrganizationId || null,
        username: cleanUsername,
        email: cleanEmail,
        account_status: "Active",
        subscription_tier: cleanSubscriptionTier,
      },
      { onConflict: "user_id" },
    );

    if (accountError) {
      await supabase.auth.admin.deleteUser(createdUserId);
      return NextResponse.json({ error: accountError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
