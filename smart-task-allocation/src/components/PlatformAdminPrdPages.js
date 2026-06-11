"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

function Panel({ title, description, children }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-[#07183b]">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#52627a]">{description}</p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="h-11 w-full rounded-xl border border-[#83A6CE] bg-white px-4 text-sm font-semibold text-[#07183b] outline-none focus:ring-2 focus:ring-[#83A6CE]/30 disabled:bg-[#E0E5E9]"
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className="min-h-28 w-full rounded-xl border border-[#83A6CE] bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#07183b] outline-none focus:ring-2 focus:ring-[#83A6CE]/30 disabled:bg-[#E0E5E9]"
    />
  );
}

function SelectInput(props) {
  return (
    <select
      {...props}
      className="h-11 w-full rounded-xl border border-[#83A6CE] bg-white px-4 text-sm font-semibold text-[#07183b] outline-none focus:ring-2 focus:ring-[#83A6CE]/30"
    />
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#07183b]">
      <span>{label}</span>
      {children}
    </label>
  );
}

function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="rounded-full bg-[#0D1E4C] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#07183b]"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="rounded-full border border-[#83A6CE] bg-white px-5 py-2.5 text-sm font-bold text-[#07183b] transition hover:bg-[#E0E5E9]"
    >
      {children}
    </button>
  );
}

