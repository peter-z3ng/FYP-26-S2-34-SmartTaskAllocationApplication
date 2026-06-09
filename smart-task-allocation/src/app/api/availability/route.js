import { NextResponse } from "next/server";
import { requireEmployee } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { cleanString, getAccountForUser } from "@/lib/allocation";

const VALID_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

async function getEmployeeAccount(request, supabase) {
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
    const { account, error: authError } = await getEmployeeAccount(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("availability")
      .select("*")
      .eq("user_id", account.user_id)
      .order("availability_id", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ availability: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { account, error: authError } = await getEmployeeAccount(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { dayOfWeek, startTime, endTime, status } = await request.json();
    const cleanDay = cleanString(dayOfWeek);

    if (!VALID_DAYS.includes(cleanDay) || !startTime || !endTime) {
      return NextResponse.json({ error: "Day, start time, and end time are required." }, { status: 400 });
    }

    if (endTime <= startTime) {
      return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
    }

    const { error } = await supabase.from("availability").insert({
      user_id: account.user_id,
      day_of_week: cleanDay,
      start_time: startTime,
      end_time: endTime,
      status: cleanString(status) || "Available",
    });

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
    const { account, error: authError } = await getEmployeeAccount(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const availabilityId = searchParams.get("availabilityId");

    if (!availabilityId) {
      return NextResponse.json({ error: "Availability entry is required." }, { status: 400 });
    }

    const { error } = await supabase
      .from("availability")
      .delete()
      .eq("availability_id", availabilityId)
      .eq("user_id", account.user_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
