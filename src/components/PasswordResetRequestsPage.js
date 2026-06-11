"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const statusStyles = {
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  "Reset Sent": "border-blue-200 bg-blue-50 text-blue-700",
  Resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export default function PasswordResetRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [query, setQuery] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");

  async function authHeaders() {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();

    return {
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
    };
  }

  async function loadRequests() {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/password-recovery", {
        headers: await authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load password reset requests.");
      }

      setRequests(result.requests ?? []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadRequests();
    }, 0);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return requests.filter((request) =>
      `${request.email} ${request.requested_by_name} ${request.status} ${request.admin_message}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, requests]);

  const pendingCount = requests.filter((request) => request.status === "Pending").length;

  async function updateRequest(requestId, status) {
    setError("");
    setMessage("");
    setUpdatingId(requestId);

    try {
      const response = await fetch("/api/password-recovery", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          requestId,
          status,
          adminNote: adminNote || `User Admin marked this request as ${status}.`,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update password reset request.");
      }

      setMessage(`Request ${requestId} updated to ${status}.`);
      setAdminNote("");
      await loadRequests();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5d7290]">User Admin Inbox</p>
          <h1 className="mt-2 text-3xl font-black text-[#07183b] sm:text-4xl">Password Reset Requests</h1>
          <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-[#52627a]">
            Review password recovery messages submitted by users and mark reset assistance as sent or resolved.
          </p>
        </div>
        <div className="grid min-w-[260px] gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/60 bg-white/45 p-4 shadow-sm">
            <p className="text-sm font-bold text-[#64748B]">Pending</p>
            <p className="mt-2 text-3xl font-black text-[#07183b]">{pendingCount}</p>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/45 p-4 shadow-sm">
            <p className="text-sm font-bold text-[#64748B]">Total</p>
            <p className="mt-2 text-3xl font-black text-[#07183b]">{requests.length}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search reset requests"
          className="h-12 rounded-full border border-[#C7DDEB] bg-white px-5 text-sm text-[#0B1B32] shadow-sm outline-none placeholder:text-[#64748B] focus:border-[#83A6CE] focus:ring-2 focus:ring-[#83A6CE]/25"
        />
        <input
          value={adminNote}
          onChange={(event) => setAdminNote(event.target.value)}
          placeholder="Optional admin note"
          className="h-12 rounded-full border border-[#C7DDEB] bg-white px-5 text-sm text-[#0B1B32] shadow-sm outline-none placeholder:text-[#64748B] focus:border-[#83A6CE] focus:ring-2 focus:ring-[#83A6CE]/25"
        />
      </div>

      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </p>
      ) : null}

      {isLoading ? <p className="text-sm font-semibold text-[#52627a]">Loading password reset requests...</p> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredRequests.map((request) => (
          <article key={request.request_id} className="rounded-[24px] border border-white/60 bg-white/45 p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-[#07183b]">{request.email}</h2>
                <p className="mt-1 text-sm font-semibold text-[#52627a]">
                  Requested by {request.requested_by_name || "Unknown account"}
                </p>
              </div>
              <span
                className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${
                  statusStyles[request.status] ?? statusStyles.Pending
                }`}
              >
                {request.status}
              </span>
            </div>

            <div className="mt-4 rounded-2xl border border-[#d7e5f2] bg-[#F8FBFE] p-4 text-sm text-[#42536d]">
              <p className="font-bold text-[#07183b]">{request.admin_message}</p>
              {request.note ? <p className="mt-2">{request.note}</p> : null}
              {request.admin_note ? <p className="mt-2 font-semibold">Admin note: {request.admin_note}</p> : null}
            </div>

            <dl className="mt-4 grid gap-3 text-xs font-semibold text-[#52627a] sm:grid-cols-2">
              <div>
                <dt className="uppercase tracking-wide">Request ID</dt>
                <dd className="mt-1 text-[#07183b]">{request.request_id}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide">Created</dt>
                <dd className="mt-1 text-[#07183b]">
                  {request.created_at ? new Date(request.created_at).toLocaleString() : "Not recorded"}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => updateRequest(request.request_id, "Reset Sent")}
                disabled={updatingId === request.request_id}
                className="rounded-full bg-[#0D1E4C] px-5 py-2 text-sm font-bold text-white hover:bg-[#0B1B32] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Mark Reset Sent
              </button>
              <button
                type="button"
                onClick={() => updateRequest(request.request_id, "Resolved")}
                disabled={updatingId === request.request_id}
                className="rounded-full border border-[#83A6CE] bg-white/70 px-5 py-2 text-sm font-bold text-[#0A2540] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Resolve
              </button>
            </div>
          </article>
        ))}
      </div>

      {!isLoading && filteredRequests.length === 0 ? (
        <div className="rounded-2xl border border-white/60 bg-white/45 p-8 text-center text-sm font-bold text-[#52627a]">
          No password reset requests match the current search.
        </div>
      ) : null}
    </div>
  );
}
