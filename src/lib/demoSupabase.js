import { getHomeRouteForRole } from "@/lib/roleRoutes";

export const DEMO_PASSWORD = "Test@123456";

const now = new Date("2026-06-12T09:00:00.000Z").toISOString();

export const DEMO_TEST_ACCOUNTS = [
  {
    email: "demo-platform@optima.test",
    password: DEMO_PASSWORD,
    role: "Platform Admin",
    homeRoute: "/platformadmin",
    label: "Platform Admin",
  },
  {
    email: "demo-useradmin@optima.test",
    password: DEMO_PASSWORD,
    role: "User Admin",
    homeRoute: "/useradmin/accounts",
    label: "User Admin",
  },
  {
    email: "demo-manager@optima.test",
    password: DEMO_PASSWORD,
    role: "Manager",
    homeRoute: "/manager",
    label: "Manager",
  },
  {
    email: "demo-employee@optima.test",
    password: DEMO_PASSWORD,
    role: "Employee",
    homeRoute: "/employee/workspace",
    label: "Employee",
  },
];

const roles = [
  { role_id: 1, role_name: "Platform Admin" },
  { role_id: 2, role_name: "User Admin" },
  { role_id: 3, role_name: "Manager" },
  { role_id: 4, role_name: "Employee" },
];

const organizations = [
  {
    organization_id: "org-optima-demo",
    organization_name: "Optima Demo Organization",
    organization_email: "operations@optima.test",
  },
];

const departments = [
  { department_id: "dept-product", department_name: "Product" },
  { department_id: "dept-engineering", department_name: "Engineering" },
  { department_id: "dept-operations", department_name: "Operations" },
  { department_id: "dept-support", department_name: "Support" },
];

const skillRows = [
  { skill_id: 1, skill_name: "Frontend" },
  { skill_id: 2, skill_name: "Backend" },
  { skill_id: 3, skill_name: "QA" },
  { skill_id: 4, skill_name: "Data Analysis" },
  { skill_id: 5, skill_name: "Customer Support" },
  { skill_id: 6, skill_name: "Documentation" },
  { skill_id: 7, skill_name: "Project Planning" },
  { skill_id: 8, skill_name: "Automation" },
];

const accountSeeds = [
  ["demo-platform", "Platform Owner", "demo-platform@optima.test", 1, "Active", "dept-operations"],
  ["demo-useradmin", "User Admin Lead", "demo-useradmin@optima.test", 2, "Active", "dept-operations"],
  ["demo-manager", "Alicia Tan", "demo-manager@optima.test", 3, "Active", "dept-product"],
  ["demo-employee", "Ben Carter", "demo-employee@optima.test", 4, "Active", "dept-engineering"],
  ["demo-employee-2", "Chloe Lim", "demo-employee-2@optima.test", 4, "Active", "dept-engineering"],
  ["demo-employee-3", "Diego Ramos", "demo-employee-3@optima.test", 4, "Active", "dept-product"],
  ["demo-employee-4", "Emma Wong", "demo-employee-4@optima.test", 4, "Active", "dept-support"],
  ["demo-employee-5", "Farah Noor", "demo-employee-5@optima.test", 4, "Active", "dept-operations"],
  ["demo-employee-6", "George Lee", "demo-employee-6@optima.test", 4, "Active", "dept-engineering"],
  ["demo-employee-7", "Hannah Smith", "demo-employee-7@optima.test", 4, "Active", "dept-product"],
  ["demo-employee-8", "Ivan Patel", "demo-employee-8@optima.test", 4, "Suspended", "dept-support"],
  ["demo-employee-9", "Jade Chen", "demo-employee-9@optima.test", 4, "Pending", "dept-operations"],
  ["demo-employee-10", "Kenji Sato", "demo-employee-10@optima.test", 4, "Active", "dept-engineering"],
  ["demo-employee-11", "Lina Park", "demo-employee-11@optima.test", 4, "Active", "dept-product"],
];

const DICEBEAR_OPEN_PEEPS_BASE_URL = "https://api.dicebear.com/10.x/open-peeps/svg";
const DICEBEAR_AVATAR_BACKGROUNDS = ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf", "c5ead9", "f2d5cf"];

function openPeepsAvatarUrl(seed, index) {
  const params = new URLSearchParams({
    seed,
    radius: "50",
    backgroundColor: DICEBEAR_AVATAR_BACKGROUNDS[index % DICEBEAR_AVATAR_BACKGROUNDS.length],
  });

  return `${DICEBEAR_OPEN_PEEPS_BASE_URL}?${params.toString()}`;
}

