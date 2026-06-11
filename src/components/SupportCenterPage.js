"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const actorLabels = {
  manager: "Manager",
  employee: "Employee",
};

const statusStyles = {
  Open: "border-blue-200 bg-blue-50 text-blue-700",
  Replied: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Hidden: "border-slate-200 bg-slate-50 text-slate-700",
  Shown: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function TierBadge({ tier }) {
  const isPaid = tier === "Team" || tier === "Enterprise";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black ${
        isPaid
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-slate-50 text-slate-700"
      }`}
    >
      {isPaid ? `${tier} Paid` : "Starter Free"}
    </span>
  );
}

export default function SupportCenterPage({ actor }) {
  const [activeTab, setActiveTab] = useState("support");
  const [supportForm, setSupportForm] = useState({
    subject: "Need help with workflow setup",
    category: "Workflow",
    message: "Please help review my current workspace and support flow.",
  });
  const [feedbackForm, setFeedbackForm] = useState({
    title: "Workflow feedback",
    message: "The support and task allocation workflow is easy to follow.",
    rating: 5,
  });
  const [supportRequests, setSupportRequests] = useState([]);
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function authHeaders() {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();

    return {
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
    };
  }

  async function loadQueues() {
    setError("");
    setIsLoading(true);

    try {
      const headers = await authHeaders();
      const [supportResponse, feedbackResponse] = await Promise.all([
        fetch("/api/support-requests", { headers }),
        fetch("/api/workflow-feedback", { headers }),
      ]);
      const [supportResult, feedbackResult] = await Promise.all([
        supportResponse.json(),
        feedbackResponse.json(),
      ]);

      if (!supportResponse.ok) {
        throw new Error(supportResult.error || "Could not load support requests.");
      }

      if (!feedbackResponse.ok) {
        throw new Error(feedbackResult.error || "Could not load workflow feedback.");
      }

      setSupportRequests(supportResult.requests ?? []);
      setFeedbackItems(feedbackResult.feedback ?? []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadQueues();
    }, 0);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentTier = useMemo(() => {
    const latestSupport = supportRequests[0]?.subscription_tier;
    const latestFeedback = feedbackItems[0]?.subscription_tier;
    return latestSupport || latestFeedback || "Starter";
  }, [feedbackItems, supportRequests]);

  const responsePromise = currentTier === "Enterprise"
    ? "Platform Admin target response: within 4 business hours."
    : currentTier === "Team"
      ? "Platform Admin target response: within 1 business day."
      : "Platform Admin target response: within 2 business days.";

  function updateSupportField(name, value) {
    setSupportForm((current) => ({ ...current, [name]: value }));
  }

  function updateFeedbackField(name, value) {
    setFeedbackForm((current) => ({ ...current, [name]: value }));
  }

  async function submitSupport(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/support-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify(supportForm),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not submit support request.");
      }

      setMessage(`Support request submitted. ${result.request.expected_response}`);
      await loadQueues();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitFeedback(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/workflow-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify(feedbackForm),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not submit workflow feedback.");
      }

      setMessage("Workflow feedback submitted to Platform Admin for homepage display review.");
      await loadQueues();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="h-full min-h-0 overflow-hidden rounded-2xl border border-[#BBE1FA] bg-white shadow-sm">
      <div className="h-full overflow-y-auto px-6 py-6 sm:px-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5d7290]">
              {actorLabels[actor]} Support
            </p>
            <h1 className="mt-2 text-3xl font-black text-[#07183b] sm:text-4xl">Support Center</h1>
            <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-[#52627a]">
              Contact platform support or share workflow feedback with a rating. Paid accounts are routed with faster response targets.
            </p>
          </div>
          <div className="rounded-2xl border border-[#d7e5f2] bg-[#F8FBFE] p-4">
            <TierBadge tier={currentTier} />
            <p className="mt-3 text-sm font-bold text-[#42536d]">{responsePromise}</p>
          </div>
        </header>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            ["support", "Contact support"],
            ["feedback", "Share workflow feedback"],
          ].map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-5 py-3 text-sm font-bold ${
                activeTab === tab
                  ? "bg-[#0D1E4C] text-white"
                  : "border border-[#83A6CE] bg-white text-[#0A2540]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {message ? (
          <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
          {activeTab === "support" ? (
            <form onSubmit={submitSupport} className="rounded-2xl border border-[#d7e5f2] bg-[#F8FBFE] p-5">
              <h2 className="text-xl font-black text-[#07183b]">Contact support</h2>
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-sm font-bold text-[#42536d]">Subject</span>
                  <input
                    value={supportForm.subject}
                    onChange={(event) => updateSupportField("subject", event.target.value)}
                    className="mt-2 h-11 w-full rounded-lg border border-[#b8c4d8] px-3 text-sm outline-none focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-[#42536d]">Category</span>
                  <select
                    value={supportForm.category}
                    onChange={(event) => updateSupportField("category", event.target.value)}
                    className="mt-2 h-11 w-full rounded-lg border border-[#b8c4d8] px-3 text-sm outline-none focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
                  >
                    {["Workflow", "Account", "Task allocation", "Billing", "Other"].map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-[#42536d]">Message</span>
                  <textarea
                    value={supportForm.message}
                    onChange={(event) => updateSupportField("message", event.target.value)}
                    rows={5}
                    className="mt-2 w-full rounded-lg border border-[#b8c4d8] px-3 py-3 text-sm outline-none focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
                    required
                  />
                </label>
              </div>
              <button
                disabled={isSubmitting}
                className="mt-5 rounded-full bg-[#0D1E4C] px-5 py-3 text-sm font-bold text-white hover:bg-[#0B1B32] disabled:cursor-not-allowed disabled:opacity-70"
              >
                Submit support
              </button>
            </form>
          ) : (
            <form onSubmit={submitFeedback} className="rounded-2xl border border-[#d7e5f2] bg-[#F8FBFE] p-5">
              <h2 className="text-xl font-black text-[#07183b]">Share workflow feedback</h2>
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-sm font-bold text-[#42536d]">Title</span>
                  <input
                    value={feedbackForm.title}
                    onChange={(event) => updateFeedbackField("title", event.target.value)}
                    className="mt-2 h-11 w-full rounded-lg border border-[#b8c4d8] px-3 text-sm outline-none focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-[#42536d]">Rating</span>
                  <div className="mt-2 flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => updateFeedbackField("rating", rating)}
                        className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-black ${
                          Number(feedbackForm.rating) === rating
                            ? "border-amber-300 bg-amber-100 text-amber-800"
                            : "border-[#b8c4d8] bg-white text-[#42536d]"
                        }`}
                        aria-label={`${rating} star rating`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-[#42536d]">Feedback</span>
                  <textarea
                    value={feedbackForm.message}
                    onChange={(event) => updateFeedbackField("message", event.target.value)}
                    rows={5}
                    className="mt-2 w-full rounded-lg border border-[#b8c4d8] px-3 py-3 text-sm outline-none focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
                    required
                  />
                </label>
              </div>
              <button
                disabled={isSubmitting}
                className="mt-5 rounded-full bg-[#0D1E4C] px-5 py-3 text-sm font-bold text-white hover:bg-[#0B1B32] disabled:cursor-not-allowed disabled:opacity-70"
              >
                Submit feedback
              </button>
            </form>
          )}

          <div className="space-y-5">
            <QueueSection
              title="My support requests"
              loading={isLoading}
              items={supportRequests}
              emptyText="No support requests submitted yet."
              renderItem={(item) => (
                <QueueCard key={item.request_id} title={item.subject} status={item.status}>
                  <p>{item.message}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <TierBadge tier={item.subscription_tier} />
                    <span className="rounded-full border border-[#d7e5f2] bg-white px-3 py-1 text-xs font-bold text-[#42536d]">
                      {item.expected_response}
                    </span>
                  </div>
                  {item.platform_reply ? (
                    <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 font-bold text-emerald-800">
                      Platform reply: {item.platform_reply}
                    </p>
                  ) : null}
                </QueueCard>
              )}
            />

            <QueueSection
              title="My workflow feedback"
              loading={isLoading}
              items={feedbackItems}
              emptyText="No workflow feedback submitted yet."
              renderItem={(item) => (
                <QueueCard key={item.feedback_id} title={item.title} status={item.display_status}>
                  <p>{item.message}</p>
                  <p className="mt-2 text-xs font-black text-amber-700">Rating: {item.rating}/5</p>
                  <p className="mt-2 text-xs font-semibold text-[#52627a]">
                    Homepage display: {item.display_status}
                  </p>
                </QueueCard>
              )}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function QueueSection({ title, loading, items, emptyText, renderItem }) {
  return (
    <section className="rounded-2xl border border-[#d7e5f2] bg-white p-5">
      <h2 className="text-xl font-black text-[#07183b]">{title}</h2>
      {loading ? <p className="mt-4 text-sm font-semibold text-[#52627a]">Loading...</p> : null}
      <div className="mt-4 grid gap-3">
        {items.map(renderItem)}
        {!loading && !items.length ? (
          <p className="rounded-xl border border-[#d7e5f2] bg-[#F8FBFE] px-4 py-6 text-center text-sm font-bold text-[#52627a]">
            {emptyText}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function QueueCard({ title, status, children }) {
  return (
    <article className="rounded-xl border border-[#d7e5f2] bg-[#F8FBFE] p-4 text-sm text-[#42536d]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="font-black text-[#07183b]">{title}</h3>
        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusStyles[status] ?? statusStyles.Open}`}>
          {status}
        </span>
      </div>
      <div className="mt-3">{children}</div>
    </article>
  );
}
