"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import SignUpForm from "@/components/SignUpForm";
import UserTierBadge, { nextUserTier, normalizeUserTier } from "@/components/UserTierBadge";
import { getAuthHeaders } from "@/lib/clientAuth";
import { getDefaultAvatarUrl } from "@/lib/defaultAvatars";

// Account cards share this avatar with the detail dialog so uploaded photos stay consistent.
function AccountAvatar({ account, profilePictureUrl, isInline = false }) {
  const isSuspended = account?.account_status === "Suspended";
  const avatarUrl = profilePictureUrl || getDefaultAvatarUrl(account);

  return (
    <div className={`account-avatar-wrap ${isInline ? "is-inline" : ""}`}>
      <span className={`account-avatar-ring ${isSuspended ? "is-suspended" : ""}`} />
      <div className="account-avatar-core">
        <Image
          src={avatarUrl}
          alt=""
          fill
          sizes="80px"
          unoptimized
          className="account-avatar-image"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
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
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Not recorded";
  return new Date(value).toLocaleString();
}

function statusClasses(status) {
  return status === "Suspended"
    ? "bg-[#BBE1FA] text-[#0A2540]"
    : "bg-[#C7DDEB] text-[#0D1E4C]";
}

function AccountStat({ stat, index }) {
  return (
    <section className="account-summary-card" style={{ "--card-delay": `${index * 80}ms` }}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-100">{stat.label}</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <span className="text-4xl font-black text-white">{stat.value}</span>
        <span className="text-right text-xs font-bold uppercase tracking-[0.12em] text-teal-100/85">{stat.detail}</span>
      </div>
    </section>
  );
}

export default function AccountsPageContent() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

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
      setSelectedAccount((current) =>
        current ? result.accounts.find((account) => account.user_id === current.user_id) ?? null : null,
      );
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

  useEffect(() => {
    if (!selectedAccount) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") {
        setSelectedAccount(null);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedAccount]);

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

  const groupedEntries = useMemo(() => Object.entries(groupedAccounts), [groupedAccounts]);

  const visibleAccountCount = useMemo(
    () => groupedEntries.reduce((count, [, roleAccounts]) => count + roleAccounts.length, 0),
    [groupedEntries],
  );

  const accountStats = useMemo(() => {
    const activeCount = accounts.filter((account) => account.account_status !== "Suspended").length;
    const suspendedCount = accounts.filter((account) => account.account_status === "Suspended").length;
    const paidCount = accounts.filter((account) => normalizeUserTier(account.subscription_tier) === "Paid").length;
    const freeCount = accounts.filter((account) => normalizeUserTier(account.subscription_tier) === "Free").length;

    return [
      { label: "Visible", value: visibleAccountCount, detail: "matching search" },
      { label: "Active", value: activeCount, detail: "ready to assign" },
      { label: "Paid Pro", value: paidCount, detail: "premium users" },
      { label: "Free", value: freeCount, detail: `${suspendedCount} suspended` },
    ];
  }, [accounts, visibleAccountCount]);

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

  async function toggleSubscriptionTier(account) {
    await saveAccount({
      userId: account.user_id,
      subscriptionTier: nextUserTier(account.subscription_tier),
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
      <div className="account-command-bar flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search profile"
          className="account-search h-14 flex-1 rounded-full border border-[#C7DDEB] bg-white px-8 text-lg text-[#0B1B32] shadow-sm outline-none placeholder:text-[#64748B] focus:border-[#83A6CE] focus:ring-2 focus:ring-[#83A6CE]/25"
        />
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="account-primary-action h-12 rounded-full bg-[#0a2a66] px-6 text-sm font-bold text-white transition-colors hover:bg-[#061a40]"
        >
          Add Account
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {accountStats.map((stat, index) => (
          <AccountStat key={stat.label} stat={stat} index={index} />
        ))}
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      {isLoading ? <p className="text-sm text-[#52627a]">Loading accounts...</p> : null}

      {groupedEntries.length === 0 && !isLoading ? (
        <p className="rounded-3xl border border-dashed border-teal-200 bg-white/75 p-6 text-sm font-bold text-slate-600">
          No accounts match the current search.
        </p>
      ) : null}

      {groupedEntries.map(([roleName, roleAccounts], sectionIndex) => (
        <section
          key={roleName}
          className="account-role-section space-y-4"
          style={{ "--section-delay": `${sectionIndex * 80}ms` }}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="dashboard-eyebrow">Role group</p>
              <h2 className="text-2xl font-black text-white">{roleName}</h2>
            </div>
            <span className="rounded-full border border-teal-200 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-teal-800">
              {roleAccounts.length} accounts
            </span>
          </div>
          <div className="account-grid-panel grid grid-cols-[repeat(auto-fill,280px)] justify-start gap-3">
            {roleAccounts.map((account, cardIndex) => (
              <article
                key={account.user_id}
                data-testid={`account-card-${account.user_id}`}
                onClick={() => setSelectedAccount(account)}
                className={`account-card group w-full max-w-[280px] cursor-pointer rounded-[24px] p-5 text-center outline-none ${
                  account.account_status === "Suspended" ? "is-suspended" : "is-active"
                }`}
                style={{ "--card-delay": `${sectionIndex * 100 + cardIndex * 70}ms` }}
              >
                <span
                  className={`account-status-badge ${account.account_status === "Suspended" ? "is-suspended" : "is-active"}`}
                >
                  {account.account_status}
                </span>
                <div className="mt-3 flex justify-center">
                  <UserTierBadge tier={account.subscription_tier} size="sm" />
                </div>
                <div className="mt-6">
                  <AccountAvatar
                    account={account}
                    profilePictureUrl={account.profile?.profile_picture_url}
                  />
                </div>
                <h3 className="mt-5 text-xl font-black text-[#0B1B32]">{account.username}</h3>
                <p className="mt-2 text-sm text-[#64748B]">{account.email}</p>
                <p className="mt-1 text-sm text-[#64748B]">
                  {account.organization?.organization_name ?? "No organization"}
                </p>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedAccount(account);
                  }}
                  className="account-detail-button mt-4 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em]"
                >
                  View details
                </button>
                <div className="mt-5 flex flex-col items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      updateAccount(account);
                    }}
                    className="account-ghost-action rounded-full px-5 py-2 text-sm font-bold"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleSuspend(account);
                    }}
                    className="account-main-action rounded-full px-7 py-3 text-sm font-bold text-white"
                  >
                    {account.account_status === "Suspended" ? "Activate" : "Suspend"}
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleSubscriptionTier(account);
                    }}
                    className="account-tier-action rounded-full px-5 py-2 text-xs font-black uppercase tracking-[0.14em]"
                  >
                    {normalizeUserTier(account.subscription_tier) === "Paid" ? "Set Free" : "Set Paid"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteAccount(account);
                  }}
                  className="account-delete-action mt-5 text-sm font-semibold"
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

      <AccountDetailDialog
        account={selectedAccount}
        onClose={() => setSelectedAccount(null)}
        onUpdate={updateAccount}
        onToggleSuspend={toggleSuspend}
        onToggleSubscriptionTier={toggleSubscriptionTier}
        onDelete={deleteAccount}
      />
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-teal-200">{label}</p>
      <p className="mt-2 break-words text-sm font-bold leading-6 text-white">{value || "Not provided"}</p>
    </div>
  );
}

