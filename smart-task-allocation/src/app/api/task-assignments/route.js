import { NextResponse } from "next/server";
import { requireManager } from "@/lib/serverAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  assignTaskToEmployee,
  evaluateEmployeeForTask,
  getAccountForUser,
  getEmployeeById,
  getOrganizationIdForUser,
  getTaskById,
} from "@/lib/allocation";
import { getPaidFeature, isPaidTier, paidFeatureError } from "@/lib/paidFeatures";
import { buildRecommendation, sortEvaluatedCandidates } from "@/lib/recommendations";

export async function GET(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, error: authError } = await requireManager(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const organizationId = await getOrganizationIdForUser(supabase, user);
    let query = supabase
      .from("task_assignment")
      .select(
        "assignment_id, assigned_at, status, user:user_id(user_id, username, email, subscription_tier), task:task_id!inner(task_id, title, organization_id, start_datetime, end_datetime)",
      )
      .order("assigned_at", { ascending: false });

    if (organizationId) {
      query = query.eq("task.organization_id", organizationId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ assignments: data ?? [] });
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

    const { taskId, userId, mode } = await request.json();
    const managerAccount = await getAccountForUser(supabase, user);

    if (!taskId) {
      return NextResponse.json({ error: "Task is required." }, { status: 400 });
    }

    const task = await getTaskById(supabase, taskId);
    const organizationId = await getOrganizationIdForUser(supabase, user);

    if (!task || (organizationId && task.organization_id !== organizationId)) {
      return NextResponse.json({ error: "Task was not found for this organization." }, { status: 404 });
    }

    if (mode === "auto") {
      const feature = getPaidFeature("smartAllocation");

      if (!isPaidTier(managerAccount?.subscription_tier)) {
        return NextResponse.json(
          {
            error: paidFeatureError(feature?.title ?? "Smart allocation"),
            feature: feature?.key ?? "smartAllocation",
            tier: managerAccount?.subscription_tier ?? "Free",
          },
          { status: 403 },
        );
      }

      const { data: employeeRole } = await supabase
        .from("role")
        .select("role_id")
        .ilike("role_name", "employee")
        .maybeSingle();

      let employeesQuery = supabase
        .from("user_account")
        .select("user_id, organization_id, username, email, account_status, subscription_tier")
        .eq("account_status", "Active");

      if (organizationId) {
        employeesQuery = employeesQuery.eq("organization_id", organizationId);
      }

      if (employeeRole?.role_id) {
        employeesQuery = employeesQuery.eq("role_id", employeeRole.role_id);
      }

      const { data: employees, error: employeesError } = await employeesQuery;

      if (employeesError) {
        return NextResponse.json({ error: employeesError.message }, { status: 400 });
      }

      const evaluated = await Promise.all(
        (employees ?? []).map(async (employee) => ({
          employee,
          evaluation: await evaluateEmployeeForTask(supabase, task, employee),
        })),
      );
      const ranked = sortEvaluatedCandidates(evaluated).filter((entry) => entry.evaluation.eligible);

      if (ranked.length === 0) {
        return NextResponse.json({ error: "No employee is eligible for this task." }, { status: 400 });
      }

      const result = await assignTaskToEmployee(supabase, task, ranked[0].employee);

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        assignment: result.assignment,
        employee: ranked[0].employee,
        evaluation: result.evaluation,
        recommendation: buildRecommendation(task, ranked[0], evaluated),
      });
    }

    if (!userId) {
      return NextResponse.json({ error: "Employee is required." }, { status: 400 });
    }

    const employee = await getEmployeeById(supabase, userId);
    const result = await assignTaskToEmployee(supabase, task, employee);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, assignment: result.assignment, evaluation: result.evaluation });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
