"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const emptyForm = {
  organizationName: "",
  organizationCode: "",
  organizationEmail: "",
  organizationType: "",
  logoUrl: "",
  departments: [""],
};

function initialFromName(name) {
  return (name || "User").trim().charAt(0).toUpperCase() || "U";
}

function displayName(account) {
  return account.full_name || account.username || account.email || "User";
}

function fieldClass() {
  return "h-10 rounded-full border border-black/60 bg-white/40 px-4 text-sm text-[#061a40] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20";
}

function AccountAvatar({ account, size = "h-10 w-10", textSize = "text-sm" }) {
  const name = displayName(account);

  return (
    <span
      className={`relative flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#6b7280] ${textSize} font-bold text-white`}
    >
      {account.profile_picture_url ? (
        <Image
          src={account.profile_picture_url}
          alt={`${name} profile`}
          fill
          sizes="48px"
          className="object-cover"
        />
      ) : (
        initialFromName(name)
      )}
    </span>
  );
}

export default function UserAdminOrganizationBuilder() {
  const [organization, setOrganization] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggingUserId, setDraggingUserId] = useState("");
  const [error, setError] = useState("");

  const accountsByDepartment = useMemo(() => {
    const grouped = new Map();

    departments.forEach((department) => {
      grouped.set(department.department_id, []);
    });

    accounts.forEach((account) => {
      if (grouped.has(account.department_id)) {
        grouped.get(account.department_id).push(account);
      }
    });

    return grouped;
  }, [accounts, departments]);

  async function authHeaders() {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();

    return {
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
    };
  }

  function applyPayload(payload) {
    setOrganization(payload.organization ?? null);
    setDepartments(payload.departments ?? []);
    setAccounts(payload.accounts ?? []);
  }

  async function loadOrganization() {
    setError("");

    try {
      const response = await fetch("/api/my-organization", {
        headers: await authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load organization.");
      }

      applyPayload(result);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(loadOrganization, 0);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateDepartment(index, value) {
    setForm((current) => ({
      ...current,
      departments: current.departments.map((department, departmentIndex) =>
        departmentIndex === index ? value : department
      ),
    }));
  }

  function addDepartmentField() {
    setForm((current) => ({
      ...current,
      departments: [...current.departments, ""],
    }));
  }

  function openOrganizationEditor() {
    setForm({
      organizationName: organization?.organization_name ?? "",
      organizationCode: organization?.organization_code ?? "",
      organizationEmail: organization?.organization_email ?? "",
      organizationType: organization?.organization_type ?? "",
      logoUrl: organization?.logo_url ?? "",
      departments: departments.length
        ? [...departments.map((department) => department.department_name), ""]
        : [""],
    });
    setIsSetupOpen(true);
  }

  function removeDepartmentField(index) {
    setForm((current) => ({
      ...current,
      departments:
        current.departments.length === 1
          ? [""]
          : current.departments.filter((_, departmentIndex) => departmentIndex !== index),
    }));
  }

  async function submitOrganization(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/my-organization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify(form),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not save organization.");
      }

      applyPayload(result);
      setIsSetupOpen(false);
      setForm(emptyForm);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function assignAccountToDepartment(userId, departmentId) {
    if (!organization) {
      return;
    }

    setError("");

    try {
      const response = await fetch("/api/my-organization", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          action: "assignDepartment",
          userId,
          departmentId,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not assign department.");
      }

      applyPayload(result);
    } catch (assignError) {
      setError(assignError.message);
    } finally {
      setDraggingUserId("");
    }
  }

  function handleDrop(event, departmentId) {
    event.preventDefault();
    const userId = event.dataTransfer.getData("text/plain") || draggingUserId;

    if (userId) {
      assignAccountToDepartment(userId, departmentId);
    }
  }

  return (
    <div
      className={`grid h-full min-h-0 overflow-hidden rounded-2xl transition-[grid-template-columns] ${
        isSidebarCollapsed
          ? "lg:grid-cols-[40px_minmax(0,1fr)]"
          : "lg:grid-cols-[300px_minmax(0,1fr)]"
      }`}
    >
      <aside className="relative overflow-visible border-r border-white/40 px-3 py-4">
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((current) => !current)}
          className="absolute right-1.5 top-6.5 flex items-center justify-center font-bold text-[#1E293B] hover:text-[#1E40AF]"
          aria-label={isSidebarCollapsed ? "Expand users menu" : "Collapse users menu"}
          title={isSidebarCollapsed ? "Expand users menu" : "Collapse users menu"}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "26px" }}
            aria-hidden="true"
          >
            {isSidebarCollapsed ? "left_panel_open" : "left_panel_close"}
          </span>
        </button>

        {isSidebarCollapsed ? (
          <div className="flex h-full flex-col items-center pt-20 text-[#07183b]">
            <span className="rotate-90 whitespace-nowrap text-md font-semibold tracking-widest">
              Users
            </span>
          </div>
        ) : (
          <>
            <h2 className="pt-2 text-lg font-medium text-[#0D1E4C]">Users</h2>

            <div className="mt-6 space-y-3 overflow-y-auto pr-1">
              {accounts.map((account) => (
                <button
                  key={account.user_id}
                  type="button"
                  draggable
                  onClick={() => setSelectedAccount(account)}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", account.user_id);
                    event.dataTransfer.effectAllowed = "move";
                    setDraggingUserId(account.user_id);
                  }}
                  onDragEnd={() => setDraggingUserId("")}
                  className={`flex h-12 w-full items-center gap-3 rounded-full bg-white px-2.5 text-left text-sm font-semibold text-[#0f172a] shadow-sm transition hover:bg-[#eef6ff] ${
                    draggingUserId === account.user_id ? "opacity-50" : ""
                  }`}
                >
                  <AccountAvatar account={account} size="h-9 w-9" textSize="text-xs" />
                  <span className="min-w-0 truncate">{displayName(account)}</span>
                </button>
              ))}

              {!accounts.length && !isLoading ? (
                <p className="rounded-md border border-dashed border-white/80 px-3 py-4 text-sm text-[#667085]">
                  No accounts found.
                </p>
              ) : null}
            </div>
          </>
        )}
      </aside>

      <section className="flex min-h-0 min-w-0 flex-col">
        {error ? (
          <p className="mx-6 mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <div className="min-h-0 flex-1 overflow-auto px-6 py-6">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm font-semibold text-[#52627a]">
              Loading organization...
            </div>
          ) : organization ? (
            <OrganizationChart
              accountsByDepartment={accountsByDepartment}
              departments={departments}
              organization={organization}
              onAccountClick={setSelectedAccount}
              onEditOrganization={openOrganizationEditor}
              onDrop={handleDrop}
            />
          ) : (
            <div className="flex h-full min-h-[520px] items-center justify-center rounded-[32px] bg-[#fffafa]">
              <div className="text-center">
                <h1 className="text-4xl font-medium text-black">Organization</h1>
                <button
                  type="button"
                  onClick={() => setIsSetupOpen(true)}
                  className="mt-8 rounded-full bg-black/10 px-6 py-2 text-sm font-semibold text-black transition hover:bg-black/15"
                >
                  Set up
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {isSetupOpen ? (
        <OrganizationSetupModal
          form={form}
          isEditing={Boolean(organization)}
          isSubmitting={isSubmitting}
          onAddDepartment={addDepartmentField}
          onClose={() => setIsSetupOpen(false)}
          onRemoveDepartment={removeDepartmentField}
          onSubmit={submitOrganization}
          onUpdateDepartment={updateDepartment}
          onUpdateForm={updateForm}
        />
      ) : null}

      {selectedAccount ? (
        <AccountDetailModal
          account={selectedAccount}
          onClose={() => setSelectedAccount(null)}
        />
      ) : null}
    </div>
  );
}

