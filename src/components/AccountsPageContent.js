"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import SignUpForm from "@/components/SignUpForm";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

function accountAvatarUrl(account) {
  return account?.profile_picture_url || account?.profile?.profile_picture_url || "";
}

function AccountAvatar({ account }) {
  const avatarUrl = accountAvatarUrl(account);

  return (
    <div className="relative mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#C7DDEB] text-[#0D1E4C]">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={`${account?.username ?? "User"} avatar`}
          fill
          sizes="80px"
          unoptimized
          className="object-cover"
        />
      ) : (
        <svg
          className="h-12 w-12"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="12" cy="7" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      )}
    </div>
  );
}

function PaidIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.9-5.4 2.9 1-6-4.4-4.3 6.1-.9L12 3z" />
    </svg>
  );
}

function FreeIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M8 12h8" />
    </svg>
  );
}

function SubscriptionBadge({ tier }) {
  const isPaid = tier === "Team" || tier === "Enterprise";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${
        isPaid
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-slate-50 text-slate-700"
      }`}
      title={isPaid ? "Paid account" : "Free account"}
    >
      {isPaid ? <PaidIcon /> : <FreeIcon />}
      {isPaid ? `${tier} Paid` : "Starter Free"}
    </span>
  );
}

function formatDateTime(value) {
  if (!value) {
    return "Not recorded";
  }

  return new Date(value).toLocaleString();
}

function accountPatchPreview(account, payload) {
  const nextAccount = { ...account };

  if (payload.username !== undefined) nextAccount.username = payload.username;
  if (payload.email !== undefined) nextAccount.email = payload.email;
  if (payload.accountStatus !== undefined) nextAccount.account_status = payload.accountStatus;
  if (payload.subscriptionTier !== undefined) nextAccount.subscription_tier = payload.subscriptionTier;

  return nextAccount;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function AccountsPageContent() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [detailPosition, setDetailPosition] = useState(null);

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

      setAccounts((current) =>
        current.map((account) =>
          account.user_id === payload.userId ? accountPatchPreview(account, payload) : account,
        ),
      );
      setSelectedAccount((current) =>
        current?.user_id === payload.userId ? accountPatchPreview(current, payload) : current,
      );
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

      if (selectedAccount?.user_id === account.user_id) {
        setSelectedAccount(null);
        setDetailPosition(null);
      }

      await loadAccounts();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  function stopCardAction(event) {
    event.stopPropagation();
  }

  function closeAccountDetails() {
    setSelectedAccount(null);
    setDetailPosition(null);
  }

  function openAccountDetails(account, event) {
    setSelectedAccount(account);

    if (typeof window === "undefined" || !event?.currentTarget) {
      setDetailPosition(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const margin = 16;
    const gap = 12;
    const width = Math.min(window.innerWidth < 760 ? 380 : 680, window.innerWidth - margin * 2);
    const anchorX = event.clientX || rect.left + rect.width / 2;
    const anchorY = event.clientY || rect.top + rect.height / 2;
    const rightLeft = anchorX + gap;
    const leftLeft = anchorX - width - gap;
    const left = rightLeft + width <= window.innerWidth - margin
      ? rightLeft
      : leftLeft >= margin
        ? leftLeft
        : clamp(anchorX - width / 2, margin, window.innerWidth - width - margin);
    const bottomSpace = window.innerHeight - anchorY - gap - margin;
    const topSpace = anchorY - gap - margin;
    const preferredHeight = window.innerHeight < 760 ? 360 : 560;
    const useBottom = bottomSpace >= 260 || bottomSpace >= topSpace;
    const availableHeight = useBottom ? bottomSpace : topSpace;
    const maxHeight = clamp(availableHeight, 240, Math.min(preferredHeight, window.innerHeight - margin * 2));
    const top = useBottom
      ? anchorY + gap
      : anchorY - maxHeight - gap;

    setDetailPosition({ left, top, width, maxHeight });
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
                role="button"
                tabIndex={0}
                onClick={(event) => openAccountDetails(account, event)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openAccountDetails(account, event);
                  }
                }}
                className="w-full max-w-[280px] cursor-pointer rounded-[24px] border border-white/60 bg-white/35 p-5 text-center shadow-sm backdrop-blur-md outline-none transition hover:border-[#0a72e8] hover:bg-white/45 focus:border-[#0a72e8] focus:ring-2 focus:ring-[#0a72e8]/30"
                aria-label={`View ${account.username} account details`}
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
                  <AccountAvatar account={account} />
                </div>
                <h3 className="mt-5 text-xl font-black text-[#0B1B32]">{account.username}</h3>
                <p className="mt-2 text-sm text-[#64748B]">{account.email}</p>
                <p className="mt-1 text-sm text-[#64748B]">
                  {account.organization?.organization_name ?? "No organization"}
                </p>
                <div className="mt-4 flex justify-center">
                  <SubscriptionBadge tier={account.subscription_tier} />
                </div>
                <div className="mt-6 flex flex-col items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={(event) => {
                      stopCardAction(event);
                      updateAccount(account);
                    }}
                    className="rounded-full border border-[#83A6CE] bg-white/60 px-5 py-2 text-sm font-bold text-[#0A2540] hover:bg-white"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      stopCardAction(event);
                      toggleSuspend(account);
                    }}
                    className="rounded-full bg-[#0D1E4C] px-7 py-3 text-sm font-bold text-white hover:bg-[#0B1B32]"
                  >
                    {account.account_status === "Suspended" ? "Activate" : "Suspend"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    stopCardAction(event);
                    deleteAccount(account);
                  }}
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

      {selectedAccount ? (
        <AccountDetailsDialog
          account={selectedAccount}
          position={detailPosition}
          onClose={closeAccountDetails}
          onUpdate={updateAccount}
          onToggleSuspend={toggleSuspend}
          onDelete={deleteAccount}
          onChangeTier={(tier) =>
            saveAccount({
              userId: selectedAccount.user_id,
              subscriptionTier: tier,
            })
          }
        />
      ) : null}
    </div>
  );
}

function AccountDetailsDialog({
  account,
  position,
  onClose,
  onUpdate,
  onToggleSuspend,
  onDelete,
  onChangeTier,
}) {
  const tiers = ["Starter", "Team", "Enterprise"];
  const dialogStyle = position
    ? {
        left: position.left,
        top: position.top,
        width: position.width,
        maxHeight: position.maxHeight,
      }
    : {
        left: "50%",
        top: "50%",
        width: "min(48rem, calc(100vw - 2rem))",
        maxHeight: "calc(100vh - 2rem)",
        transform: "translate(-50%, -50%)",
      };

  return (
    <div className="fixed inset-0 z-50 bg-[#07183b]/35" onClick={onClose}>
      <section
        className="fixed overflow-y-auto rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_90px_rgba(7,24,59,0.28)]"
        style={dialogStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <AccountAvatar account={account} />
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5d7290]">User details</p>
              <h2 className="mt-2 truncate text-3xl font-black text-[#07183b]">{account.username}</h2>
              <p className="mt-1 truncate text-sm font-semibold text-[#52627a]">{account.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C7DDEB] bg-white text-lg font-black text-[#07183b] hover:bg-[#F6FAFD]"
            aria-label="Close user details"
          >
            x
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <DetailRow label="Role" value={account.role?.role_name ?? "Unassigned"} />
          <DetailRow label="Status" value={account.account_status} />
          <DetailRow label="Organization" value={account.organization?.organization_name ?? "No organization"} />
          <DetailRow label="Department" value={account.department?.department_name ?? "No department"} />
          <DetailRow label="Last active" value={formatDateTime(account.last_active_at)} />
          <DetailRow label="Created" value={formatDateTime(account.created_at)} />
        </div>

        <div className="mt-6 rounded-2xl border border-[#d7e5f2] bg-[#F8FBFE] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-black text-[#07183b]">Subscription</h3>
              <p className="mt-1 text-sm font-semibold text-[#52627a]">
                Switch the account between free and paid access.
              </p>
            </div>
            <SubscriptionBadge tier={account.subscription_tier} />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {tiers.map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => onChangeTier(tier)}
                className={`rounded-full border px-4 py-3 text-sm font-black ${
                  account.subscription_tier === tier
                    ? "border-[#0D1E4C] bg-[#0D1E4C] text-white"
                    : "border-[#83A6CE] bg-white text-[#0A2540] hover:bg-[#F6FAFD]"
                }`}
              >
                {tier === "Starter" ? "Starter Free" : `${tier} Paid`}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onUpdate(account)}
            className="rounded-full border border-[#83A6CE] bg-white px-5 py-3 text-sm font-bold text-[#0A2540] hover:bg-[#F6FAFD]"
          >
            Update account
          </button>
          <button
            type="button"
            onClick={() => onToggleSuspend(account)}
            className="rounded-full bg-[#0D1E4C] px-5 py-3 text-sm font-bold text-white hover:bg-[#0B1B32]"
          >
            {account.account_status === "Suspended" ? "Activate account" : "Suspend account"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(account)}
            className="rounded-full border border-rose-200 bg-white px-5 py-3 text-sm font-bold text-rose-700 hover:bg-rose-50"
          >
            Delete account
          </button>
        </div>
      </section>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#d7e5f2] bg-[#F8FBFE] p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#64748B]">{label}</p>
      <p className="mt-2 text-sm font-bold text-[#07183b]">{value}</p>
    </div>
  );
}
