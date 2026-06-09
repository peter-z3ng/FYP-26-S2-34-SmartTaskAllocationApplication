const ORGANIZATION_ID = "demo-org-001";

function now() {
  return new Date().toISOString();
}

function seedDemoDatabase() {
  return {
    role: [
      { role_id: 1, role_name: "Platform Admin", description: "Manages the platform website, plans, feedback, inquiries, and activity logs." },
      { role_id: 2, role_name: "User Admin", description: "Manages organization users, roles, permissions, and organization profile." },
      { role_id: 3, role_name: "Manager", description: "Creates tasks, reviews employees, and controls smart task allocation." },
      { role_id: 4, role_name: "Employee", description: "Views assigned work, requests tasks, manages availability, and clocks time." },
    ],
    organization: [
      {
        organization_id: ORGANIZATION_ID,
        organization_name: "Optima Demo SME",
        organization_code: "WF-DEMO",
        organization_email: "ops@workflow.test",
        organization_type: "Retail Operations",
        logo_url: "",
        created_at: now(),
        updated_at: now(),
      },
    ],
    user_account: [
      { user_id: "demo-platformadmin", role_id: 1, organization_id: null, username: "Platform Admin", email: "platformadmin@workflow.test", account_status: "Active", subscription_tier: "Paid" },
      { user_id: "demo-useradmin", role_id: 2, organization_id: ORGANIZATION_ID, username: "User Admin", email: "useradmin@workflow.test", account_status: "Active", subscription_tier: "Paid" },
      { user_id: "demo-manager", role_id: 3, organization_id: ORGANIZATION_ID, username: "Manager", email: "manager@workflow.test", account_status: "Active", subscription_tier: "Paid" },
      { user_id: "demo-employee", role_id: 4, organization_id: ORGANIZATION_ID, username: "Employee", email: "employee@workflow.test", account_status: "Active", subscription_tier: "Free" },
      { user_id: "demo-employee-2", role_id: 4, organization_id: ORGANIZATION_ID, username: "Alicia Tan", email: "alicia@workflow.test", account_status: "Active", subscription_tier: "Paid" },
      { user_id: "demo-employee-3", role_id: 4, organization_id: ORGANIZATION_ID, username: "Ben Lee", email: "ben@workflow.test", account_status: "Suspended", subscription_tier: "Free" },
      { user_id: "demo-employee-4", role_id: 4, organization_id: ORGANIZATION_ID, username: "Chen Wei", email: "chen.wei@workflow.test", account_status: "Active", subscription_tier: "Paid" },
      { user_id: "demo-employee-5", role_id: 4, organization_id: ORGANIZATION_ID, username: "Daniel Ong", email: "daniel.ong@workflow.test", account_status: "Active", subscription_tier: "Free" },
      { user_id: "demo-employee-6", role_id: 4, organization_id: ORGANIZATION_ID, username: "Farah Lim", email: "farah.lim@workflow.test", account_status: "Active", subscription_tier: "Paid" },
      { user_id: "demo-employee-7", role_id: 4, organization_id: ORGANIZATION_ID, username: "Grace Koh", email: "grace.koh@workflow.test", account_status: "Active", subscription_tier: "Free" },
      { user_id: "demo-employee-8", role_id: 4, organization_id: ORGANIZATION_ID, username: "Iman Rahman", email: "iman.rahman@workflow.test", account_status: "Active", subscription_tier: "Paid" },
      { user_id: "demo-employee-9", role_id: 4, organization_id: ORGANIZATION_ID, username: "Mei Wong", email: "mei.wong@workflow.test", account_status: "Suspended", subscription_tier: "Paid" },
      { user_id: "demo-employee-10", role_id: 4, organization_id: ORGANIZATION_ID, username: "Ravi Kumar", email: "ravi.kumar@workflow.test", account_status: "Active", subscription_tier: "Free" },
      { user_id: "demo-employee-11", role_id: 4, organization_id: ORGANIZATION_ID, username: "Sofia Tan", email: "sofia.tan@workflow.test", account_status: "Active", subscription_tier: "Paid" },
    ],
    profile: [
      { profile_id: "profile-platformadmin", user_id: "demo-platformadmin", full_name: "Platform Admin", phone_number: "+65 6000 1000", address: "Optima Platform Office", bio: "Responsible for monitoring the platform and public website.", created_at: now(), updated_at: now() },
      { profile_id: "profile-useradmin", user_id: "demo-useradmin", full_name: "User Admin", phone_number: "+65 6000 2000", address: "Demo SME HQ", bio: "Maintains organization accounts and access control.", created_at: now(), updated_at: now() },
      { profile_id: "profile-manager", user_id: "demo-manager", full_name: "Manager", phone_number: "+65 6000 3000", address: "Demo SME Outlet", bio: "Plans daily task allocation.", created_at: now(), updated_at: now() },
      { profile_id: "profile-employee", user_id: "demo-employee", full_name: "Employee", phone_number: "+65 6000 4000", address: "Demo SME Outlet", bio: "Handles assigned work and availability updates.", created_at: now(), updated_at: now() },
      { profile_id: "profile-employee-2", user_id: "demo-employee-2", full_name: "Alicia Tan", phone_number: "+65 6000 4002", address: "Demo SME Front Desk", bio: "Senior front desk staff with strong customer support coverage.", created_at: now(), updated_at: now() },
      { profile_id: "profile-employee-3", user_id: "demo-employee-3", full_name: "Ben Lee", phone_number: "+65 6000 4003", address: "Demo SME Stockroom", bio: "Inventory specialist currently suspended for test coverage.", created_at: now(), updated_at: now() },
      { profile_id: "profile-employee-4", user_id: "demo-employee-4", full_name: "Chen Wei", phone_number: "+65 6000 4004", address: "Demo SME Service Counter", bio: "Customer support staff available for morning service windows.", created_at: now(), updated_at: now() },
      { profile_id: "profile-employee-5", user_id: "demo-employee-5", full_name: "Daniel Ong", phone_number: "+65 6000 4005", address: "Demo SME Warehouse", bio: "Inventory and outlet closing support.", created_at: now(), updated_at: now() },
      { profile_id: "profile-employee-6", user_id: "demo-employee-6", full_name: "Farah Lim", phone_number: "+65 6000 4006", address: "Demo SME Operations Desk", bio: "Cross-trained employee for customer support and stock count tasks.", created_at: now(), updated_at: now() },
      { profile_id: "profile-employee-7", user_id: "demo-employee-7", full_name: "Grace Koh", phone_number: "+65 6000 4007", address: "Demo SME Outlet", bio: "Part-time employee with afternoon availability.", created_at: now(), updated_at: now() },
      { profile_id: "profile-employee-8", user_id: "demo-employee-8", full_name: "Iman Rahman", phone_number: "+65 6000 4008", address: "Demo SME Outlet", bio: "Paid Pro employee profile for testing premium user badges.", created_at: now(), updated_at: now() },
      { profile_id: "profile-employee-9", user_id: "demo-employee-9", full_name: "Mei Wong", phone_number: "+65 6000 4009", address: "Demo SME HQ", bio: "Suspended Paid Pro employee for account-status testing.", created_at: now(), updated_at: now() },
      { profile_id: "profile-employee-10", user_id: "demo-employee-10", full_name: "Ravi Kumar", phone_number: "+65 6000 4010", address: "Demo SME Warehouse", bio: "Free user for inventory workload tests.", created_at: now(), updated_at: now() },
      { profile_id: "profile-employee-11", user_id: "demo-employee-11", full_name: "Sofia Tan", phone_number: "+65 6000 4011", address: "Demo SME Outlet", bio: "Paid Pro all-rounder for recommendation and reporting tests.", created_at: now(), updated_at: now() },
    ],
    availability: [
      { availability_id: 1, user_id: "demo-employee", day_of_week: "Monday", start_time: "08:00", end_time: "17:30", status: "Available" },
      { availability_id: 2, user_id: "demo-employee-2", day_of_week: "Monday", start_time: "09:00", end_time: "18:00", status: "Available" },
      { availability_id: 3, user_id: "demo-employee-3", day_of_week: "Tuesday", start_time: "10:00", end_time: "15:00", status: "Unavailable" },
      { availability_id: 4, user_id: "demo-employee-4", day_of_week: "Monday", start_time: "08:30", end_time: "13:30", status: "Available" },
      { availability_id: 5, user_id: "demo-employee-5", day_of_week: "Tuesday", start_time: "09:30", end_time: "16:30", status: "Available" },
      { availability_id: 6, user_id: "demo-employee-6", day_of_week: "Monday", start_time: "08:00", end_time: "16:00", status: "Available" },
      { availability_id: 7, user_id: "demo-employee-6", day_of_week: "Tuesday", start_time: "09:00", end_time: "15:00", status: "Available" },
      { availability_id: 8, user_id: "demo-employee-7", day_of_week: "Monday", start_time: "13:00", end_time: "18:00", status: "Available" },
      { availability_id: 9, user_id: "demo-employee-8", day_of_week: "Wednesday", start_time: "08:00", end_time: "13:00", status: "Available" },
      { availability_id: 10, user_id: "demo-employee-9", day_of_week: "Monday", start_time: "08:00", end_time: "18:00", status: "Available" },
      { availability_id: 11, user_id: "demo-employee-10", day_of_week: "Tuesday", start_time: "08:00", end_time: "17:00", status: "Available" },
      { availability_id: 12, user_id: "demo-employee-11", day_of_week: "Monday", start_time: "09:00", end_time: "17:00", status: "Available" },
      { availability_id: 13, user_id: "demo-employee-11", day_of_week: "Tuesday", start_time: "09:00", end_time: "17:00", status: "Available" },
    ],
    skill: [
      { skill_id: 1, skill_name: "Customer Support", description: "Can handle customer service and front desk duties." },
      { skill_id: 2, skill_name: "Inventory", description: "Can perform stock count and inventory checks." },
    ],
    user_skill: [
      { user_id: "demo-employee", skill_id: 1, proficiency_level: 4 },
      { user_id: "demo-employee", skill_id: 2, proficiency_level: 3 },
      { user_id: "demo-employee-2", skill_id: 1, proficiency_level: 5 },
      { user_id: "demo-employee-4", skill_id: 1, proficiency_level: 4 },
      { user_id: "demo-employee-5", skill_id: 2, proficiency_level: 4 },
      { user_id: "demo-employee-6", skill_id: 1, proficiency_level: 4 },
      { user_id: "demo-employee-6", skill_id: 2, proficiency_level: 4 },
      { user_id: "demo-employee-7", skill_id: 1, proficiency_level: 3 },
      { user_id: "demo-employee-8", skill_id: 1, proficiency_level: 5 },
      { user_id: "demo-employee-9", skill_id: 1, proficiency_level: 4 },
      { user_id: "demo-employee-9", skill_id: 2, proficiency_level: 4 },
      { user_id: "demo-employee-10", skill_id: 2, proficiency_level: 5 },
      { user_id: "demo-employee-11", skill_id: 1, proficiency_level: 5 },
      { user_id: "demo-employee-11", skill_id: 2, proficiency_level: 5 },
    ],
    qualification: [],
    user_qualification: [],
    task: [
      {
        task_id: 101,
        organization_id: ORGANIZATION_ID,
        task_code: "TASK-101",
        title: "Front desk coverage",
        description: "Cover the front counter during the lunch period.",
        status: "Open",
        start_datetime: "2026-05-25T09:00:00.000Z",
        end_datetime: "2026-05-25T12:00:00.000Z",
        created_at: now(),
        updated_at: now(),
      },
      {
        task_id: 102,
        organization_id: ORGANIZATION_ID,
        task_code: "TASK-102",
        title: "Inventory count",
        description: "Count shelf stock and record missing inventory.",
        status: "Open",
        start_datetime: "2026-05-26T10:00:00.000Z",
        end_datetime: "2026-05-26T14:00:00.000Z",
        created_at: now(),
        updated_at: now(),
      },
      {
        task_id: 103,
        organization_id: ORGANIZATION_ID,
        task_code: "TASK-103",
        title: "Customer support queue",
        description: "Respond to outstanding support requests.",
        status: "In Progress",
        start_datetime: "2026-05-27T08:30:00.000Z",
        end_datetime: "2026-05-27T11:30:00.000Z",
        created_at: now(),
        updated_at: now(),
      },
      {
        task_id: 104,
        organization_id: ORGANIZATION_ID,
        task_code: "TASK-104",
        title: "Morning service desk",
        description: "Handle front desk visitors and customer questions during the morning peak.",
        status: "Open",
        start_datetime: "2026-06-01T09:00:00.000Z",
        end_datetime: "2026-06-01T12:00:00.000Z",
        created_at: now(),
        updated_at: now(),
      },
      {
        task_id: 105,
        organization_id: ORGANIZATION_ID,
        task_code: "TASK-105",
        title: "Warehouse stock audit",
        description: "Audit warehouse stock accuracy and record missing inventory.",
        status: "Open",
        start_datetime: "2026-06-02T10:00:00.000Z",
        end_datetime: "2026-06-02T14:00:00.000Z",
        created_at: now(),
        updated_at: now(),
      },
      {
        task_id: 106,
        organization_id: ORGANIZATION_ID,
        task_code: "TASK-106",
        title: "Outlet closing checklist",
        description: "Prepare end-of-day checklist, verify counters, and close outlet operations.",
        status: "Open",
        start_datetime: "2026-06-01T14:00:00.000Z",
        end_datetime: "2026-06-01T17:00:00.000Z",
        created_at: now(),
        updated_at: now(),
      },
      {
        task_id: 107,
        organization_id: ORGANIZATION_ID,
        task_code: "TASK-107",
        title: "VIP customer escalation",
        description: "Resolve urgent customer escalation at the service counter.",
        status: "Open",
        start_datetime: "2026-06-03T09:00:00.000Z",
        end_datetime: "2026-06-03T12:00:00.000Z",
        created_at: now(),
        updated_at: now(),
      },
      {
        task_id: 108,
        organization_id: ORGANIZATION_ID,
        task_code: "TASK-108",
        title: "Flash inventory recount",
        description: "Run a fast recount for high-value stock before afternoon delivery.",
        status: "Open",
        start_datetime: "2026-06-02T08:30:00.000Z",
        end_datetime: "2026-06-02T11:30:00.000Z",
        created_at: now(),
        updated_at: now(),
      },
      {
        task_id: 109,
        organization_id: ORGANIZATION_ID,
        task_code: "TASK-109",
        title: "Back office admin cleanup",
        description: "Clear pending back-office paperwork with no fixed time window.",
        status: "Open",
        start_datetime: null,
        end_datetime: null,
        created_at: now(),
        updated_at: now(),
      },
      {
        task_id: 110,
        organization_id: ORGANIZATION_ID,
        task_code: "TASK-110",
        title: "Weekend promotion prep",
        description: "Prepare promotional displays for the weekend event.",
        status: "Open",
        start_datetime: "2026-06-07T10:00:00.000Z",
        end_datetime: "2026-06-07T13:00:00.000Z",
        created_at: now(),
        updated_at: now(),
      },
      {
        task_id: 111,
        organization_id: ORGANIZATION_ID,
        task_code: "TASK-111",
        title: "Midday stock transfer",
        description: "Transfer stock from warehouse to outlet during the midday window.",
        status: "Open",
        start_datetime: "2026-06-02T12:00:00.000Z",
        end_datetime: "2026-06-02T16:00:00.000Z",
        created_at: now(),
        updated_at: now(),
      },
      {
        task_id: 112,
        organization_id: ORGANIZATION_ID,
        task_code: "TASK-112",
        title: "Premium support booth",
        description: "Staff the premium support booth for customer onboarding.",
        status: "Open",
        start_datetime: "2026-06-01T10:00:00.000Z",
        end_datetime: "2026-06-01T13:00:00.000Z",
        created_at: now(),
        updated_at: now(),
      },
    ],
    task_skill: [
      { task_id: 101, skill_id: 1 },
      { task_id: 102, skill_id: 2 },
      { task_id: 104, skill_id: 1 },
      { task_id: 105, skill_id: 2 },
      { task_id: 106, skill_id: 1 },
      { task_id: 107, skill_id: 1 },
      { task_id: 108, skill_id: 2 },
      { task_id: 110, skill_id: 1 },
      { task_id: 111, skill_id: 2 },
      { task_id: 112, skill_id: 1 },
    ],
    task_qualification: [],
    task_assignment: [
      { assignment_id: 1, task_id: 103, user_id: "demo-employee", assigned_at: now(), status: "Assigned" },
      { assignment_id: 2, task_id: 103, user_id: "demo-employee-6", assigned_at: now(), status: "In Progress" },
    ],
    task_assignment_request: [
      { request_id: 1, task_id: 101, user_id: "demo-employee", requested_at: now(), status: "Pending" },
      { request_id: 2, task_id: 101, user_id: "demo-employee-4", requested_at: now(), status: "Pending" },
      { request_id: 3, task_id: 102, user_id: "demo-employee-10", requested_at: now(), status: "Pending" },
      { request_id: 4, task_id: 101, user_id: "demo-employee-7", requested_at: now(), status: "Rejected" },
    ],
    notification: [],
    activity_log: [
      { log_id: 1, user_id: "demo-manager", action: "User Feedback Submitted", details: JSON.stringify({ role: "Manager", name: "Manager", rating: 5, message: "The allocation board makes daily staffing clearer.", status: "Published" }), created_at: now() },
      { log_id: 2, user_id: "demo-employee", action: "User Feedback Submitted", details: JSON.stringify({ role: "Employee", name: "Employee", rating: 4, message: "Task requests and status updates are easy to follow.", status: "Pending" }), created_at: now() },
      { log_id: 3, user_id: null, action: "Contact Support Inquiry", details: JSON.stringify({ name: "Chen Wei", email: "chen@example.com", inquiryType: "Pricing", message: "Please share details about the paid automation plan.", status: "Open" }), created_at: now() },
      { log_id: 4, user_id: "demo-platformadmin", action: "Homepage Content Updated", details: JSON.stringify({ heroTitle: "Assign the right work to the right people.", announcement: "Smart allocation, availability checks, and task history in one workspace." }), created_at: now() },
      { log_id: 5, user_id: "demo-platformadmin", action: "Subscription Plan Saved", details: JSON.stringify({ name: "Basic", price: "$0", features: ["Manual task management", "Availability tracking", "Basic feedback"] }), created_at: now() },
      { log_id: 6, user_id: "demo-platformadmin", action: "Subscription Plan Saved", details: JSON.stringify({ name: "Smart Allocation", price: "$19 / month", features: ["Auto assignment", "Eligibility checking", "Allocation analytics"] }), created_at: now() },
    ],
  };
}

