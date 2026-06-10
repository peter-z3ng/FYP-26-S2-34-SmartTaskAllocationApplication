import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

async function required(query) {
  const result = await query;
  if (result.error) throw result.error;
  return result.data ?? [];
}

async function optional(query) {
  const result = await query;
  return result.error ? [] : result.data ?? [];
}

export async function GET(request) {
  try {
    const accessToken = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json({ error: "Authentication token is required." }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const [
      organizations,
      roles,
      users,
      profiles,
      skills,
      userSkills,
      qualifications,
      userQualifications,
      tasks,
      taskSkills,
      taskQualifications,
      assignments,
      requests,
      availability,
      activityLogs,
      taskComments,
    ] = await Promise.all([
      required(supabase.from("organization").select("*").order("created_at", { ascending: true })),
      required(supabase.from("role").select("*").order("role_id", { ascending: true })),
      required(supabase.from("user_account").select("*").order("created_at", { ascending: false })),
      optional(supabase.from("profile").select("*")),
      optional(supabase.from("skill").select("*").order("skill_name")),
      optional(supabase.from("user_skill").select("*")),
      optional(supabase.from("qualification").select("*").order("qualification_name")),
      optional(supabase.from("user_qualification").select("*")),
      required(supabase.from("task").select("*").order("created_at", { ascending: false })),
      optional(supabase.from("task_skill").select("*")),
      optional(supabase.from("task_qualification").select("*")),
      required(supabase.from("task_assignment").select("*").order("assigned_at", { ascending: false })),
      optional(supabase.from("task_assignment_request").select("*").order("requested_at", { ascending: false })),
      optional(supabase.from("availability").select("*")),
      optional(supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(10)),
      optional(supabase.from("task_comment").select("*").order("created_at", { ascending: false }).limit(25)),
    ]);

    const currentAccount =
      users.find((user) => user.user_id === userData.user.id) ??
      users.find((user) => user.email === userData.user.email) ??
      null;

    return NextResponse.json({
      currentAccount: currentAccount
        ? {
            ...currentAccount,
            auth_email: userData.user.email,
          }
        : {
            user_id: userData.user.id,
            email: userData.user.email,
            username: userData.user.email,
            role_id: null,
          },
      data: {
        organizations,
        roles,
        users,
        profiles,
        skills,
        userSkills,
        qualifications,
        userQualifications,
        tasks,
        taskSkills,
        taskQualifications,
        assignments,
        requests,
        availability,
        activityLogs,
        taskComments,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
