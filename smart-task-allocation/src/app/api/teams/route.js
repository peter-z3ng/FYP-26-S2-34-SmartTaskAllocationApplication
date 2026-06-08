import { NextResponse } from "next/server";
import { getAuthenticatedUser, requireManager } from "@/lib/serverAuth";
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

async function getLatestAvailabilityByUserId(supabase, userIds) {
  if (!userIds.length) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("availability")
    .select("user_id, status, availability_start, availability_end")
    .in("user_id", userIds)
    .order("availability_start", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const availabilityByUserId = new Map();

  for (const row of data ?? []) {
    if (!availabilityByUserId.has(row.user_id)) {
      availabilityByUserId.set(row.user_id, row);
    }
  }

  return availabilityByUserId;
}

async function getSkillsByUserId(supabase, userIds) {
  if (!userIds.length) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("user_skill")
    .select("user_id, skill:skill_id(skill_name)")
    .in("user_id", userIds);

  if (error) {
    throw new Error(error.message);
  }

  const skillsByUserId = new Map();

  for (const row of data ?? []) {
    const skillName = row.skill?.skill_name;

    if (!skillName) {
      continue;
    }

    const currentSkills = skillsByUserId.get(row.user_id) ?? [];
    currentSkills.push(skillName);
    skillsByUserId.set(row.user_id, currentSkills);
  }

  return skillsByUserId;
}

async function getProfilesByUserId(supabase, userIds) {
  if (!userIds.length) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("profile")
    .select("user_id, full_name, profile_picture_url")
    .in("user_id", userIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((profile) => [profile.user_id, profile]));
}

async function getMembersForTeam(supabase, team) {
  if (!team?.team_id) {
    return [];
  }

  const { data: memberRows, error: memberError } = await supabase
    .from("team_member")
    .select("team_id, user_id, team_role, position, joined_at")
    .eq("team_id", team.team_id)
    .order("joined_at", { ascending: true });

  if (memberError) {
    throw new Error(memberError.message);
  }

  const membersByUserId = new Map((memberRows ?? []).map((member) => [member.user_id, member]));

  if (team.created_by && !membersByUserId.has(team.created_by)) {
    membersByUserId.set(team.created_by, {
      team_id: team.team_id,
      user_id: team.created_by,
      team_role: "Member",
      position: null,
      joined_at: team.created_at,
    });
  }

  const normalizedMemberRows = [...membersByUserId.values()].sort(
    (a, b) => new Date(a.joined_at ?? 0).getTime() - new Date(b.joined_at ?? 0).getTime()
  );
  const userIds = normalizedMemberRows.map((member) => member.user_id);

  if (!userIds.length) {
    return [];
  }

  const [{ data: users, error: usersError }, availabilityByUserId, skillsByUserId, profilesByUserId] =
    await Promise.all([
      supabase
        .from("user_account")
        .select(
          "user_id, username, email, account_status, last_active_at, role:role_id(role_name), department:department_id(department_name)"
        )
        .in("user_id", userIds),
      getLatestAvailabilityByUserId(supabase, userIds),
      getSkillsByUserId(supabase, userIds),
      getProfilesByUserId(supabase, userIds),
    ]);

  if (usersError) {
    throw new Error(usersError.message);
  }

  const usersById = new Map((users ?? []).map((user) => [user.user_id, user]));

  return normalizedMemberRows.map((member) => {
    const account = usersById.get(member.user_id) ?? {};

    return {
      ...account,
      ...member,
      profile: profilesByUserId.get(member.user_id) ?? null,
      availability: availabilityByUserId.get(member.user_id) ?? null,
      skills: skillsByUserId.get(member.user_id) ?? [],
    };
  });
}

async function getPendingInvitations(supabase, teamId) {
  if (!teamId) {
    return [];
  }

  const { data, error } = await supabase
    .from("team_invitation")
    .select(
      "invitation_id, team_id, inviter, invitee, status, created_at, responded_at, invitee_account:invitee(username, email)"
    )
    .eq("team_id", teamId)
    .eq("status", "Pending")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
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

    if (!account?.organization_id) {
      return NextResponse.json({ teams: [], selectedTeam: null, members: [], invitations: [] });
    }

    const { data: memberRows, error: membershipError } = await supabase
      .from("team_member")
      .select("team_id")
      .eq("user_id", account.user_id);

    if (membershipError) {
      return NextResponse.json({ error: membershipError.message }, { status: 400 });
    }

    const memberTeamIds = (memberRows ?? []).map((member) => member.team_id);
    const { data: ownedTeams, error: ownedError } = await supabase
      .from("team")
      .select("team_id, organization_id, team_name, created_by, created_at, updated_at")
      .eq("organization_id", account.organization_id)
      .eq("created_by", account.user_id);

    if (ownedError) {
      return NextResponse.json({ error: ownedError.message }, { status: 400 });
    }

    let memberTeams = [];

    if (memberTeamIds.length) {
      const { data, error } = await supabase
        .from("team")
        .select("team_id, organization_id, team_name, created_by, created_at, updated_at")
        .eq("organization_id", account.organization_id)
        .in("team_id", memberTeamIds);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      memberTeams = data ?? [];
    }

    const teamsById = new Map();

    for (const team of [...(ownedTeams ?? []), ...memberTeams]) {
      teamsById.set(team.team_id, team);
    }

    const teams = [...teamsById.values()].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const { searchParams } = new URL(request.url);
    const requestedTeamId = Number(searchParams.get("teamId"));
    const selectedTeam =
      teams.find((team) => team.team_id === requestedTeamId) ?? teams[0] ?? null;
    const members = await getMembersForTeam(supabase, selectedTeam);
    const invitations = await getPendingInvitations(supabase, selectedTeam?.team_id);

    return NextResponse.json({
      teams,
      selectedTeam,
      members,
      invitations,
      currentUserId: account.user_id,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, error: authError } = await requireManager(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { account, error: accountError } = await getAccount(supabase, user);

    if (accountError) {
      return NextResponse.json({ error: accountError.message }, { status: 400 });
    }

    if (!account?.organization_id) {
      return NextResponse.json({ error: "Manager account is not linked to an organization." }, { status: 400 });
    }

    const { teamName } = await request.json();
    const cleanedTeamName = cleanString(teamName);

    if (!cleanedTeamName) {
      return NextResponse.json({ error: "Team name is required." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { data: team, error: teamError } = await supabase
      .from("team")
      .insert({
        organization_id: account.organization_id,
        team_name: cleanedTeamName,
        created_by: account.user_id,
        created_at: now,
        updated_at: now,
      })
      .select("team_id, organization_id, team_name, created_by, created_at, updated_at")
      .single();

    if (teamError) {
      return NextResponse.json({ error: teamError.message }, { status: 400 });
    }

    const { error: memberError } = await supabase.from("team_member").insert({
      team_id: team.team_id,
      user_id: account.user_id,
      team_role: "Member",
      joined_at: now,
    });

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 400 });
    }

    return NextResponse.json({ team });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
