import { NextResponse } from "next/server";
import { requireUserAdmin } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
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
        "user_id, username, email, account_status, subscription_tier, role_id, organization_id, department_id, last_active_at, created_at, updated_at, role:role_id(role_name), organization:organization_id(organization_name), department:department_id(department_name)",
      )
      .order("role_id", { ascending: true })
      .order("username", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const accountIds = (data ?? []).map((account) => account.user_id);
    const { data: profiles, error: profileError } = accountIds.length
      ? await supabase
          .from("profile")
          .select("user_id, full_name, position, phone_number, bio, profile_picture_url")
          .in("user_id", accountIds)
      : { data: [], error: null };

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    const profilesByUserId = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));
    const accounts = (data ?? []).map((account) => {
      const profile = profilesByUserId.get(account.user_id) ?? null;
      return {
        ...account,
        profile,
        full_name: profile?.full_name ?? account.username,
        profile_picture_url: profile?.profile_picture_url ?? "",
      };
    });

    return NextResponse.json({ accounts });
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
      const tier = cleanString(subscriptionTier);
      const allowedTiers = new Set(["Starter", "Team", "Enterprise"]);

      if (!allowedTiers.has(tier)) {
        return NextResponse.json({ error: "Subscription tier must be Starter, Team, or Enterprise." }, { status: 400 });
      }

      updates.subscription_tier = tier;
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