function demoDatabase() {
  if (!globalThis.__workflowPlusDemoDatabase) {
    globalThis.__workflowPlusDemoDatabase = seedDemoDatabase();
  }

  return globalThis.__workflowPlusDemoDatabase;
}

function nextId(rows, column) {
  return rows.reduce((max, row) => Math.max(max, Number(row[column]) || 0), 0) + 1;
}

function getPathValue(row, path) {
  return String(path)
    .split(".")
    .reduce((value, key) => (value == null ? value : value[key]), row);
}

function roleById(db, roleId) {
  return db.role.find((role) => Number(role.role_id) === Number(roleId)) ?? null;
}

function organizationById(db, organizationId) {
  return db.organization.find((organization) => organization.organization_id === organizationId) ?? null;
}

function userById(db, userId) {
  const account = db.user_account.find((user) => user.user_id === userId) ?? null;
  return account ? enrichRow(db, "user_account", account) : null;
}

function taskById(db, taskId) {
  return db.task.find((task) => Number(task.task_id) === Number(taskId)) ?? null;
}

function enrichRow(db, table, sourceRow) {
  const row = { ...sourceRow };

  if (table === "user_account") {
    row.role = roleById(db, row.role_id);
    row.organization = organizationById(db, row.organization_id);
  }

  if (table === "task_assignment" || table === "task_assignment_request") {
    row.user = userById(db, row.user_id);
    row.task = taskById(db, row.task_id);
  }

  return row;
}

class DemoQueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.orders = [];
    this.limitCount = null;
    this.operation = "select";
    this.payload = null;
  }

  select() {
    return this;
  }

  insert(payload) {
    this.operation = "insert";
    this.payload = payload;
    return this;
  }

  upsert(payload) {
    this.operation = "upsert";
    this.payload = payload;
    return this;
  }

  update(payload) {
    this.operation = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  eq(column, value) {
    this.filters.push((row) => String(getPathValue(row, column)) === String(value));
    return this;
  }

  neq(column, value) {
    this.filters.push((row) => String(getPathValue(row, column)) !== String(value));
    return this;
  }

  in(column, values) {
    const normalized = new Set((values ?? []).map(String));
    this.filters.push((row) => normalized.has(String(getPathValue(row, column))));
    return this;
  }

  ilike(column, value) {
    const needle = String(value ?? "").replaceAll("%", "").toLowerCase();
    this.filters.push((row) => String(getPathValue(row, column) ?? "").toLowerCase().includes(needle));
    return this;
  }

  order(column, options = {}) {
    this.orders.push({ column, ascending: options.ascending !== false });
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  async maybeSingle() {
    const result = await this.execute();
    return { data: result.data?.[0] ?? null, error: null };
  }

  async single() {
    const result = await this.execute();
    return { data: result.data?.[0] ?? null, error: null };
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  async execute() {
    const db = demoDatabase();
    const rows = db[this.table] ?? [];

    if (this.operation === "insert" || this.operation === "upsert") {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted = items.map((item) => {
        const row = { ...item };
        if (this.table === "role" && row.role_id == null) row.role_id = nextId(rows, "role_id");
        if (this.table === "organization" && row.organization_id == null) row.organization_id = `demo-org-${nextId(rows, "organization_id")}`;
        if (this.table === "user_account" && row.subscription_tier == null) row.subscription_tier = "Free";
        if (this.table === "profile" && row.profile_id == null) row.profile_id = `profile-${row.user_id ?? crypto.randomUUID()}`;
        if (this.table === "availability" && row.availability_id == null) row.availability_id = nextId(rows, "availability_id");
        if (this.table === "task" && row.task_id == null) row.task_id = nextId(rows, "task_id");
        if (this.table === "task_assignment" && row.assignment_id == null) row.assignment_id = nextId(rows, "assignment_id");
        if (this.table === "task_assignment_request" && row.request_id == null) row.request_id = nextId(rows, "request_id");
        if (this.table === "activity_log" && row.log_id == null) row.log_id = nextId(rows, "log_id");

        const conflictKey = this.table === "user_account" ? "user_id" : this.table === "profile" ? "user_id" : null;
        const existingIndex = conflictKey
          ? rows.findIndex((existing) => String(existing[conflictKey]) === String(row[conflictKey]))
          : -1;

        if (existingIndex >= 0 && this.operation === "upsert") {
          rows[existingIndex] = { ...rows[existingIndex], ...row, updated_at: row.updated_at ?? now() };
          return enrichRow(db, this.table, rows[existingIndex]);
        }

        rows.push(row);
        return enrichRow(db, this.table, row);
      });

      return { data: inserted, error: null };
    }

    let selected = rows.map((row) => enrichRow(db, this.table, row)).filter((row) => this.filters.every((filter) => filter(row)));

    if (this.operation === "update") {
      const selectedIds = new Set(selected.map((row) => JSON.stringify(row)));
      rows.forEach((row, index) => {
        const enriched = enrichRow(db, this.table, row);
        if (selectedIds.has(JSON.stringify(enriched))) {
          rows[index] = { ...row, ...this.payload, updated_at: this.payload.updated_at ?? row.updated_at ?? now() };
        }
      });
      selected = rows.map((row) => enrichRow(db, this.table, row)).filter((row) => this.filters.every((filter) => filter(row)));
    }

    if (this.operation === "delete") {
      const remaining = rows.filter((row) => {
        const enriched = enrichRow(db, this.table, row);
        return !this.filters.every((filter) => filter(enriched));
      });
      db[this.table] = remaining;
      selected = [];
    }

    this.orders.forEach(({ column, ascending }) => {
      selected.sort((left, right) => {
        const leftValue = getPathValue(left, column);
        const rightValue = getPathValue(right, column);
        return ascending
          ? String(leftValue ?? "").localeCompare(String(rightValue ?? ""))
          : String(rightValue ?? "").localeCompare(String(leftValue ?? ""));
      });
    });

    if (this.limitCount != null) {
      selected = selected.slice(0, this.limitCount);
    }

    return { data: selected, error: null };
  }
}

function userFromDemoToken(token) {
  const value = token?.startsWith("demo:") ? token.slice(5) : "manager@workflow.test";
  const db = demoDatabase();
  const account =
    db.user_account.find((user) => user.email === value) ??
    db.user_account.find((user) => user.user_id === value) ??
    db.user_account.find((user) => user.email === "manager@workflow.test");

  return {
    id: account.user_id,
    email: account.email,
    user_metadata: { username: account.username, role_id: account.role_id },
  };
}

export function createDemoSupabaseClient() {
  return {
    from(table) {
      return new DemoQueryBuilder(table);
    },
    auth: {
      async getUser(token) {
        return { data: { user: userFromDemoToken(token) }, error: null };
      },
      admin: {
        async createUser({ email, user_metadata: metadata = {} }) {
          const db = demoDatabase();
          const user = {
            id: `demo-user-${Date.now()}`,
            email,
            user_metadata: metadata,
          };
          db.user_account.push({
            user_id: user.id,
            role_id: Number(metadata.role_id) || 4,
            organization_id: ORGANIZATION_ID,
            username: metadata.username || email.split("@")[0],
            email,
            account_status: "Active",
            subscription_tier: metadata.subscription_tier || "Free",
          });
          return { data: { user }, error: null };
        },
        async inviteUserByEmail(email, { data = {} } = {}) {
          const user = {
            id: `demo-invite-${Date.now()}`,
            email,
            user_metadata: data,
          };
          return { data: { user }, error: null };
        },
        async deleteUser(userId) {
          const db = demoDatabase();
          db.user_account = db.user_account.filter((user) => user.user_id !== userId);
          return { error: null };
        },
      },
    },
  };
}