function OrganizationChart({
  accountsByDepartment,
  departments,
  organization,
  onAccountClick,
  onEditOrganization,
  onDrop,
}) {
  return (
    <div className="min-h-full rounded-[32px] px-8 py-8">
      <div className="text-center">
        <button
          type="button"
          onClick={onEditOrganization}
          className="inline-flex items-center gap-2 rounded-md px-2 text-4xl font-semibold text-black transition hover:bg-[#e8f3ff]"
        >
          {organization.organization_name}
          <span className="text-2xl text-[#667085]">⌄</span>
        </button>
        <p className="mt-2 text-sm text-[#667085]">
          Drag users into a department to update their organization placement.
        </p>
      </div>

      {departments.length ? (
        <div className="mt-10 flex min-w-max gap-4 overflow-x-auto pb-4">
          {departments.map((department) => {
            const departmentAccounts =
              accountsByDepartment.get(department.department_id) ?? [];

            return (
              <section
                key={department.department_id}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => onDrop(event, department.department_id)}
                className="flex min-h-[440px] w-64 shrink-0 flex-col rounded-[24px] border-t border-white/60 bg-gradient-to-b from-[#d8efff] via-[#f8fcff] via-white to-white shadow-xs"
              >
                <div className="px-4 py-4 text-center">
                  <h2 className="truncate text-lg font-bold text-[#061a40]">
                    {department.department_name}
                  </h2>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  {departmentAccounts.map((account) => (
                    <button
                      key={account.user_id}
                      type="button"
                      onClick={() => onAccountClick(account)}
                      className="flex items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-3 py-3 text-left shadow-sm transition hover:border-[#93C5FD] hover:bg-[#f8fbff]"
                    >
                      <AccountAvatar account={account} size="h-10 w-10" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-[#1f2937]">
                          {displayName(account)}
                        </span>
                        <span className="block truncate text-xs text-[#667085]">
                          {account.role?.role_name ?? "User"}
                        </span>
                      </span>
                    </button>
                  ))}

                  
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-[#bfd0e8] px-6 py-12 text-center text-sm font-medium text-[#667085]">
          No departments yet. Add departments by updating your organization setup.
        </div>
      )}
    </div>
  );
}

function OrganizationSetupModal({
  form,
  isEditing,
  isSubmitting,
  onAddDepartment,
  onClose,
  onRemoveDepartment,
  onSubmit,
  onUpdateDepartment,
  onUpdateForm,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-xl rounded-[36px] bg-[#d9d9d9] px-10 py-8 shadow-2xl"
      >
        <h2 className="text-center text-xl font-medium text-black">
          {isEditing ? "Edit your organization" : "Set up your organization"}
        </h2>

        <div className="mt-6 grid grid-cols-[1fr_110px] gap-2">
          <input
            value={form.organizationName}
            onChange={(event) => onUpdateForm("organizationName", event.target.value)}
            placeholder="Name"
            required
            className={fieldClass()}
          />
          <input
            value={form.organizationCode}
            onChange={(event) => onUpdateForm("organizationCode", event.target.value)}
            placeholder="Code"
            className={fieldClass()}
          />
        </div>

        <input
          value={form.organizationEmail}
          onChange={(event) => onUpdateForm("organizationEmail", event.target.value)}
          placeholder="Email optional"
          type="email"
          className={`mt-3 w-full ${fieldClass()}`}
        />

        <input
          value={form.organizationType}
          onChange={(event) => onUpdateForm("organizationType", event.target.value)}
          placeholder="Industry"
          className={`mt-3 w-full ${fieldClass()}`}
        />

        <input
          value={form.logoUrl}
          onChange={(event) => onUpdateForm("logoUrl", event.target.value)}
          placeholder="Logo URL optional"
          className={`mt-3 w-full ${fieldClass()}`}
        />

        <div className="mt-3 space-y-2">
          {form.departments.map((department, index) => (
            <div key={`department-${index}`} className="flex gap-2">
              <input
                value={department}
                onChange={(event) => onUpdateDepartment(index, event.target.value)}
                placeholder="Department optional"
                className={`min-w-0 flex-1 ${fieldClass()}`}
              />
              <button
                type="button"
                onClick={() => onRemoveDepartment(index)}
                className="h-10 w-10 rounded-full bg-white text-lg font-bold text-[#061a40] hover:bg-[#eef6ff]"
                aria-label="Remove department"
              >
                -
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onAddDepartment}
            className="h-10 rounded-full bg-white px-4 text-xl font-bold text-[#061a40] hover:bg-[#eef6ff]"
            aria-label="Add department"
          >
            +
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-full bg-white/60 px-5 text-sm font-bold text-[#061a40] hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-full bg-[#2563EB] px-5 text-sm font-bold text-white hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function AccountDetailModal({ account, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4">
      <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <AccountAvatar account={account} size="h-16 w-16" textSize="text-xl" />
            <div>
              <h2 className="text-2xl font-bold text-[#061a40]">{displayName(account)}</h2>
              <p className="text-sm text-[#667085]">{account.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-xl font-bold text-[#667085] hover:bg-[#eef6ff]"
            aria-label="Close profile"
          >
            x
          </button>
        </div>

        <dl className="mt-6 grid gap-4 text-sm">
          <div>
            <dt className="font-bold uppercase tracking-wide text-[#667085]">Role</dt>
            <dd className="mt-1 text-[#061a40]">{account.role?.role_name ?? "User"}</dd>
          </div>
          <div>
            <dt className="font-bold uppercase tracking-wide text-[#667085]">Department</dt>
            <dd className="mt-1 text-[#061a40]">
              {account.department?.department_name ?? "Unassigned"}
            </dd>
          </div>
          <div>
            <dt className="font-bold uppercase tracking-wide text-[#667085]">Status</dt>
            <dd className="mt-1 text-[#061a40]">
              {account.account_status ?? "Unknown"}
            </dd>
          </div>
          {account.bio ? (
            <div>
              <dt className="font-bold uppercase tracking-wide text-[#667085]">Bio</dt>
              <dd className="mt-1 text-[#061a40]">{account.bio}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </div>
  );
}