const profileAvatarByUserId = Object.fromEntries(
  accountSeeds.map(([userId, username], index) => [userId, openPeepsAvatarUrl(`${userId}-${username}`, index)]),
);

function roleFor(roleId) {
  return roles.find((role) => role.role_id === Number(roleId)) ?? null;
}

function organizationFor(organizationId) {
  return organizations.find((organization) => organization.organization_id === organizationId) ?? null;
}

function departmentFor(departmentId) {
  return departments.find((department) => department.department_id === departmentId) ?? null;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const userAccounts = accountSeeds.map(([userId, username, email, roleId, accountStatus, departmentId], index) => ({
  user_id: userId,
  username,
  email,
  role_id: roleId,
  role: roleFor(roleId),
  organization_id: "org-optima-demo",
  organization: organizationFor("org-optima-demo"),
  department_id: departmentId,
  department: departmentFor(departmentId),
  account_status: accountStatus,
  subscription_tier: index % 3 === 0 ? "Enterprise" : index % 3 === 1 ? "Team" : "Starter",
  last_active_at: new Date(Date.parse(now) - index * 11 * 60 * 1000).toISOString(),
  created_at: now,
  updated_at: now,
}));

const profiles = userAccounts.map((account) => ({
  user_id: account.user_id,
  full_name: account.username,
  profile_picture_url: profileAvatarByUserId[account.user_id] ?? "",
  phone_number: "",
  bio: "",
  position:
    account.role_id === 3
      ? "Delivery Manager"
      : account.role_id === 4
        ? "Team Specialist"
        : account.role?.role_name,
}));

const availability = userAccounts
  .filter((account) => account.role_id === 4)
  .map((account, index) => ({
    availability_id: `availability-${index + 1}`,
    user_id: account.user_id,
    status: index % 5 === 0 ? "Busy" : index % 4 === 0 ? "Unavailable" : "Available",
    availability_start: new Date(Date.parse(now) - index * 30 * 60 * 1000).toISOString(),
    availability_end: new Date(Date.parse(now) + (index + 1) * 60 * 60 * 1000).toISOString(),
  }));

const userSkills = [
  ["demo-employee", 1],
  ["demo-employee", 2],
  ["demo-employee-2", 2],
  ["demo-employee-2", 8],
  ["demo-employee-3", 7],
  ["demo-employee-3", 4],
  ["demo-employee-4", 5],
  ["demo-employee-4", 6],
  ["demo-employee-5", 3],
  ["demo-employee-5", 7],
  ["demo-employee-6", 1],
  ["demo-employee-6", 8],
  ["demo-employee-7", 4],
  ["demo-employee-7", 6],
  ["demo-employee-8", 5],
  ["demo-employee-9", 3],
  ["demo-employee-10", 2],
  ["demo-employee-10", 4],
  ["demo-employee-11", 1],
  ["demo-employee-11", 7],
].map(([userId, skillId], index) => ({
  user_skill_id: `user-skill-${index + 1}`,
  user_id: userId,
  skill_id: skillId,
  skill: skillRows.find((skill) => skill.skill_id === skillId),
}));

const teams = [
  {
    team_id: 101,
    organization_id: "org-optima-demo",
    team_name: "Workflow Excellence",
    created_by: "demo-manager",
    created_at: now,
    updated_at: now,
  },
  {
    team_id: 102,
    organization_id: "org-optima-demo",
    team_name: "Support Rotation",
    created_by: "demo-manager",
    created_at: now,
    updated_at: now,
  },
];

const teamMembers = [
  ["demo-manager", 101, "Owner", "Delivery Manager"],
  ["demo-employee", 101, "Member", "Frontend Specialist"],
  ["demo-employee-2", 101, "Member", "Backend Specialist"],
  ["demo-employee-3", 101, "Member", "Planner"],
  ["demo-employee-4", 102, "Member", "Support Specialist"],
  ["demo-employee-5", 102, "Member", "QA Specialist"],
  ["demo-employee-10", 101, "Member", "Data Analyst"],
  ["demo-employee-11", 101, "Member", "Automation Specialist"],
].map(([userId, teamId, teamRole, position], index) => ({
  team_member_id: `team-member-${index + 1}`,
  team_id: teamId,
  user_id: userId,
  team_role: teamRole,
  position,
  joined_at: new Date(Date.parse(now) + index * 60 * 1000).toISOString(),
}));

const workspaces = [
  {
    workspace_id: "workspace-demo-1",
    organization_id: "org-optima-demo",
    workspace_name: "Launch Readiness",
    description: "Demo workspace for allocation and task-board testing.",
    created_by: "demo-manager",
    status: "Active",
    visibility: "Private",
    share_token: "demo-launch-readiness",
    link_access: "View",
    created_at: now,
    updated_at: now,
  },
];

const tasks = [
  {
    task_id: 101,
    organization_id: "org-optima-demo",
    workspace_id: "workspace-demo-1",
    title: "Build recommendation dashboard",
    description: "Use employee skills, workload, and availability to suggest an assignee.",
    owner_id: "demo-manager",
    assigned_to: "demo-employee",
    status: "Open",
    priority: "High",
    start_datetime: now,
    end_datetime: new Date(Date.parse(now) + 2 * 24 * 60 * 60 * 1000).toISOString(),
    sort_order: 1,
    created_at: now,
    updated_at: now,
  },
  {
    task_id: 102,
    organization_id: "org-optima-demo",
    workspace_id: "workspace-demo-1",
    title: "Verify onboarding flow",
    description: "Check User Admin invite, account status, and first login handling.",
    owner_id: "demo-manager",
    assigned_to: "demo-employee-5",
    status: "In Progress",
    priority: "Medium",
    start_datetime: now,
    end_datetime: new Date(Date.parse(now) + 3 * 24 * 60 * 60 * 1000).toISOString(),
    sort_order: 2,
    created_at: now,
    updated_at: now,
  },
  {
    task_id: 103,
    organization_id: "org-optima-demo",
    workspace_id: "workspace-demo-1",
    title: "Prepare support handover",
    description: "Document unresolved tickets and support ownership.",
    owner_id: "demo-manager",
    assigned_to: "demo-employee-4",
    status: "Open",
    priority: "Low",
    start_datetime: now,
    end_datetime: new Date(Date.parse(now) + 5 * 24 * 60 * 60 * 1000).toISOString(),
    sort_order: 3,
    created_at: now,
    updated_at: now,
  },
];

const passwordResetRequests = [
  {
    request_id: "reset-demo-1",
    email: "demo-employee@optima.test",
    note: "Forgot password during demo testing.",
    status: "Pending",
    requested_by_user_id: "demo-employee",
    requested_by_name: "Ben Carter",
    assigned_admin_id: "demo-useradmin",
    admin_message: "Employee requested password reset assistance.",
    admin_note: "",
    created_at: new Date(Date.parse(now) + 15 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.parse(now) + 15 * 60 * 1000).toISOString(),
    resolved_at: null,
  },
];

const supportRequests = [
  {
    request_id: "support-demo-1",
    subject: "Automated assignment response time",
    message: "Manager needs help checking why an allocation recommendation is slow.",
    category: "Workflow",
    status: "Open",
    requester_id: "demo-manager",
    requester_name: "Alicia Tan",
    requester_email: "demo-manager@optima.test",
    requester_role: "Manager",
    subscription_tier: "Starter",
    priority: "Standard",
    expected_response: "Within 2 business days",
    platform_reply: "",
    created_at: new Date(Date.parse(now) + 20 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.parse(now) + 20 * 60 * 1000).toISOString(),
    replied_at: null,
  },
];

const workflowFeedback = [
  {
    feedback_id: "feedback-demo-1",
    title: "Recommendation score is useful",
    message: "The eligibility view helps explain why a task is routed to a specific employee.",
    rating: 5,
    status: "Open",
    display_status: "Shown",
    requester_id: "demo-employee",
    requester_name: "Ben Carter",
    requester_email: "demo-employee@optima.test",
    requester_role: "Employee",
    subscription_tier: "Enterprise",
    platform_reply: "",
    created_at: new Date(Date.parse(now) + 25 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.parse(now) + 25 * 60 * 1000).toISOString(),
  },
];

const avatarReviewRequests = [
  {
    review_id: "avatar-review-demo-1",
    user_id: "demo-employee",
    user_name: "Ben Carter",
    user_email: "demo-employee@optima.test",
    role_name: "Employee",
    avatar_url: "",
    status: "Pending",
    admin_note: "",
    created_at: new Date(Date.parse(now) + 30 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.parse(now) + 30 * 60 * 1000).toISOString(),
    reviewed_at: null,
  },
];

const tableData = {
  role: roles,
  organization: organizations,
  department: departments,
  user_account: userAccounts,
  profile: profiles,
  availability,
  skill: skillRows,
  user_skill: userSkills,
  team: teams,
  team_member: teamMembers,
  team_invitation: [],
  workspace: workspaces,
  workspace_member: [{ workspace_id: "workspace-demo-1", user_id: "demo-manager", joined_at: now }],
  task: tasks,
  task_assignment: [],
  password_reset_request: passwordResetRequests,
  support_request: supportRequests,
  workflow_feedback: workflowFeedback,
  avatar_review_request: avatarReviewRequests,
};

export function isDemoSupabaseMode() {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function getDemoAccountByEmail(email) {
  return userAccounts.find((account) => account.email.toLowerCase() === String(email).toLowerCase()) ?? null;
}

export function getDemoAccountById(userId) {
  return userAccounts.find((account) => account.user_id === userId) ?? null;
}

export function createDemoToken(userId) {
  return `demo:${userId}`;
}

export function getDemoUserFromToken(token) {
  if (!String(token).startsWith("demo:")) {
    return null;
  }

  const userId = String(token).slice("demo:".length);
  const account = getDemoAccountById(userId);

  if (!account) {
    return null;
  }

  return {
    id: account.user_id,
    email: account.email,
    user_metadata: {
      full_name: account.username,
      role: account.role?.role_name,
    },
  };
}

export function validateDemoLogin(email, password) {
  const account = getDemoAccountByEmail(email);

  if (!account || password !== DEMO_PASSWORD || account.account_status !== "Active") {
    return { error: { message: "Invalid demo credentials or inactive account." }, data: { user: null, session: null } };
  }

  const user = getDemoUserFromToken(createDemoToken(account.user_id));
  const session = {
    access_token: createDemoToken(account.user_id),
    user,
  };

  return { data: { user, session }, error: null };
}

export function getDemoHomeRouteForAccount(account) {
  return getHomeRouteForRole(account?.role?.role_name);
}

function rowValue(row, field) {
  return row?.[field];
}

function applyFilters(rows, filters) {
  return filters.reduce((nextRows, filter) => {
    if (filter.type === "eq") {
      return nextRows.filter((row) => String(rowValue(row, filter.field)) === String(filter.value));
    }

    if (filter.type === "in") {
      const values = new Set((filter.values ?? []).map((value) => String(value)));
      return nextRows.filter((row) => values.has(String(rowValue(row, filter.field))));
    }

    return nextRows;
  }, rows);
}

class DemoQueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.filters = [];
    this.orders = [];
    this.limitCount = null;
    this.mode = "select";
    this.payload = null;
    this.resultRows = null;
  }

  select() {
    return this;
  }

  eq(field, value) {
    this.filters.push({ type: "eq", field, value });
    return this;
  }

  in(field, values) {
    this.filters.push({ type: "in", field, values });
    return this;
  }

  order(field, options = {}) {
    this.orders.push({ field, ascending: options.ascending !== false });
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  insert(payload) {
    this.mode = "insert";
    this.payload = Array.isArray(payload) ? payload : [payload];
    const rows = tableData[this.tableName] ?? [];
    rows.push(...this.payload);
    this.resultRows = this.payload;
    return this;
  }

  update(payload) {
    this.mode = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.mode = "delete";
    return this;
  }

  async maybeSingle() {
    const { data, error } = await this.execute();
    return { data: data?.[0] ?? null, error };
  }

  async single() {
    const { data, error } = await this.execute();
    return { data: data?.[0] ?? null, error };
  }

  async execute() {
    const rows = tableData[this.tableName];

    if (!rows) {
      return { data: [], error: null };
    }

    if (this.mode === "update") {
      const matched = applyFilters(rows, this.filters);
      matched.forEach((row) => Object.assign(row, this.payload));
      return { data: clone(matched), error: null };
    }

    if (this.mode === "delete") {
      const matched = new Set(applyFilters(rows, this.filters));
      tableData[this.tableName] = rows.filter((row) => !matched.has(row));
      return { data: [], error: null };
    }

    let result = this.resultRows ? [...this.resultRows] : [...rows];
    result = applyFilters(result, this.filters);

    for (const { field, ascending } of [...this.orders].reverse()) {
      result.sort((a, b) => {
        const left = rowValue(a, field);
        const right = rowValue(b, field);
        if (left === right) return 0;
        if (left == null) return ascending ? -1 : 1;
        if (right == null) return ascending ? 1 : -1;
        return left > right ? (ascending ? 1 : -1) : ascending ? -1 : 1;
      });
    }

    if (this.limitCount != null) {
      result = result.slice(0, this.limitCount);
    }

    return { data: clone(result), error: null };
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }
}

export function getDemoSupabaseAdminClient() {
  return {
    auth: {
      async getUser(token) {
        const user = getDemoUserFromToken(token);
        return user
          ? { data: { user }, error: null }
          : { data: { user: null }, error: { message: "Invalid demo token." } };
      },
      admin: {
        async deleteUser() {
          return { error: null };
        },
      },
    },
    from(tableName) {
      return new DemoQueryBuilder(tableName);
    },
  };
}
