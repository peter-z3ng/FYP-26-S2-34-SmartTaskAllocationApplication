"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { getAuthHeaders } from "@/lib/clientAuth";

const emptyHomepage = {
  heroTitle: "Assign the right work to the right people.",
  announcement: "Smart allocation, availability checks, and task history in one workspace.",
};

const emptyPlan = {
  name: "",
  price: "",
  features: "",
};

function detailsText(details) {
  if (!details) return "";
  if (typeof details === "string") return details;
  return Object.entries(details)
    .map(([key, value]) => {
      if (String(key).toLowerCase().includes("avatar") || String(value).startsWith?.("data:image/")) {
        return `${key}: [avatar image]`;
      }

      const text = Array.isArray(value) ? value.join(", ") : String(value ?? "");
      return `${key}: ${text.length > 160 ? `${text.slice(0, 160)}...` : text}`;
    })
    .join(" | ");
}

function formatDate(value) {
  if (!value) return "No timestamp";
  return new Date(value).toLocaleString();
}

function featureList(details) {
  if (Array.isArray(details?.features)) return details.features;
  if (typeof details?.features === "string") {
    return details.features
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export default function PlatformAdminConsole() {
  const [data, setData] = useState(null);
  const [homepage, setHomepage] = useState(emptyHomepage);
  const [plan, setPlan] = useState(emptyPlan);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeDetail, setActiveDetail] = useState(null);

  async function loadData() {
    try {
      setError("");
      const response = await fetch("/api/platform-admin", { headers: await getAuthHeaders() });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load platform admin data.");
      }

      setData(result);
      setHomepage({
        heroTitle: result.homepage?.details?.heroTitle ?? emptyHomepage.heroTitle,
        announcement: result.homepage?.details?.announcement ?? emptyHomepage.announcement,
      });
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(loadData, 0);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!activeDetail) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") {
        setActiveDetail(null);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [activeDetail]);

  const sentiment = useMemo(() => {
    const rows = data?.feedback ?? [];
    return {
      positive: rows.filter((row) => Number(row.details.rating) >= 4).length,
      neutral: rows.filter((row) => Number(row.details.rating) === 3).length,
      negative: rows.filter((row) => Number(row.details.rating) <= 2).length,
    };
  }, [data]);

  const detailSections = useMemo(
    () => ({
      feedback: {
        eyebrow: "US-23 Feedback details",
        title: "Customer feedback records",
        description: "Review every rating, comment, category, and moderation status submitted by customers.",
        rows: data?.feedback ?? [],
        empty: "No feedback has been submitted yet.",
        renderRow: (row) => <FeedbackDetail key={row.log_id} row={row} />,
      },
      inquiries: {
        eyebrow: "US-25 Inquiry details",
        title: "Open support queue",
        description: "Inspect each contact request so the platform team can follow up or mark it resolved.",
        rows: data?.inquiries ?? [],
        empty: "No contact inquiries are waiting for review.",
        renderRow: (row) => <InquiryDetail key={row.log_id} row={row} />,
      },
      avatarReviews: {
        eyebrow: "Profile avatar details",
        title: "Avatar review queue",
        description: "Inspect profile avatar uploads and moderation outcomes.",
        rows: data?.avatarReviews ?? [],
        empty: "No avatar uploads are waiting for review.",
        renderRow: (row) => <AvatarReviewDetail key={row.log_id} row={row} />,
      },
      logs: {
        eyebrow: "US-20 Activity details",
        title: "Platform activity history",
        description: "Audit the latest homepage, pricing, feedback, and support-management actions.",
        rows: data?.logs ?? [],
        empty: "No platform activity has been recorded yet.",
        renderRow: (row) => <LogDetail key={row.log_id} row={row} />,
      },
      plans: {
        eyebrow: "US-22 Pricing details",
        title: "Published subscription plans",
        description: "Review visible plan names, prices, feature lists, and publication timestamps.",
        rows: data?.plans ?? [],
        empty: "No pricing plans are currently published.",
        renderRow: (row) => <PlanDetail key={row.log_id} row={row} />,
      },
    }),
    [data],
  );

  async function postPlatformAction(payload, successMessage) {
    try {
      setError("");
      setMessage("");
      const response = await fetch("/api/platform-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not save platform action.");
      }

      setMessage(successMessage);
      await loadData();
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  return (
    <div className="space-y-6">
      {error ? <p className="dashboard-alert-error">{error}</p> : null}
      {message ? <p className="dashboard-alert-info">{message}</p> : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <Metric
          label="Feedback"
          value={data?.analytics?.feedbackCount ?? 0}
          detail={`${data?.analytics?.pendingFeedbackCount ?? 0} pending`}
          onOpen={() => setActiveDetail("feedback")}
          active={activeDetail === "feedback"}
          testId="metric-feedback"
        />
        <Metric
          label="Open inquiries"
          value={data?.analytics?.openInquiryCount ?? 0}
          detail="Support queue"
          onOpen={() => setActiveDetail("inquiries")}
          active={activeDetail === "inquiries"}
          testId="metric-inquiries"
        />
        <Metric
          label="Avatar reviews"
          value={data?.analytics?.pendingAvatarReviewCount ?? 0}
          detail="Pending approval"
          onOpen={() => setActiveDetail("avatarReviews")}
          active={activeDetail === "avatarReviews"}
          testId="metric-avatar-reviews"
        />
        <Metric
          label="Activity logs"
          value={data?.analytics?.logCount ?? 0}
          detail="Latest platform actions"
          onOpen={() => setActiveDetail("logs")}
          active={activeDetail === "logs"}
          testId="metric-logs"
        />
        <Metric
          label="Published plans"
          value={data?.plans?.length ?? 0}
          detail="Visible pricing options"
          onOpen={() => setActiveDetail("plans")}
          active={activeDetail === "plans"}
          testId="metric-plans"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="dashboard-card p-6">
          <p className="dashboard-eyebrow">US-21 Homepage management</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Marketing homepage content</h2>
          <div className="mt-5 grid gap-4">
            <input
              value={homepage.heroTitle}
              onChange={(event) => setHomepage((current) => ({ ...current, heroTitle: event.target.value }))}
              className="dashboard-input"
              placeholder="Hero title"
            />
            <textarea
              value={homepage.announcement}
              onChange={(event) => setHomepage((current) => ({ ...current, announcement: event.target.value }))}
              className="dashboard-textarea"
              placeholder="Homepage announcement"
            />
          </div>
          <button
            type="button"
            onClick={() => postPlatformAction({ type: "homepage", ...homepage }, "Homepage content saved.")}
            className="dashboard-button mt-5"
          >
            Save Homepage Content
          </button>
        </section>

        <section className="dashboard-card p-6">
          <p className="dashboard-eyebrow">US-24 Feedback analysis</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Feedback signal</h2>
          <div className="mt-6 grid gap-3">
            <Signal label="Positive" value={sentiment.positive} tone="bg-emerald-100 text-emerald-800" />
            <Signal label="Neutral" value={sentiment.neutral} tone="bg-sky-100 text-sky-800" />
            <Signal label="Needs attention" value={sentiment.negative} tone="bg-rose-100 text-rose-800" />
          </div>
        </section>
      </div>

      <section className="dashboard-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="dashboard-eyebrow">US-22 Subscription plans</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Create or update visible plans</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              postPlatformAction({ type: "plan", ...plan }, "Subscription plan saved.");
              setPlan(emptyPlan);
            }}
            className="dashboard-button"
          >
            Save Plan
          </button>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_2fr]">
          <input value={plan.name} onChange={(event) => setPlan((current) => ({ ...current, name: event.target.value }))} className="dashboard-input" placeholder="Plan name" />
          <input value={plan.price} onChange={(event) => setPlan((current) => ({ ...current, price: event.target.value }))} className="dashboard-input" placeholder="Price" />
          <textarea value={plan.features} onChange={(event) => setPlan((current) => ({ ...current, features: event.target.value }))} className="dashboard-textarea min-h-20" placeholder={"One feature per line"} />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {(data?.plans ?? []).map((row) => (
            <article key={row.log_id} className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <h3 className="font-black text-slate-950">{row.details.name}</h3>
              <p className="mt-1 text-sm font-bold text-teal-700">{row.details.price}</p>
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {(row.details.features ?? []).map((feature) => (
                  <li key={feature}>- {feature}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <AvatarReviewList
          rows={data?.avatarReviews ?? []}
          action={(row, status) =>
            postPlatformAction({ type: "avatar-review-status", logId: row.log_id, status }, `Avatar review marked ${status}.`)
          }
        />
        <RecordList
          title="US-23 Manage user feedback"
          rows={data?.feedback ?? []}
          empty="No feedback submitted yet."
          action={(row, status) =>
            postPlatformAction({ type: "feedback-status", logId: row.log_id, status }, `Feedback marked ${status}.`)
          }
          actions={["Pending", "Published", "Hidden"]}
          actionLabels={{ Pending: "Keep pending", Published: "Publish", Hidden: "Hide" }}
          defaultStatus="Pending"
        />
        <RecordList
          title="US-25 Manage contact inquiries"
          rows={data?.inquiries ?? []}
          empty="No support inquiries submitted yet."
          action={(row, status) =>
            postPlatformAction({ type: "inquiry-status", logId: row.log_id, status }, `Inquiry marked ${status}.`)
          }
          actions={["Open", "Resolved"]}
          defaultStatus="Open"
        />
      </div>

      <section className="dashboard-card p-6">
        <p className="dashboard-eyebrow">US-20 System activity logs</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">Recent platform activity</h2>
        <div className="mt-5 max-h-[420px] space-y-3 overflow-y-auto pr-2">
          {(data?.logs ?? []).map((log) => (
            <article key={log.log_id} className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-black text-slate-950">{log.action}</h3>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {log.created_at ? new Date(log.created_at).toLocaleString() : ""}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{detailsText(log.details)}</p>
            </article>
          ))}
        </div>
      </section>

      <DetailDialog config={activeDetail ? detailSections[activeDetail] : null} onClose={() => setActiveDetail(null)} />
    </div>
  );
}

function Metric({ label, value, detail, onOpen, active, testId }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid={testId}
      aria-label={`View ${label} details`}
      className={`dashboard-card group block w-full p-5 text-left focus:outline-none focus:ring-4 focus:ring-teal-300/45 ${
        active ? "border-teal-300 shadow-[0_0_0_1px_rgba(45,212,191,0.45),0_28px_90px_rgba(8,18,38,0.2)]" : ""
      }`}
    >
      <p className="dashboard-eyebrow">{label}</p>
      <div className="mt-3 flex items-end justify-between">
        <span className="text-4xl font-black text-slate-950">{value}</span>
        <span className="text-sm font-bold text-slate-500">{detail}</span>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-200/70 pt-3">
        <span className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">View details</span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-teal-100 text-base font-black text-teal-800 transition group-hover:translate-x-1">
          &rarr;
        </span>
      </div>
    </button>
  );
}

function Signal({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 p-4">
      <span className="font-bold text-slate-700">{label}</span>
      <span className={`rounded-full px-3 py-1 text-sm font-black ${tone}`}>{value}</span>
    </div>
  );
}

function AvatarReviewList({ rows, action }) {
  const reviewRows = rows.filter((row) => row.details?.status === "Pending");

  return (
    <section className="dashboard-card p-6">
      <p className="dashboard-eyebrow">Profile avatar review</p>
      <h2 className="mt-1 text-xl font-black text-slate-950">Approve profile avatars</h2>
      <div className="mt-5 space-y-3">
        {reviewRows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
            No avatar uploads are waiting for review.
          </p>
        ) : null}
        {reviewRows.map((row) => (
          <article key={row.log_id} className="rounded-2xl border border-slate-200 bg-white/70 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <AvatarPreview src={row.details?.avatarDataUrl} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={row.details?.status || "Pending"} />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {formatDate(row.created_at)}
                  </span>
                </div>
                <h3 className="mt-3 font-black text-slate-950">{row.details?.name || "Profile user"}</h3>
                <p className="mt-1 break-words text-sm text-slate-600">{row.details?.email || row.details?.userId}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Approved", "Rejected"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => action(row, status)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-800"
                >
                  {status}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AvatarPreview({ src }) {
  return (
    <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 text-xl font-black text-slate-600">
      {src ? <Image src={src} alt="" fill sizes="80px" unoptimized className="object-cover" /> : <span>AV</span>}
    </div>
  );
}

function RecordList({ title, rows, empty, action, actions, defaultStatus, actionLabels = {} }) {
  return (
    <section className="dashboard-card p-6">
      <p className="dashboard-eyebrow">{title}</p>
      <div className="mt-5 space-y-3">
        {rows.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">{empty}</p> : null}
        {rows.map((row) => {
          const currentStatus = row.details?.status || defaultStatus;

          return (
            <article key={row.log_id} className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={currentStatus} />
                {row.details?.priority ? (
                  <span className="inline-flex rounded-full bg-teal-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-teal-800">
                    Priority support
                  </span>
                ) : null}
              </div>
              <p className="text-sm leading-6 text-slate-700">{detailsText(row.details)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {actions.map((item) => {
                  const label = actionLabels[item] ?? item;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => action(row, item)}
                      className={`rounded-full border px-4 py-2 text-xs font-black transition hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-800 ${
                        currentStatus === item ? "border-teal-300 bg-teal-100 text-teal-900" : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function StatusBadge({ status }) {
  const tone =
    status === "Published" || status === "Approved"
      ? "bg-emerald-100 text-emerald-800"
      : status === "Hidden" || status === "Rejected"
        ? "bg-slate-200 text-slate-700"
        : status === "Resolved"
          ? "bg-sky-100 text-sky-800"
          : "bg-amber-100 text-amber-800";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${tone}`}>
      {status}
    </span>
  );
}

function DetailDialog({ config, onClose }) {
  if (!config) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" data-testid="detail-dialog">
      <button
        type="button"
        aria-label="Close detail panel"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="platform-detail-title"
        className="relative max-h-[86vh] w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/20 bg-slate-950/95 text-white shadow-2xl"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(94,234,212,0.24),transparent_30rem),radial-gradient(circle_at_80%_20%,rgba(125,211,252,0.16),transparent_26rem)]" />
        <div className="relative flex flex-col gap-5 border-b border-white/10 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="dashboard-eyebrow text-teal-200">{config.eyebrow}</p>
            <h2 id="platform-detail-title" className="mt-2 text-3xl font-black tracking-tight text-white">
              {config.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{config.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-teal-300/35"
          >
            Close
          </button>
        </div>
        <div className="relative max-h-[58vh] overflow-y-auto p-6">
          {config.rows.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-white/20 bg-white/10 p-6 text-sm font-bold text-slate-300">
              {config.empty}
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">{config.rows.map((row) => config.renderRow(row))}</div>
          )}
        </div>
      </section>
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div>
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-teal-200">{label}</p>
      <p className="mt-1 text-sm font-bold leading-6 text-white">{value || "Not provided"}</p>
    </div>
  );
}

function FeedbackDetail({ row }) {
  const details = row.details ?? {};

  return (
    <article className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl shadow-slate-950/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-200">Feedback</p>
          <h3 className="mt-2 text-lg font-black text-white">{details.name || details.author || "Customer"}</h3>
        </div>
        <span className="rounded-full bg-teal-300 px-3 py-1 text-sm font-black text-slate-950">{details.rating ?? "-"} / 5</span>
      </div>
      <p className="mt-4 rounded-2xl bg-white/10 p-4 text-sm leading-6 text-slate-200">
        {details.message || details.comment || detailsText(details)}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <DetailField label="Category" value={details.category || details.type} />
        <DetailField label="Status" value={details.status || "Pending"} />
        <DetailField label="Submitted" value={formatDate(row.created_at)} />
        <DetailField label="Source" value={row.action || "User feedback"} />
        <DetailField label="Moderation note" value={details.moderationNote} />
      </div>
    </article>
  );
}

function AvatarReviewDetail({ row }) {
  const details = row.details ?? {};

  return (
    <article className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl shadow-slate-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-3xl border border-white/20 bg-white/10 text-xl font-black text-white">
          {details.avatarDataUrl ? (
            <Image src={details.avatarDataUrl} alt="" fill sizes="96px" unoptimized className="object-cover" />
          ) : (
            <span>AV</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-200">Avatar upload</p>
          <h3 className="mt-2 text-lg font-black text-white">{details.name || "Profile user"}</h3>
          <p className="mt-1 break-words text-sm font-bold text-slate-300">{details.email || details.userId}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <DetailField label="Status" value={details.status || "Pending"} />
        <DetailField label="Submitted" value={formatDate(row.created_at)} />
        <DetailField label="Moderated" value={formatDate(details.moderatedAt)} />
        <DetailField label="Note" value={details.moderationNote} />
      </div>
    </article>
  );
}

function InquiryDetail({ row }) {
  const details = row.details ?? {};

  return (
    <article className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl shadow-slate-950/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-200">{details.inquiryType || "Contact inquiry"}</p>
          <h3 className="text-lg font-black text-white">{details.name || "Customer"}</h3>
          <p className="text-sm font-bold text-slate-300">{details.email || "No email supplied"}</p>
        </div>
        {details.priority ? (
          <span className="rounded-full bg-teal-300 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-950">
            Priority
          </span>
        ) : null}
      </div>
      <p className="mt-4 rounded-2xl bg-white/10 p-4 text-sm leading-6 text-slate-200">
        {details.message || detailsText(details)}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <DetailField label="Status" value={details.status || "Open"} />
        <DetailField label="Plan" value={details.subscriptionTier || "Free"} />
        <DetailField label="Submitted" value={formatDate(row.created_at)} />
      </div>
    </article>
  );
}

function LogDetail({ row }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl shadow-slate-950/20">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="text-lg font-black text-white">{row.action || "Platform action"}</h3>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-teal-100">
          {formatDate(row.created_at)}
        </span>
      </div>
      <p className="mt-4 rounded-2xl bg-white/10 p-4 text-sm leading-6 text-slate-200">{detailsText(row.details)}</p>
    </article>
  );
}

function PlanDetail({ row }) {
  const details = row.details ?? {};
  const features = featureList(details);

  return (
    <article className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl shadow-slate-950/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-200">Plan</p>
          <h3 className="mt-2 text-lg font-black text-white">{details.name || "Unnamed plan"}</h3>
        </div>
        <span className="rounded-full bg-teal-300 px-3 py-1 text-sm font-black text-slate-950">{details.price || "$0"}</span>
      </div>
      <ul className="mt-4 space-y-2 rounded-2xl bg-white/10 p-4 text-sm leading-6 text-slate-200">
        {features.length > 0 ? features.map((feature) => <li key={feature}>- {feature}</li>) : <li>No features listed.</li>}
      </ul>
      <div className="mt-4">
        <DetailField label="Published" value={formatDate(row.created_at)} />
      </div>
    </article>
  );
}
