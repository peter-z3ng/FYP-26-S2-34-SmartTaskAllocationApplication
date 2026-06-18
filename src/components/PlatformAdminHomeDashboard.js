import Link from "next/link";
import PlatformAdminConsole from "@/components/PlatformAdminConsole";

const operationAreas = [
  {
    title: "Feedback moderation",
    detail: "Review ratings, publish selected feedback to the public homepage, and hide unsuitable comments.",
    status: "Public trust",
  },
  {
    title: "Support queue",
    detail: "Track contact inquiries, flag paid-account priority requests, and close resolved cases.",
    status: "Response control",
  },
  {
    title: "Homepage and plans",
    detail: "Maintain marketing homepage copy and the visible subscription plan list.",
    status: "Guest experience",
  },
  {
    title: "Profile reviews",
    detail: "Approve or reject uploaded profile avatars before they appear across the platform.",
    status: "Account safety",
  },
];

const responseSteps = [
  "New support, feedback, and avatar-review events enter the platform queue.",
  "Platform Admin reviews the latest context, status, and moderation history.",
  "Approved updates are reflected in homepage content, user profiles, or queue status.",
];

const quickLinks = [
  { label: "Management Console", href: "#management-console" },
  { label: "AI Agents", href: "/platformadmin/agents" },
  { label: "Admin Profile", href: "/platformadmin/settings" },
];

export default function PlatformAdminHomeDashboard() {
  return (
    <section className="h-full min-h-0 overflow-hidden rounded-2xl border border-[#BBE1FA] bg-white/80 shadow-sm backdrop-blur">
      <div className="h-full overflow-y-auto p-5 sm:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl bg-[#0d1e4c] p-6 text-white shadow-[0_20px_60px_rgba(13,30,76,0.24)]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-200">Platform Admin</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Platform Admin Home</h1>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
              Central operations view for public homepage content, subscription plans, feedback moderation, support
              inquiries, activity logs, and profile-avatar reviews.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex min-h-11 items-center rounded-full border border-white/15 bg-white/10 px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-teal-200/25"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          <section className="dashboard-card p-6">
            <p className="dashboard-eyebrow">Control scope</p>
            <h2 className="mt-2 text-2xl font-black text-[#07183b]">Admin responsibilities</h2>
            <div className="mt-5 grid gap-3">
              {["Public content", "Pricing operations", "User feedback", "Support inquiries", "Profile review"].map(
                (item) => (
                  <div key={item} className="flex items-center justify-between rounded-2xl bg-[#f4f8fb] px-4 py-3">
                    <span className="text-sm font-black text-[#07183b]">{item}</span>
                    <span className="rounded-full bg-[#dff7ef] px-3 py-1 text-xs font-black text-[#047857]">Active</span>
                  </div>
                ),
              )}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          {operationAreas.map((area) => (
            <article key={area.title} className="dashboard-card p-5">
              <p className="dashboard-eyebrow">{area.status}</p>
              <h3 className="mt-3 text-lg font-black text-[#07183b]">{area.title}</h3>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#52627a]">{area.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="dashboard-card p-6">
            <p className="dashboard-eyebrow">Response workflow</p>
            <h2 className="mt-2 text-2xl font-black text-[#07183b]">Platform review flow</h2>
            <div className="mt-5 grid gap-3">
              {responseSteps.map((step, index) => (
                <div key={step} className="rounded-2xl border border-[#d8e6f3] bg-[#f8fbfe] p-4">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0d1e4c] text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#52627a]">{step}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-card p-6">
            <p className="dashboard-eyebrow">Operations snapshot</p>
            <h2 className="mt-2 text-2xl font-black text-[#07183b]">What the console manages</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["System activity logs", "Audit platform actions"],
                ["Homepage management", "Update public messaging"],
                ["Subscription plans", "Maintain paid tiers"],
                ["Feedback analysis", "Track rating sentiment"],
                ["Inquiry management", "Resolve support cases"],
                ["Avatar moderation", "Approve profile images"],
              ].map(([title, detail]) => (
                <div key={title} className="rounded-2xl bg-[#f4f8fb] p-4">
                  <p className="text-sm font-black text-[#07183b]">{title}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#52627a]">{detail}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section id="management-console" className="mt-6 scroll-mt-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="dashboard-eyebrow">Management console</p>
              <h2 className="mt-2 text-2xl font-black text-[#07183b]">Platform operations workspace</h2>
            </div>
            <span className="rounded-full border border-[#c7ddeb] bg-[#f8fbfe] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#0d1e4c]">
              Live admin tools
            </span>
          </div>
          <PlatformAdminConsole />
        </section>
      </div>
    </section>
  );
}
