import { NextResponse } from "next/server";
import { requireUserAdmin } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSubscriptionTier(value) {
  return cleanString(value).toLowerCase() === "paid" ? "Paid" : "Free";
}

export async function GET(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { error: authError } = await requireUserAdmin(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("user_account")
      .select(
        "user_id, username, email, account_status, subscription_tier, role_id, organization_id, created_at, updated_at, role:role_id(role_name, description), organization:organization_id(organization_name, organization_code, organization_email, organization_type)",
      )
      .order("role_id", { ascending: true })
      .order("username", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const accounts = data ?? [];
    const userIds = accounts.map((account) => account.user_id).filter(Boolean);
    let profilesByUserId = {};

    if (userIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from("profile")
        .select("user_id, full_name, phone_number, address, bio, profile_picture_url, created_at, updated_at")
        .in("user_id", userIds);

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 400 });
      }

      profilesByUserId = (profiles ?? []).reduce((profilesMap, profile) => {
        profilesMap[profile.user_id] = profile;
        return profilesMap;
      }, {});
    }

    return NextResponse.json({
      accounts: accounts.map((account) => ({
        ...account,
        profile: profilesByUserId[account.user_id] ?? null,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { error: authError } = await requireUserAdmin(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { userId, username, email, roleId, organizationId, accountStatus, subscriptionTier } =
      await request.json();
    const updates = {};

    if (username !== undefined) {
      updates.username = cleanString(username);
    }

    if (email !== undefined) {
      updates.email = cleanString(email).toLowerCase();
    }

    if (roleId !== undefined) {
      updates.role_id = Number(roleId);
    }

    if (organizationId !== undefined) {
      updates.organization_id = cleanString(organizationId) || null;
    }

    if (accountStatus !== undefined) {
      updates.account_status = cleanString(accountStatus);
    }

    if (subscriptionTier !== undefined) {
      updates.subscription_tier = normalizeSubscriptionTier(subscriptionTier);
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("user_account")
      .update(updates)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { error: authError } = await requireUserAdmin(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const { error: accountError } = await supabase
      .from("user_account")
      .delete()
      .eq("user_id", userId);

    if (accountError) {
      return NextResponse.json({ error: accountError.message }, { status: 400 });
    }

    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      return NextResponse.json({ error: authDeleteError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
