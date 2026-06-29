import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function getAccount(supabase, user) {
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

    const { account, error: accountError } = await getAccount(supabase, user);

    if (accountError) {
      return NextResponse.json({ error: accountError.message }, { status: 400 });
    }

    if (!account?.user_id) {
      return NextResponse.json({ invitations: [] });
    }

    const { data, error } = await supabase
      .from("team_invitation")
      .select(
        "invitation_id, team_id, inviter, invitee, status, created_at, responded_at, team:team_id(team_name), inviter_account:inviter(username, email)",
      )
      .eq("invitee", account.user_id)
      .eq("status", "Pending")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ invitations: data ?? [] });
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

    const { account, error: accountError } = await getAccount(supabase, user);

    if (accountError) {
      return NextResponse.json({ error: accountError.message }, { status: 400 });
    }

    const { teamId, inviteeUserId, inviteeEmail } = await request.json();
    const numericTeamId = Number(teamId);

    if (!numericTeamId) {
      return NextResponse.json({ error: "Team ID is required." }, { status: 400 });
    }

    const { data: team, error: teamError } = await supabase
      .from("team")
      .select("team_id, organization_id, created_by")
      .eq("team_id", numericTeamId)
      .maybeSingle();

    if (teamError) {
      return NextResponse.json({ error: teamError.message }, { status: 400 });
    }

    if (!team || team.created_by !== account?.user_id) {
      return NextResponse.json({ error: "Only the team owner can invite members." }, { status: 403 });
    }

    let inviteeQuery = supabase
      .from("user_account")
      .select("user_id, organization_id, email")
      .eq("organization_id", team.organization_id);

    if (inviteeUserId) {
      inviteeQuery = inviteeQuery.eq("user_id", inviteeUserId);
    } else {
      const cleanedEmail = cleanString(inviteeEmail).toLowerCase();

      if (!cleanedEmail) {
        return NextResponse.json({ error: "Invitee email or user ID is required." }, { status: 400 });
      }

      inviteeQuery = inviteeQuery.eq("email", cleanedEmail);
    }

    const { data: invitee, error: inviteeError } = await inviteeQuery.maybeSingle();

    if (inviteeError) {
      return NextResponse.json({ error: inviteeError.message }, { status: 400 });
    }

    if (!invitee) {
      return NextResponse.json({ error: "Invitee was not found in this organization." }, { status: 404 });
    }

    const { data: existingMember } = await supabase
      .from("team_member")
      .select("team_id, user_id")
      .eq("team_id", numericTeamId)
      .eq("user_id", invitee.user_id)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json({ error: "This user is already a team member." }, { status: 400 });
    }

    const { error } = await supabase.from("team_invitation").upsert(
      {
        team_id: numericTeamId,
        inviter: account.user_id,
        invitee: invitee.user_id,
        status: "Pending",
        created_at: new Date().toISOString(),
        responded_at: null,
      },
      { onConflict: "team_id,invitee" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, error: authError } = await getAuthenticatedUser(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { account, error: accountError } = await getAccount(supabase, user);

    if (accountError) {
      return NextResponse.json({ error: accountError.message }, { status: 400 });
    }

    const { invitationId, action } = await request.json();
    const numericInvitationId = Number(invitationId);
    const nextStatus = action === "accept" ? "Accepted" : action === "reject" ? "Rejected" : "";

    if (!numericInvitationId || !nextStatus) {
      return NextResponse.json({ error: "Invitation ID and valid action are required." }, { status: 400 });
    }

    const { data: invitation, error: invitationError } = await supabase
      .from("team_invitation")
      .select("invitation_id, team_id, invitee, status")
      .eq("invitation_id", numericInvitationId)
      .maybeSingle();

    if (invitationError) {
      return NextResponse.json({ error: invitationError.message }, { status: 400 });
    }

    if (!invitation || invitation.invitee !== account?.user_id) {
      return NextResponse.json({ error: "Only the invitee can respond to this invitation." }, { status: 403 });
    }

    if (invitation.status !== "Pending") {
      return NextResponse.json({ error: "This invitation has already been answered." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("team_invitation")
      .update({ status: nextStatus, responded_at: now })
      .eq("invitation_id", numericInvitationId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    if (nextStatus === "Accepted") {
      const { error: memberError } = await supabase.from("team_member").upsert(
        {
          team_id: invitation.team_id,
          user_id: account.user_id,
          team_role: "Member",
          joined_at: now,
        },
        { onConflict: "team_id,user_id" }
      );

      if (memberError) {
        return NextResponse.json({ error: memberError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
