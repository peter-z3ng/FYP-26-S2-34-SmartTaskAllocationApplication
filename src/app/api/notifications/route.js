import { NextResponse } from "next/server";
import { getAuthenticatedUser, getUserHomeRoute } from "@/lib/serverAuth";
import { cleanString, getAccountForUser, getOrganizationIdForUser } from "@/lib/allocation";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const AVATAR_REVIEW_ACTION = "Avatar Review Submitted";
const FEEDBACK_ACTION = "User Feedback Submitted";
const INQUIRY_ACTION = "Contact Support Inquiry";

function parseDetails(row) {
  if (!row?.details) return {};

  try {
    return typeof row.details === "string" ? JSON.parse(row.details) : row.details;
  } catch {
    return {};
  }
}

function itemDate(row, fallbackKey) {
  return row?.[fallbackKey] || row?.created_at || row?.assigned_at || row?.requested_at || new Date().toISOString();
}

function sortByCreatedAt(items) {
  return [...items].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

async function loadManagerNotifications(supabase, user) {
  const organizationId = await getOrganizationIdForUser(supabase, user);
  let query = supabase
    .from("task_assignment_request")
    .select(
      "request_id, requested_at, status, user:user_id(user_id, username, email), task:task_id!inner(task_id, title, organization_id)",
    )
    .order("requested_at", { ascending: false })
    .limit(12);

  if (organizationId) {
    query = query.eq("task.organization_id", organizationId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((request) => ({
    id: `request-${request.request_id}`,
    title: request.status === "Pending" ? "Task request pending" : `Task request ${request.status}`,
    text: `${request.user?.username ?? request.user?.email ?? "Employee"} requested ${request.task?.title ?? "a task"}.`,
    status: request.status,
    href: "/manager/team",
    createdAt: itemDate(request, "requested_at"),
  }));
}

async function loadEmployeeNotifications(supabase, account) {
  const [assignmentsResult, requestsResult] = await Promise.all([
    supabase
      .from("task_assignment")
      .select("assignment_id, assigned_at, status, task:task_id(task_id, title)")
      .eq("user_id", account.user_id)
      .order("assigned_at", { ascending: false })
      .limit(8),
    supabase
      .from("task_assignment_request")
      .select("request_id, requested_at, status, task:task_id(task_id, title)")
      .eq("user_id", account.user_id)
      .order("requested_at", { ascending: false })
      .limit(8),
  ]);

  const error = assignmentsResult.error || requestsResult.error;
  if (error) {
    throw new Error(error.message);
  }

  const assignments = (assignmentsResult.data ?? []).map((assignment) => ({
    id: `assignment-${assignment.assignment_id}`,
    title: "Task assignment received",
    text: `Manager assigned ${assignment.task?.title ?? "a task"} to you.`,
    status: assignment.status,
    href: "/employee/tasks",
    createdAt: itemDate(assignment, "assigned_at"),
  }));
  const requests = (requestsResult.data ?? []).map((request) => ({
    id: `request-${request.request_id}`,
    title: `Task request ${request.status}`,
    text: `${request.task?.title ?? "Your task request"} is ${String(request.status).toLowerCase()}.`,
    status: request.status,
    href: "/employee/tasks",
    createdAt: itemDate(request, "requested_at"),
  }));

  return sortByCreatedAt([...assignments, ...requests]).slice(0, 12);
}

async function loadPlatformNotifications(supabase) {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []).map((row) => ({ ...row, details: parseDetails(row) }));
  const avatarReviews = rows
    .filter((row) => row.action === AVATAR_REVIEW_ACTION && row.details.status === "Pending")
    .map((row) => ({
      id: `avatar-${row.log_id}`,
      title: "Avatar review pending",
      text: `${row.details.name || row.details.email || "A user"} uploaded a new avatar.`,
      status: "Pending",
      href: "/platformadmin",
      createdAt: row.created_at,
    }));
  const feedback = rows
    .filter((row) => row.action === FEEDBACK_ACTION && row.details.status === "Pending")
    .map((row) => ({
      id: `feedback-${row.log_id}`,
      title: "Feedback needs review",
      text: row.details.message || "A user submitted workflow feedback.",
      status: "Pending",
      href: "/platformadmin",
      createdAt: row.created_at,
    }));
  const inquiries = rows
    .filter((row) => row.action === INQUIRY_ACTION && row.details.status !== "Resolved")
    .map((row) => ({
      id: `inquiry-${row.log_id}`,
      title: "Support inquiry open",
      text: row.details.message || "A support inquiry is waiting.",
      status: row.details.status || "Open",
      href: "/platformadmin",
      createdAt: row.created_at,
    }));

  return sortByCreatedAt([...avatarReviews, ...feedback, ...inquiries]).slice(0, 12);
}

function settingsHref(homeRoute) {
  if (homeRoute === "/employee") return "/employee/settings";
  if (homeRoute === "/platformadmin") return "/platformadmin/settings";
  if (homeRoute === "/useradmin/accounts") return "/useradmin/settings";
  return "/manager/settings";
}

async function loadProfileAlert(supabase, account, homeRoute) {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("action", AVATAR_REVIEW_ACTION)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    throw new Error(error.message);
  }

  const row = (data ?? [])
    .map((entry) => ({ ...entry, details: parseDetails(entry) }))
    .find((entry) => entry.details.userId === account.user_id);

  if (!row) return null;

  const status = cleanString(row.details.status) || "Pending";

  if (status === "Pending") {
    return {
      id: `profile-avatar-${row.log_id}`,
      title: "Avatar pending review",
      text: "Your uploaded avatar is waiting for Platform Admin approval.",
      status,
      href: settingsHref(homeRoute),
      createdAt: row.created_at,
    };
  }

  if (status === "Rejected") {
    return {
      id: `profile-avatar-${row.log_id}`,
      title: "Avatar not approved",
      text: row.details.moderationNote || "Please upload a different profile avatar.",
      status,
      href: settingsHref(homeRoute),
      createdAt: row.details.moderatedAt || row.created_at,
    };
  }

  return {
    id: `profile-avatar-${row.log_id}`,
    title: "Avatar approved",
    text: "Your approved avatar is now visible on your profile icon.",
    status,
    href: settingsHref(homeRoute),
    createdAt: row.details.moderatedAt || row.created_at,
  };
}

export async function GET(request) {
  try {
    const supabase = getSupabaseAdminClient();
    const { user, error: authError } = await getAuthenticatedUser(request, supabase);

    if (authError) {
      return NextResponse.json({ error: authError }, { status: 403 });
    }

    const account = await getAccountForUser(supabase, user);
    const { homeRoute, error: routeError } = await getUserHomeRoute(user, supabase);

    if (routeError) {
      return NextResponse.json({ error: routeError }, { status: 403 });
    }

    if (!account) {
      return NextResponse.json({ error: "Account was not found." }, { status: 404 });
    }

    let items = [];
    if (homeRoute === "/manager") {
      items = await loadManagerNotifications(supabase, user);
    } else if (homeRoute === "/employee") {
      items = await loadEmployeeNotifications(supabase, account);
    } else if (homeRoute === "/platformadmin") {
      items = await loadPlatformNotifications(supabase);
    }

    const profileAlert = await loadProfileAlert(supabase, account, homeRoute);
    const allItems = sortByCreatedAt(profileAlert ? [profileAlert, ...items] : items).slice(0, 12);

    return NextResponse.json({ items: allItems, profileAlert });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
