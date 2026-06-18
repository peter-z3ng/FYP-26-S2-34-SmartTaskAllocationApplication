import { NextResponse } from "next/server";
import { requireEmployee } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { clockStatusFromLatestLog, getAccountForUser, getLatestClockLogForUser } from "@/lib/allocation";

const CLOCK_ACTIONS = ["Clock In", "Clock Out"];

async function loadEmployee(request, supabase) {
  const { user, error } = await requireEmployee(request, supabase);

  if (error) {
    return { error };
  }

  const account = await getAccountForUser(supabase, user);

  if (!account) {
    return { error: "Employee account was not found." };
  }

  return { account };
}

export async function GET(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { account, error: authError } = await loadEmployee(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const [latestLog, historyResult] = await Promise.all([
      getLatestClockLogForUser(supabase, account.user_id),
      supabase
        .from("activity_log")
        .select("*")
        .eq("user_id", account.user_id)
        .in("action", CLOCK_ACTIONS)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    if (historyResult.error) {
      throw new Error(historyResult.error.message);
    }

    const clock = clockStatusFromLatestLog(latestLog);

    return NextResponse.json({
      clockedIn: clock.clockedIn,
      status: clock.status,
      latestLog,
      history: historyResult.data ?? [],
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { account, error: authError } = await loadEmployee(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { action } = await request.json();
    const latestLog = await getLatestClockLogForUser(supabase, account.user_id);
    const isClockedIn = latestLog?.action === "Clock In";

    if (action === "clock-in") {
      if (isClockedIn) {
        return NextResponse.json({ error: "Employee is already clocked in." }, { status: 400 });
      }

      const { error } = await supabase.from("activity_log").insert({
        user_id: account.user_id,
        action: "Clock In",
        details: "Employee started a working session.",
        created_at: new Date().toISOString(),
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, clockedIn: true });
    }

    if (action === "clock-out") {
      if (!isClockedIn) {
        return NextResponse.json({ error: "Employee is not clocked in." }, { status: 400 });
      }

      const clockInTime = new Date(latestLog.created_at);
      const clockOutTime = new Date();
      const workedMinutes = Math.max(0, Math.round((clockOutTime - clockInTime) / 60000));

      const { error } = await supabase.from("activity_log").insert({
        user_id: account.user_id,
        action: "Clock Out",
        details: `Employee ended a working session after ${workedMinutes} minutes.`,
        created_at: clockOutTime.toISOString(),
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, clockedIn: false, workedMinutes });
    }

    return NextResponse.json({ error: "Clock action is required." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
