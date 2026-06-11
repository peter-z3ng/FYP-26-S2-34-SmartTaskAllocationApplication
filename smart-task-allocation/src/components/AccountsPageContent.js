"use client";

import { useEffect, useMemo, useState } from "react";
import SignUpForm from "@/components/SignUpForm";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

function AccountAvatar() {
  return (
    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#C7DDEB] text-[#0D1E4C]">
      <svg
        className="h-12 w-12"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <circle cx="12" cy="7" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    </div>
  );
}

export default function AccountsPageContent() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  async function authHeaders() {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    return {
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
    };
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

  const groupedAccounts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = accounts.filter((account) => {
      const searchable = `${account.username} ${account.email} ${account.role?.role_name ?? ""}`;
      return searchable.toLowerCase().includes(normalizedSearch);
    });

    return filtered.reduce((groups, account) => {
      const roleName = account.role?.role_name ?? "Unassigned";
      groups[roleName] = [...(groups[roleName] ?? []), account];
      return groups;
    }, {});
  }, [accounts, search]);

  async function updateAccount(account) {
    const username = window.prompt("Username", account.username);
    const email = window.prompt("Email", account.email);

    if (!username || !email) {
      return;
    }

    await saveAccount({
      userId: account.user_id,
      username,
      email,
    });
  }

  async function toggleSuspend(account) {
    const nextStatus = account.account_status === "Suspended" ? "Active" : "Suspended";
    await saveAccount({
      userId: account.user_id,
      accountStatus: nextStatus,
    });
  }

  async function saveAccount(payload) {
    setError("");

    try {
      const response = await fetch("/api/accounts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update account.");
      }

      await loadAccounts();
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  async function deleteAccount(account) {
    const confirmed = window.confirm(`Delete ${account.username}? This cannot be undone.`);

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      const response = await fetch(`/api/accounts?userId=${account.user_id}`, {
        method: "DELETE",
        headers: await authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not delete account.");
      }

      await loadAccounts();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search profile"
          className="h-14 flex-1 rounded-full border border-[#C7DDEB] bg-white px-8 text-lg text-[#0B1B32] shadow-sm outline-none placeholder:text-[#64748B] focus:border-[#83A6CE] focus:ring-2 focus:ring-[#83A6CE]/25"
        />
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="h-12 rounded-full bg-[#0a2a66] px-6 text-sm font-bold text-white transition-colors hover:bg-[#061a40]"
        >
          Add Account
        </button>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      {isLoading ? <p className="text-sm text-[#52627a]">Loading accounts...</p> : null}

      {Object.entries(groupedAccounts).map(([roleName, roleAccounts]) => (
        <section key={roleName} className="space-y-3">
          <h2 className="text-2xl font-bold text-[#07183b]">{roleName}</h2>
          <div className="grid grid-cols-[repeat(auto-fill,280px)] justify-start gap-3">
            {roleAccounts.map((account) => (
              <article
                key={account.user_id}
                className="w-full max-w-[280px] rounded-[24px] border border-white/60 bg-white/35 p-5 text-center shadow-sm backdrop-blur-md"
              >
                <span
                  className={`inline-flex rounded-lg px-4 py-2 text-sm font-black uppercase tracking-widest ${
                    account.account_status === "Suspended"
                      ? "bg-[#BBE1FA] text-[#0A2540]"
                      : "bg-[#C7DDEB] text-[#0D1E4C]"
                  }`}
                >
                  {account.account_status}
                </span>
                <div className="mt-6">
                  <AccountAvatar />
                </div>
                <h3 className="mt-5 text-xl font-black text-[#0B1B32]">{account.username}</h3>
                <p className="mt-2 text-sm text-[#64748B]">{account.email}</p>
                <p className="mt-1 text-sm text-[#64748B]">
                  {account.organization?.organization_name ?? "No organization"}
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateAccount(account)}
                    className="rounded-full border border-[#83A6CE] bg-white/60 px-5 py-2 text-sm font-bold text-[#0A2540] hover:bg-white"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSuspend(account)}
                    className="rounded-full bg-[#0D1E4C] px-7 py-3 text-sm font-bold text-white hover:bg-[#0B1B32]"
                  >
                    {account.account_status === "Suspended" ? "Activate" : "Suspend"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => deleteAccount(account)}
                  className="mt-5 text-sm font-semibold text-[#0A2540] hover:text-[#0B1B32] hover:underline"
                >
                  Delete
                </button>
              </article>
            ))}
          </div>
        </section>
      ))}

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