function formatDate(value) {
  if (!value) return "No timestamp";
  return new Intl.DateTimeFormat("en-SG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function HomepageManagement() {
  const [content, setContent] = useState({
    headline: "Smart task allocation for SME teams",
    announcement: "",
    feature: "AI-assisted allocation, availability checks, and workflow visibility.",
  });
  const [message, setMessage] = useState("");

  function update(field, value) {
    setContent((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  function save(event) {
    event.preventDefault();
    setMessage("Homepage draft updated.");
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <Panel title="Homepage Management" description="Update information prepared for guest users.">
        {message ? <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</p> : null}
        <form onSubmit={save} className="grid gap-4">
          <Field label="Homepage headline">
            <TextInput value={content.headline} onChange={(event) => update("headline", event.target.value)} />
          </Field>
          <Field label="Latest announcement">
            <TextArea value={content.announcement} onChange={(event) => update("announcement", event.target.value)} placeholder="Add guest-facing announcement" />
          </Field>
          <Field label="Feature highlight">
            <TextArea value={content.feature} onChange={(event) => update("feature", event.target.value)} />
          </Field>
          <PrimaryButton type="submit">Save Homepage Draft</PrimaryButton>
        </form>
      </Panel>

      <Panel title="Guest Preview">
        <div className="rounded-[24px] bg-[#E0E5E9] p-5">
          <p className="text-xs font-black uppercase tracking-widest text-[#57708f]">Optima</p>
          <h3 className="mt-3 text-2xl font-black text-[#07183b]">{content.headline}</h3>
          <p className="mt-3 text-sm leading-6 text-[#52627a]">{content.feature}</p>
          {content.announcement ? (
            <p className="mt-4 rounded-xl bg-white p-4 text-sm font-bold text-[#07183b]">{content.announcement}</p>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}

export function SubscriptionPlanManagement() {
  const [plans, setPlans] = useState([
    { id: 1, name: "Starter", price: "Free", status: "Visible" },
    { id: 2, name: "Team", price: "$19/month", status: "Visible" },
  ]);
  const [form, setForm] = useState({ id: "", name: "", price: "", status: "Visible" });

  function savePlan(event) {
    event.preventDefault();
    const payload = { ...form, id: form.id || Date.now() };
    setPlans((current) => (form.id ? current.map((plan) => (plan.id === form.id ? payload : plan)) : [payload, ...current]));
    setForm({ id: "", name: "", price: "", status: "Visible" });
  }

  return (
    <Panel title="Subscription Plan Management" description="Create, update, and remove visible plan information.">
      <form onSubmit={savePlan} className="mb-6 grid gap-4 md:grid-cols-4">
        <Field label="Plan name">
          <TextInput value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </Field>
        <Field label="Price">
          <TextInput value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required />
        </Field>
        <Field label="Status">
          <SelectInput value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option>Visible</option>
            <option>Hidden</option>
          </SelectInput>
        </Field>
        <div className="flex items-end">
          <PrimaryButton type="submit">{form.id ? "Update Plan" : "Create Plan"}</PrimaryButton>
        </div>
      </form>

      <div className="grid gap-3 md:grid-cols-2">
        {plans.map((plan) => (
          <article key={plan.id} className="rounded-[24px] border-2 border-[#83A6CE] bg-[#E0E5E9] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-[#07183b]">{plan.name}</h3>
                <p className="mt-1 text-sm font-bold text-[#52627a]">{plan.price}</p>
                <p className="mt-2 text-xs font-black uppercase tracking-widest text-[#57708f]">{plan.status}</p>
              </div>
              <div className="flex gap-2">
                <SecondaryButton type="button" onClick={() => setForm(plan)}>Edit</SecondaryButton>
                <SecondaryButton type="button" onClick={() => setPlans((current) => current.filter((item) => item.id !== plan.id))}>Delete</SecondaryButton>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function FeedbackManagement() {
  const [feedback, setFeedback] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      const { data: comments, error: commentsError } = await supabase
        .from("task_comment")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (commentsError) {
        setError(commentsError.message);
        return;
      }

      setFeedback((comments ?? []).map((item) => ({
        id: item.comment_id,
        message: item.comment_body,
        source: item.created_by || "Unknown user",
        created_at: item.created_at,
        display_status: "Pending Review",
      })));
    }, 0);

    return () => clearTimeout(timeout);
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return feedback.filter((item) => {
      const matchesStatus = status === "All" || item.display_status === status;
      return matchesStatus && `${item.message} ${item.source}`.toLowerCase().includes(query);
    });
  }, [feedback, search, status]);

  function updateStatus(id, displayStatus) {
    setFeedback((current) => current.map((item) => (item.id === id ? { ...item, display_status: displayStatus } : item)));
  }

  return (
    <Panel title="User Feedback Management" description="Review feedback and decide what can be displayed.">
      {error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
        <TextInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search feedback" />
        <SelectInput value={status} onChange={(event) => setStatus(event.target.value)}>
          <option>All</option>
          <option>Pending Review</option>
          <option>Approved</option>
          <option>Hidden</option>
        </SelectInput>
      </div>

      <div className="grid gap-3">
        {filtered.map((item) => (
          <article key={item.id} className="rounded-[24px] border-2 border-[#83A6CE] bg-[#E0E5E9] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-black text-[#07183b]">{item.source}</p>
                <p className="mt-2 text-sm leading-6 text-[#1F293B]">{item.message || "No feedback yet."}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[#57708f]">{formatDate(item.created_at)}</p>
              </div>
              <SelectInput value={item.display_status} onChange={(event) => updateStatus(item.id, event.target.value)}>
                <option>Pending Review</option>
                <option>Approved</option>
                <option>Hidden</option>
              </SelectInput>
            </div>
          </article>
        ))}
        {!filtered.length ? <p className="rounded-md border border-dashed border-[#83A6CE] bg-[#E0E5E9] p-4 text-sm font-bold text-[#57708f]">No feedback yet.</p> : null}
      </div>
    </Panel>
  );
}

export function FeedbackAnalysis() {
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      const { data: comments, error: commentsError } = await supabase
        .from("task_comment")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (commentsError) {
        setError(commentsError.message);
        return;
      }

      setFeedback((comments ?? []).map((item) => ({
        id: item.comment_id,
        message: item.comment_body || "",
        source: item.created_by || "Unknown user",
        created_at: item.created_at,
      })));
    }, 0);

    return () => clearTimeout(timeout);
  }, []);

  const insights = useMemo(() => {
    const text = feedback.map((item) => item.message).join(" ").toLowerCase();
    return [
      text.includes("slow") || text.includes("lag")
        ? "Users may be experiencing performance concerns."
        : "No major performance concern detected.",
      text.includes("confusing") || text.includes("hard")
        ? "Some workflows may need clearer labels or guidance."
        : "Navigation feedback is currently neutral.",
      text.includes("task") || text.includes("assign")
        ? "Task allocation is a recurring feedback topic."
        : "Task allocation was not strongly mentioned.",
    ];
  }, [feedback]);

  const keywordCounts = useMemo(() => {
    const keywords = ["task", "assign", "slow", "confusing", "easy", "profile", "workspace", "feedback"];
    const text = feedback.map((item) => item.message).join(" ").toLowerCase();

    return keywords
      .map((keyword) => ({
        keyword,
        count: text.split(keyword).length - 1,
      }))
      .filter((item) => item.count > 0)
      .sort((first, second) => second.count - first.count);
  }, [feedback]);

  const latestFeedback = feedback.slice(0, 5);

  return (
    <Panel title="Feedback Analysis" description="Analyse feedback that has already been submitted by users.">
      {error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-[24px] border-2 border-[#83A6CE] bg-[#E0E5E9] p-5">
          <p className="text-xs font-black uppercase tracking-widest text-[#57708f]">Submitted Feedback</p>
          <p className="mt-2 text-3xl font-black text-[#07183b]">{feedback.length}</p>
        </div>
        <div className="rounded-[24px] border-2 border-[#83A6CE] bg-[#E0E5E9] p-5">
          <p className="text-xs font-black uppercase tracking-widest text-[#57708f]">Detected Keywords</p>
          <p className="mt-2 text-3xl font-black text-[#07183b]">{keywordCounts.length}</p>
        </div>
        <div className="rounded-[24px] border-2 border-[#83A6CE] bg-[#E0E5E9] p-5">
          <p className="text-xs font-black uppercase tracking-widest text-[#57708f]">Latest Review</p>
          <p className="mt-2 text-lg font-black text-[#07183b]">
            {latestFeedback[0] ? formatDate(latestFeedback[0].created_at) : "No feedback yet"}
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[24px] bg-[#E0E5E9] p-5">
          <h3 className="text-lg font-black text-[#07183b]">Insights</h3>
          <ul className="mt-4 space-y-3">
            {insights.map((item) => (
              <li key={item} className="rounded-xl bg-white p-3 text-sm font-semibold text-[#1F293B]">{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-[24px] bg-[#E0E5E9] p-5">
          <h3 className="text-lg font-black text-[#07183b]">Common Keywords</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {keywordCounts.map((item) => (
              <span key={item.keyword} className="rounded-full bg-white px-3 py-2 text-sm font-black text-[#07183b]">
                {item.keyword}: {item.count}
              </span>
            ))}
            {!keywordCounts.length ? (
              <p className="text-sm font-semibold text-[#52627a]">No repeated keywords detected yet.</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[24px] bg-[#E0E5E9] p-5">
        <h3 className="text-lg font-black text-[#07183b]">Latest Submitted Feedback</h3>
        <div className="mt-4 grid gap-3">
          {latestFeedback.map((item) => (
            <article key={item.id} className="rounded-xl bg-white p-4">
              <p className="text-sm font-semibold leading-6 text-[#1F293B]">
                {item.message || "No feedback message recorded."}
              </p>
              <p className="mt-2 text-xs font-black uppercase tracking-widest text-[#57708f]">
                {item.source} | {formatDate(item.created_at)}
              </p>
            </article>
          ))}
          {!latestFeedback.length ? (
            <p className="rounded-md border border-dashed border-[#83A6CE] bg-white p-4 text-sm font-bold text-[#57708f]">
              No feedback yet.
            </p>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

export function ContactInquiryManagement() {
  const [inquiries, setInquiries] = useState([
    { id: 1, name: "Guest User", email: "guest@example.com", message: "I would like to know more about Optima.", status: "Open", response: "" },
  ]);
  const [selectedId, setSelectedId] = useState(1);
  const selected = inquiries.find((item) => item.id === Number(selectedId));

  function updateSelected(updates) {
    setInquiries((current) => current.map((item) => (item.id === selected.id ? { ...item, ...updates } : item)));
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <Panel title="Contact Inquiries" description="Select an inquiry to review.">
        <div className="space-y-3">
          {inquiries.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`w-full rounded-[20px] border-2 p-4 text-left ${selectedId === item.id ? "border-[#07183b] bg-[#E0E5E9]" : "border-[#83A6CE] bg-white"}`}
            >
              <p className="font-black text-[#07183b]">{item.name}</p>
              <p className="mt-1 text-sm text-[#52627a]">{item.email}</p>
              <p className="mt-2 text-xs font-black uppercase tracking-widest text-[#57708f]">{item.status}</p>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Inquiry Response" description="Provide assistance and update inquiry status.">
        {selected ? (
          <form className="grid gap-4">
            <Field label="Name"><TextInput value={selected.name} disabled /></Field>
            <Field label="Email"><TextInput value={selected.email} disabled /></Field>
            <Field label="Message"><TextArea value={selected.message} disabled /></Field>
            <Field label="Response"><TextArea value={selected.response} onChange={(event) => updateSelected({ response: event.target.value })} /></Field>
            <Field label="Status">
              <SelectInput value={selected.status} onChange={(event) => updateSelected({ status: event.target.value })}>
                <option>Open</option>
                <option>In Progress</option>
                <option>Resolved</option>
              </SelectInput>
            </Field>
            <PrimaryButton type="button">Save Inquiry</PrimaryButton>
          </form>
        ) : null}
      </Panel>
    </div>
  );
}