function AccountDetailDialog({ account, onClose, onUpdate, onToggleSuspend, onToggleSubscriptionTier, onDelete }) {
  if (!account) return null;

  const profile = account.profile ?? {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" data-testid="account-detail-dialog">
      <button
        type="button"
        aria-label="Close account detail"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-detail-title"
        className="relative max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/20 bg-slate-950/95 text-white shadow-2xl"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(94,234,212,0.24),transparent_28rem),radial-gradient(circle_at_86%_20%,rgba(125,211,252,0.16),transparent_26rem)]" />
        <div className="relative flex flex-col gap-5 border-b border-white/10 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <AccountAvatar
              account={account}
              profilePictureUrl={profile.profile_picture_url}
              isInline
            />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-200">User account details</p>
              <h2 id="account-detail-title" className="mt-2 text-3xl font-black tracking-tight text-white">
                {account.username}
              </h2>
              <p className="mt-2 text-sm font-bold text-slate-300">{account.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-teal-300/35"
          >
            Close
          </button>
        </div>

        <div className="relative max-h-[62vh] overflow-y-auto p-6">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${statusClasses(account.account_status)}`}>
              {account.account_status}
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-teal-100">
              {account.role?.role_name ?? "Unassigned role"}
            </span>
            <UserTierBadge tier={account.subscription_tier} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <DetailItem label="Full name" value={profile.full_name || account.username} />
            <DetailItem label="Email" value={account.email} />
            <DetailItem label="Phone" value={profile.phone_number} />
            <DetailItem label="User plan" value={normalizeUserTier(account.subscription_tier) === "Paid" ? "Paid Pro user" : "Free user"} />
            <DetailItem label="Role" value={account.role?.role_name} />
            <DetailItem label="Organization" value={account.organization?.organization_name} />
            <DetailItem label="Organization code" value={account.organization?.organization_code} />
            <DetailItem label="Organization email" value={account.organization?.organization_email} />
            <DetailItem label="Organization type" value={account.organization?.organization_type} />
            <DetailItem label="Address" value={profile.address} />
            <DetailItem label="Account ID" value={account.user_id} />
            <DetailItem label="Created" value={formatDate(account.created_at || profile.created_at)} />
            <DetailItem label="Updated" value={formatDate(account.updated_at || profile.updated_at)} />
          </div>

          <div className="mt-4 rounded-3xl border border-white/10 bg-white/10 p-5">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-teal-200">Bio</p>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-100">{profile.bio || "No profile bio has been added."}</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onUpdate(account)}
              className="rounded-full border border-white/15 bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5"
            >
              Update
            </button>
            <button
              type="button"
              onClick={() => onToggleSuspend(account)}
              className="rounded-full bg-teal-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-teal-200"
            >
              {account.account_status === "Suspended" ? "Activate" : "Suspend"}
            </button>
            <button
              type="button"
              onClick={() => onToggleSubscriptionTier(account)}
              className="rounded-full border border-lime-200/40 bg-lime-300/15 px-5 py-3 text-sm font-black text-lime-100 transition hover:-translate-y-0.5 hover:bg-lime-300/25"
            >
              {normalizeUserTier(account.subscription_tier) === "Paid" ? "Downgrade to Free" : "Upgrade to Paid"}
            </button>
            <button
              type="button"
              onClick={() => onDelete(account)}
              className="rounded-full border border-rose-200/40 bg-rose-400/15 px-5 py-3 text-sm font-black text-rose-100 transition hover:-translate-y-0.5 hover:bg-rose-400/25"
            >
              Delete
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
