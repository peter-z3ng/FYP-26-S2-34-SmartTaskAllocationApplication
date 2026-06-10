import { NextResponse } from "next/server";
import { requireManager } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { evaluateEmployeeForTask, getAccountForUser, getOrganizationIdForUser, getTaskById } from "@/lib/allocation";
import { getPaidFeature, isPaidTier, paidFeatureError } from "@/lib/paidFeatures";
import { buildRecommendation, confidenceFromEvaluation, sortEvaluatedCandidates } from "@/lib/recommendations";

async function loadOrganizationEmployees(supabase, organizationId) {
  const { data: employeeRole } = await supabase
    .from("role")
    .select("role_id")
    .ilike("role_name", "employee")
    .maybeSingle();

  let employeesQuery = supabase
    .from("user_account")
    .select("user_id, organization_id, username, email, account_status, subscription_tier");

  if (organizationId) {
    employeesQuery = employeesQuery.eq("organization_id", organizationId);
  }

  if (employeeRole?.role_id) {
    employeesQuery = employeesQuery.eq("role_id", employeeRole.role_id);
  }

  const { data, error } = await employeesQuery;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function GET(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, error: authError } = await requireManager(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const account = await getAccountForUser(supabase, user);
    const feature = getPaidFeature("aiRecommendations");

    if (!isPaidTier(account?.subscription_tier)) {
      return NextResponse.json(
        {
          error: paidFeatureError(feature?.title ?? "AI recommendations"),
          feature: feature?.key ?? "aiRecommendations",
          tier: account?.subscription_tier ?? "Free",
        },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ error: "Task is required." }, { status: 400 });
    }

    const task = await getTaskById(supabase, taskId);
    const organizationId = await getOrganizationIdForUser(supabase, user);

    if (!task || (organizationId && task.organization_id !== organizationId)) {
      return NextResponse.json({ error: "Task was not found for this organization." }, { status: 404 });
    }

    const employees = await loadOrganizationEmployees(supabase, organizationId);
    const evaluated = await Promise.all(
      employees.map(async (employee) => ({
        employee,
        evaluation: await evaluateEmployeeForTask(supabase, task, employee),
      })),
    );
    const ranked = sortEvaluatedCandidates(evaluated);
    const bestMatch = ranked.find((entry) => entry.evaluation.eligible) ?? ranked[0] ?? null;

    return NextResponse.json({
      task,
      recommendations: ranked.map((entry) => ({
        employee: entry.employee,
        evaluation: entry.evaluation,
        confidence: confidenceFromEvaluation(entry.evaluation),
      })),
      bestMatch,
      recommendation: bestMatch ? buildRecommendation(task, bestMatch, evaluated) : null,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
