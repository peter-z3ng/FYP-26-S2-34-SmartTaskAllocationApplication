"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const displayStyles = {
  Shown: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Hidden: "border-slate-200 bg-slate-50 text-slate-700",
};

export default function PlatformFeedbackQueuePage() {
  const [feedback, setFeedback] = useState([]);
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState("Thanks for the feedback. Platform Admin has reviewed this item.");
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

  async function loadFeedback() {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/workflow-feedback", {
        headers: await authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load workflow feedback.");
      }

      setFeedback(result.feedback ?? []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadFeedback();
    }, 0);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredFeedback = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return feedback.filter((item) =>
      `${item.title} ${item.message} ${item.requester_name} ${item.display_status} ${item.rating}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [feedback, query]);

  async function updateFeedback(feedbackId, displayStatus) {
    setError("");
    setMessage("");
    setUpdatingId(feedbackId);

    try {
      const response = await fetch("/api/workflow-feedback", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          feedbackId,
          displayStatus,
          status: "Reviewed",
          reply,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update workflow feedback.");
      }

      setMessage(`Feedback ${feedbackId} is now ${displayStatus} on the public Feedback page.`);
      await loadFeedback();
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
          <h1 className="mt-2 text-3xl font-black text-[#07183b] sm:text-4xl">User Feedback Management</h1>
          <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-[#52627a]">
            Review rated workflow feedback and decide whether each item is shown or hidden on the public Feedback page.
          </p>
        </div>
        <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
          <Metric label="Shown" value={feedback.filter((item) => item.display_status === "Shown").length} />
          <Metric label="Hidden" value={feedback.filter((item) => item.display_status !== "Shown").length} />
        </div>
      </header>

      <div className="grid gap-3 lg:grid-cols-[1fr_460px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search feedback"
          className="h-12 rounded-full border border-[#C7DDEB] bg-white px-5 text-sm text-[#0B1B32] shadow-sm outline-none placeholder:text-[#64748B] focus:border-[#83A6CE] focus:ring-2 focus:ring-[#83A6CE]/25"
        />
        <input
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          placeholder="Admin reply"
          className="h-12 rounded-full border border-[#C7DDEB] bg-white px-5 text-sm text-[#0B1B32] shadow-sm outline-none placeholder:text-[#64748B] focus:border-[#83A6CE] focus:ring-2 focus:ring-[#83A6CE]/25"
        />
      </div>

      {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p> : null}
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}
      {isLoading ? <p className="text-sm font-semibold text-[#52627a]">Loading feedback...</p> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredFeedback.map((item) => (
          <article key={item.feedback_id} className="rounded-[24px] border border-white/60 bg-white/45 p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-[#07183b]">{item.title}</h2>
                <p className="mt-1 text-sm font-semibold text-[#52627a]">
                  {item.requester_name} · {item.requester_role} · {item.requester_email}
                </p>
              </div>
              <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${displayStyles[item.display_status] ?? displayStyles.Hidden}`}>
                {item.display_status}
              </span>
            </div>
            <p className="mt-4 rounded-2xl border border-[#d7e5f2] bg-[#F8FBFE] p-4 text-sm font-semibold text-[#42536d]">
              {item.message}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                Rating {item.rating}/5
              </span>
              <span className="rounded-full border border-[#d7e5f2] bg-white px-3 py-1 text-xs font-bold text-[#42536d]">
                {item.subscription_tier}
              </span>
              <span className="rounded-full border border-[#d7e5f2] bg-white px-3 py-1 text-xs font-bold text-[#42536d]">
                {item.status}
              </span>
            </div>
            {item.platform_reply ? (
              <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
                Admin reply: {item.platform_reply}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => updateFeedback(item.feedback_id, "Shown")}
                disabled={updatingId === item.feedback_id}
                className="rounded-full bg-[#0D1E4C] px-5 py-2 text-sm font-bold text-white hover:bg-[#0B1B32] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Show on Feedback
              </button>
              <button
                type="button"
                onClick={() => updateFeedback(item.feedback_id, "Hidden")}
                disabled={updatingId === item.feedback_id}
                className="rounded-full border border-[#83A6CE] bg-white/70 px-5 py-2 text-sm font-bold text-[#0A2540] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hide
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
