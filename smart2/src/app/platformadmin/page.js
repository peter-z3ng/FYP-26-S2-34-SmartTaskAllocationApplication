import Link from "next/link";
import SideMenuLayout from "@/components/SideMenuLayout";

const modules = [
  {
    title: "Homepage Management",
    description: "Maintain guest-facing announcements and platform information.",
    href: "/platformadmin/homepage",
    status: "Content",
  },
  {
    title: "Subscription Plan Management",
    description: "Prepare and update the plan options shown to users.",
    href: "/platformadmin/subscriptions",
    status: "Plans",
  },
  {
    title: "User Feedback Management",
    description: "Review submitted feedback and control what is suitable for display.",
    href: "/platformadmin/feedback",
    status: "Feedback",
  },
  {
    title: "Feedback Analysis",
    description: "Identify common feedback themes and user sentiment patterns.",
    href: "/platformadmin/feedback-analysis",
    status: "Insights",
  },
  {
    title: "Contact Inquiry Management",
    description: "Track guest inquiries and update support response status.",
    href: "/platformadmin/contact-inquiries",
    status: "Support",
  },
  {
    title: "System Activity Logs",
    description: "Monitor allocation and platform activity records.",
    href: "/platformadmin/activity-logs",
    status: "Audit",
  },
];

export default function PlatformAdminHomePage() {
  return (
    <SideMenuLayout actor="platformadmin">
      <header className="pb-6">
        <p className="text-sm font-bold uppercase tracking-wider text-[#57708f]">
          Platform Admin
        </p>
        <h1 className="mt-1 text-3xl font-bold text-[#07183b]">
          Platform Admin Home
        </h1>
        <p className="mt-2 text-sm text-[#52627a]">
          Manage profile, homepage content, feedback, subscriptions, support inquiries, and system monitoring.
        </p>
      </header>

      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-[24px] border-2 border-[#83A6CE] bg-[#E0E5E9] p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-[#57708f]">
              Profile
            </p>
            <p className="mt-2 text-2xl font-black text-[#07183b]">Manage</p>
          </div>
          <div className="rounded-[24px] border-2 border-[#83A6CE] bg-[#E0E5E9] p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-[#57708f]">
              Feedback
            </p>
            <p className="mt-2 text-2xl font-black text-[#07183b]">Review</p>
          </div>
          <div className="rounded-[24px] border-2 border-[#83A6CE] bg-[#E0E5E9] p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-[#57708f]">
              Support
            </p>
            <p className="mt-2 text-2xl font-black text-[#07183b]">Track</p>
          </div>
          <div className="rounded-[24px] border-2 border-[#83A6CE] bg-[#E0E5E9] p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-[#57708f]">
              Logs
            </p>
            <p className="mt-2 text-2xl font-black text-[#07183b]">Monitor</p>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[#07183b]">
              Platform Admin Functions
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#52627a]">
              Select a management area from the sidebar or from the overview below.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {modules.map((module) => (
              <Link
                key={module.title}
                href={module.href}
                className="block rounded-[24px] border-2 border-[#83A6CE] bg-[#E0E5E9] p-5 shadow-sm transition hover:bg-white"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-[#57708f]">
                      {module.status}
                    </p>
                    <h3 className="mt-2 text-lg font-black text-[#07183b]">
                      {module.title}
                    </h3>
                  </div>
                  <span className="rounded-full border border-[#83A6CE] bg-white px-3 py-1 text-xs font-black text-[#07183b]">
                    View
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#52627a]">
                  {module.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#07183b]">Profile</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#52627a]">
            View and update the Platform Admin account information from the profile page.
          </p>
          <Link
            href="/platformadmin/settings"
            className="mt-5 inline-flex rounded-full border border-[#83A6CE] bg-white px-5 py-2.5 text-sm font-bold text-[#07183b] transition hover:bg-[#E0E5E9]"
          >
            View Profile
          </Link>
        </section>
      </div>
    </SideMenuLayout>
  );
}
