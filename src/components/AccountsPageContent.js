"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SignUpForm from "@/components/SignUpForm";
import { getAuthHeaders } from "@/lib/clientAuth";

function AccountAvatar() {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#C7DDEB] text-[#0D1E4C]">
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="7" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    </div>
  );
}

function StatusBadge({ status, className = "" }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        status === "Suspended" ? "bg-[#FEE4E2] text-[#B42318]" : "bg-[#D1FADF] text-[#05603A]"
      } ${className}`}
    >
      {status}
    </span>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#22C55E] text-white shadow">
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

export default function AccountsPageContent() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState([]);
  const [isDeptOpen, setIsDeptOpen] = useState(false);

  function toggleDepartment(department) {
    setDepartmentFilter((current) =>
      current.includes(department)
        ? current.filter((item) => item !== department)
        : [...current, department],
    );
  }

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  async function toggleStatus(account) {
    const nextStatus = account.account_status === "Suspended" ? "Active" : "Suspended";
    setError("");

    try {
      const response = await fetch("/api/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ userId: account.user_id, accountStatus: nextStatus }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update account.");
      }

      setSelected((current) =>
        current?.user_id === account.user_id ? { ...current, account_status: nextStatus } : current,
      );
      await loadAccounts();
    } catch (toggleError) {
      setError(toggleError.message);
    }
  }

  async function authHeaders() {
    return getAuthHeaders();
  }

  async function loadAccounts() {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/accounts", {
        headers: await authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load accounts.");
      }

      setAccounts(result.accounts);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadAccounts();
    }, 0);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const departmentOptions = useMemo(() => {
    const names = new Set();
    for (const account of accounts) {
      names.add(account.department?.department_name ?? "No department");
    }
    return Array.from(names).sort();
  }, [accounts]);

  // Accounts after search + department filters (but before the status filter),
  // so the status pill counts reflect the other active filters.
  const searchAndDeptFiltered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return accounts.filter((account) => {
      const searchable = `${account.full_name ?? ""} ${account.username} ${account.email} ${account.role?.role_name ?? ""} ${account.department?.department_name ?? ""}`;
      if (!searchable.toLowerCase().includes(normalizedSearch)) return false;

      if (departmentFilter.length) {
        const department = account.department?.department_name ?? "No department";
        if (!departmentFilter.includes(department)) return false;
      }

      return true;
    });
  }, [accounts, search, departmentFilter]);

  const statusCounts = useMemo(() => {
    const counts = { All: searchAndDeptFiltered.length, Active: 0, Suspended: 0, Pending: 0 };
    for (const account of searchAndDeptFiltered) {
      if (account.account_status in counts) counts[account.account_status] += 1;
    }
    return counts;
  }, [searchAndDeptFiltered]);

  const groupedAccounts = useMemo(() => {
    const filtered =
      statusFilter === "All"
        ? searchAndDeptFiltered
        : searchAndDeptFiltered.filter((account) => account.account_status === statusFilter);

    return filtered.reduce((groups, account) => {
      const roleName = account.role?.role_name ?? "Unassigned";
      groups[roleName] = [...(groups[roleName] ?? []), account];
      return groups;
    }, {});
  }, [searchAndDeptFiltered, statusFilter]);

  function renderDetailCard() {
    if (!selected) return null;

    const isActive = selected.account_status !== "Suspended";

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={selected.user_id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="overflow-hidden rounded-[28px] border border-white/60 bg-white/25 shadow-[0_30px_70px_rgba(13,30,76,0.25)] backdrop-blur-xl"
        >
          <div className="relative h-[520px] w-full">
            {selected.profile_picture_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.profile_picture_url}
                alt={selected.full_name || selected.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-white/30 to-[#8fa9c8]/30 text-white/80">
                <svg className="h-32 w-32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="12" cy="8" r="4.5" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close account details"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-xl font-bold text-white backdrop-blur-sm transition hover:bg-black/45"
            >
              ×
            </button>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/85 to-transparent px-6 pb-6 pt-20 backdrop-blur-[1px]">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-3xl font-extrabold text-[#0B1B32]">
                  {selected.full_name || selected.username}
                </h3>
                {isActive ? <VerifiedBadge /> : null}
              </div>
              <p className="mt-1 text-base text-[#64748B]">@{selected.username}</p>
              <p className="text-base font-medium text-[#475569]">
                {selected.department?.department_name ?? "No department"}
              </p>

              <div className="mt-4 flex items-center justify-between gap-3">
                <StatusBadge status={selected.account_status} />
                <button
                  type="button"
                  onClick={() => toggleStatus(selected)}
                  className={`rounded-full border bg-white px-6 py-2.5 text-sm font-bold shadow-sm transition hover:shadow ${
                    isActive ? "border-[#FECDCA] text-[#B42318]" : "border-[#A6F4C5] text-[#05603A]"
                  }`}
                >
                  {isActive ? "Suspend" : "Activate"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search profile"
          className="h-11 flex-1 rounded-full border border-[#C7DDEB] bg-white px-6 text-base text-[#0B1B32] shadow-sm outline-none placeholder:text-[#64748B] focus:border-[#83A6CE] focus:ring-2 focus:ring-[#83A6CE]/25"
        />
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="h-12 rounded-full bg-[#0a2a66] px-6 text-sm font-bold text-white transition-colors hover:bg-[#061a40]"
        >
          Add Account
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {["All", "Active", "Suspended", "Pending"].map((status) => {
          const active = statusFilter === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                active
                  ? "border-[#0D1E4C] bg-[#0D1E4C] text-white"
                  : "border-white/60 bg-white/40 text-[#0A2540] hover:bg-white/60"
              }`}
            >
              {status}
              <span
                className={`min-w-5 rounded-full px-1.5 text-center text-xs font-bold ${
                  active ? "bg-white/25 text-white" : "bg-[#0D1E4C]/10 text-[#0D1E4C]"
                }`}
              >
                {statusCounts[status]}
              </span>
            </button>
          );
        })}

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDeptOpen((open) => !open)}
            aria-expanded={isDeptOpen}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              departmentFilter.length
                ? "border-[#0D1E4C] bg-white/60 text-[#0A2540]"
                : "border-white/60 bg-white/40 text-[#0A2540] hover:bg-white/60"
            }`}
          >
            Department
            {departmentFilter.length ? (
              <span className="min-w-5 rounded-full bg-[#0D1E4C] px-1.5 text-center text-xs font-bold text-white">
                {departmentFilter.length}
              </span>
            ) : null}
            <svg
              className={`h-4 w-4 transition-transform ${isDeptOpen ? "rotate-180" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {isDeptOpen ? (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsDeptOpen(false)} />
              <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-2xl border border-white/60 bg-white/85 p-2 shadow-[0_20px_50px_rgba(13,30,76,0.2)] backdrop-blur-xl">
                <div className="max-h-60 overflow-y-auto">
                  {departmentOptions.length ? (
                    departmentOptions.map((department) => {
                      const checked = departmentFilter.includes(department);
                      return (
                        <label
                          key={department}
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[#0B1B32] hover:bg-white/70"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleDepartment(department)}
                            className="h-4 w-4 accent-[#0D1E4C]"
                          />
                          <span className="min-w-0 truncate">{department}</span>
                        </label>
                      );
                    })
                  ) : (
                    <p className="px-2 py-2 text-xs text-[#94a3b8]">No departments</p>
                  )}
                </div>
                {departmentFilter.length ? (
                  <button
                    type="button"
                    onClick={() => setDepartmentFilter([])}
                    className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-[#64748B] hover:bg-white/70"
                  >
                    Clear selection
                  </button>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      {isLoading ? <p className="text-sm text-[#52627a]">Loading accounts...</p> : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          {Object.entries(groupedAccounts).map(([roleName, roleAccounts]) => (
            <section key={roleName} className="space-y-2">
              <h2 className="text-lg font-bold text-[#07183b]">{roleName}</h2>
              <div className="flex gap-2 overflow-x-auto pb-2">
            {roleAccounts.map((account) => {
              const isSelected = selected?.user_id === account.user_id;

              return (
                <article
                  key={account.user_id}
                  onClick={() =>
                    setSelected((current) =>
                      current?.user_id === account.user_id ? null : account,
                    )
                  }
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelected((current) =>
                        current?.user_id === account.user_id ? null : account,
                      );
                    }
                  }}
                  className={`flex w-[230px] shrink-0 cursor-pointer items-center gap-3 rounded-full border p-3 shadow-sm backdrop-blur-md transition ${
                    isSelected
                      ? "border-[#0D1E4C] bg-white/60 ring-2 ring-[#0D1E4C]/30"
                      : "border-white/60 bg-white/35 hover:bg-white/55"
                  }`}
                >
                  <AccountAvatar />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-[#0B1B32]">
                      {account.full_name || account.username}
                    </h3>
                    <p className="truncate text-xs text-[#64748B]">
                      {account.department?.department_name ?? "No department"}
                    </p>
                    <StatusBadge status={account.account_status} className="mt-1.5" />
                  </div>
                </article>
              );
            })}
              </div>
            </section>
          ))}
        </div>

        {selected ? (
          <div className="w-full shrink-0 lg:w-[380px]">
            <div className="lg:sticky lg:top-2">{renderDetailCard()}</div>
          </div>
        ) : null}
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07183b]/40 p-4">
          <div className="relative w-full max-w-md">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="absolute -right-2 -top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold text-[#07183b] shadow"
              aria-label="Close sign up form"
            >
              x
            </button>
            <SignUpForm
              onSuccess={() => {
                setIsFormOpen(false);
                loadAccounts();
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
