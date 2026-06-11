"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const statusStyles = {
  Open: "border-blue-200 bg-blue-50 text-blue-700",
  Replied: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function TierBadge({ tier }) {
  const paid = tier === "Team" || tier === "Enterprise";
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black ${paid ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
      {paid ? `${tier} Paid` : "Starter Free"}
    </span>
  );
}

export default function PlatformSupportQueuePage() {
  const [requests, setRequests] = useState([]);
  const [reply, setReply] = useState("Thanks for contacting support. We are reviewing this and will follow up with the next action.");
  const [query, setQuery] = useState("");
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
      const response = await fetch("/api/support-requests", {
        headers: await authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load support requests.");
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
      `${request.subject} ${request.requester_name} ${request.requester_email} ${request.subscription_tier} ${request.status}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, requests]);

  const priorityCount = requests.filter((request) => request.priority === "Priority").length;

  async function updateRequest(requestId, status) {
    setError("");
    setMessage("");
    setUpdatingId(requestId);

    try {
      const response = await fetch("/api/support-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ requestId, status, reply }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update support request.");
      }

      setMessage(`Support request ${requestId} updated to ${status}.`);
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
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5d7290]">Platform Admin</p>
          <h1 className="mt-2 text-3xl font-black text-[#07183b] sm:text-4xl">Contact Inquiry Management</h1>
          <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-[#52627a]">
            Support requests from Manager and Employee users arrive here. Paid users are labeled for faster response handling.
          </p>
        </div>
        <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
          <Metric label="Open requests" value={requests.filter((request) => request.status === "Open").length} />
          <Metric label="Priority paid" value={priorityCount} />
        </div>
      </header>

      <div className="grid gap-3 lg:grid-cols-[1fr_460px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search support queue"
          className="h-12 rounded-full border border-[#C7DDEB] bg-white px-5 text-sm text-[#0B1B32] shadow-sm outline-none placeholder:text-[#64748B] focus:border-[#83A6CE] focus:ring-2 focus:ring-[#83A6CE]/25"
        />
        <input
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          placeholder="Reply message"
          className="h-12 rounded-full border border-[#C7DDEB] bg-white px-5 text-sm text-[#0B1B32] shadow-sm outline-none placeholder:text-[#64748B] focus:border-[#83A6CE] focus:ring-2 focus:ring-[#83A6CE]/25"
        />
      </div>

      {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p> : null}
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}
      {isLoading ? <p className="text-sm font-semibold text-[#52627a]">Loading support queue...</p> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredRequests.map((request) => (
          <article key={request.request_id} className="rounded-[24px] border border-white/60 bg-white/45 p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-[#07183b]">{request.subject}</h2>
                <p className="mt-1 text-sm font-semibold text-[#52627a]">
                  {request.requester_name} · {request.requester_role} · {request.requester_email}
                </p>
              </div>
              <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusStyles[request.status] ?? statusStyles.Open}`}>
                {request.status}
              </span>
            </div>
            <p className="mt-4 rounded-2xl border border-[#d7e5f2] bg-[#F8FBFE] p-4 text-sm font-semibold text-[#42536d]">
              {request.message}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <TierBadge tier={request.subscription_tier} />
              <span className="rounded-full border border-[#d7e5f2] bg-white px-3 py-1 text-xs font-bold text-[#42536d]">
                {request.expected_response}
              </span>
              <span className="rounded-full border border-[#d7e5f2] bg-white px-3 py-1 text-xs font-bold text-[#42536d]">
                {request.category}
              </span>
            </div>
            {request.platform_reply ? (
              <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
                Reply sent: {request.platform_reply}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => updateRequest(request.request_id, "Replied")}
                disabled={updatingId === request.request_id}
                className="rounded-full bg-[#0D1E4C] px-5 py-2 text-sm font-bold text-white hover:bg-[#0B1B32] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Send reply
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
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/45 p-4 shadow-sm">
      <p className="text-sm font-bold text-[#64748B]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#07183b]">{value}</p>
    </div>
  );
}
