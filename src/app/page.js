"use client";

import Link from "next/link";
import { Inter } from "next/font/google";
import LaserFlow from "@/components/LaserFlow";
import LandingNav from "@/components/LandingNav";
import LanyardShowcase from "@/components/LanyardShowcase";
import OrganizationLogoLoop from "@/components/OrganizationLogoLoop";
import FeatureShowcase from "@/components/FeatureShowcase";
import TestimonialsSection from "@/components/TestimonialsSection";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const workspaceStats = [
  { value: "14", label: "Demo accounts", detail: "Platform, user admin, manager, and employee roles are ready." },
  { value: "4", label: "Role dashboards", detail: "Each role opens a dedicated workspace after login." },
  { value: "11", label: "Employee profiles", detail: "Seeded staff include skills, teams, avatars, and availability." },
  { value: "24/7", label: "Support queue", detail: "Support tickets, feedback, and avatar reviews route to admins." },
];

const workflowHighlights = [
  "Clock-in status controls whether managers can assign work.",
  "Feedback can be reviewed, published, or hidden by Platform Admin.",
  "Paid account badges and priority support are visible across admin tools.",
];

const footerLinks = [
  { href: "/features", label: "Features" },
  { href: "/plans", label: "Plans" },
  { href: "/feedback", label: "Feedback" },
  { href: "/support", label: "Support" },
];

export default function Home() {
  return (
    <main className={`${inter.className} overflow-x-hidden bg-black`}>
      <section className="relative min-h-[140vh] overflow-hidden">
        <LandingNav />

        <div className="pointer-events-none absolute left-[50%] -top-20 z-[10] h-[145.5vh] min-h-[360px] w-screen -translate-x-1/2 overflow-hidden">
          <LaserFlow
            horizontalBeamOffset={0.1}
            verticalBeamOffset={0}
            horizontalSizing={0.6}
            verticalSizing={1.5}
            wispDensity={1}
            wispSpeed={15}
            wispIntensity={20}
            flowSpeed={0.35}
            flowStrength={0.25}
            fogIntensity={0.8}
            fogScale={0.3}
            fogFallSpeed={0.6}
            decay={1.1}
            falloffStart={1.2}
            color="#2563EB"
            className="absolute inset-0 translate-y-14"
          />
        </div>

        <div className="absolute left-[18%] top-[20%] z-10 max-w-[600px]">
          <h1 className="text-background font-bold leading-[1.2] tracking-[0.8] md:text-3xl lg:text-6xl bg-[linear-gradient(90deg,#FFFFFF_0%,#FFFFFF_30%,#2563EB_45%,#000000_95%)] bg-clip-text text-transparent">
            Every Great Team Runs on Optima
          </h1>
          <p className="mt-4 text-md font-light text-white">
            One intelligent workspace for everything your team needs
          </p>
          <Link
            href="/demo"
            className="mt-12 inline-flex h-14 min-w-56 items-center justify-center rounded-full border border-white/80 bg-white px-8 text-sm font-bold uppercase tracking-normal text-[#1E293B] shadow-[0_0_22px_rgba(37,99,235,0.7),0_0_48px_rgba(37,99,235,0.45)] transition hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(37,99,235,0.9),0_0_72px_rgba(37,99,235,0.55)]"
          >
            Discover What&apos;s Possible <span className="ml-2 mb-1 text-2xl leading-none">→</span>
          </Link>
        </div>

        <section
          aria-label="Dashboard preview"
          className="absolute left-1/2 top-[70vh] z-[6] h-[52vh] min-h-[360px] w-[65%] -translate-x-1/2 overflow-hidden rounded-[20px] border-2 border-[#2563EB] bg-[#120F17] shadow-[0_0_90px_rgba(37,99,235,0.9)]"
        />
      </section>

      <FeatureShowcase />

      <TestimonialsSection />

      <section className="relative overflow-hidden bg-white px-6 py-24 text-[#071739] sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#2563EB]">User statistics</p>
            <h2 className="mt-5 max-w-2xl text-4xl font-black leading-tight text-[#071739] sm:text-5xl">
              A complete demo workspace for every testing role.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#46607F]">
              The seeded Optima organization includes role-based dashboards, account management,
              workflow feedback, support routing, task allocation, and employee availability data.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {workspaceStats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-[20px] border border-[#C7DDF6] bg-[#F5FAFF] p-6 shadow-[0_18px_45px_rgba(7,23,57,0.08)]"
              >
                <p className="text-4xl font-black text-[#0B2F78]">{stat.value}</p>
                <h3 className="mt-3 text-lg font-bold text-[#071739]">{stat.label}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5E7390]">{stat.detail}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-7xl rounded-[28px] border border-[#C7DDF6] bg-[#EAF5FF] p-6 shadow-[0_18px_45px_rgba(7,23,57,0.08)]">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#46607F]">Testing coverage</p>
              <h3 className="mt-3 text-2xl font-black text-[#071739]">One-click login now reaches the core product flows.</h3>
            </div>
            <div className="grid gap-3">
              {workflowHighlights.map((item) => (
                <div key={item} className="rounded-2xl border border-white/70 bg-white/70 px-5 py-4 text-sm font-semibold text-[#244464]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <OrganizationLogoLoop />

      <LanyardShowcase />

      <section className="relative overflow-hidden bg-black px-6 py-16 text-white sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl border-t border-white/10 pt-10">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#7DB7FF]">Optima</p>
              <h2 className="mt-4 max-w-2xl text-3xl font-black leading-tight sm:text-4xl">
                Smart task allocation for teams that need decisions they can explain.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/60">
                Test the full workflow with one-click role access, seeded accounts, live feedback
                moderation, support queues, and availability-aware assignment tools.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.24em] text-white/50">Explore</h3>
                <div className="mt-4 grid gap-3">
                  {footerLinks.map((link) => (
                    <Link key={link.href} href={link.href} className="text-sm font-semibold text-white/75 transition hover:text-white">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.24em] text-white/50">Demo login</h3>
                <div className="mt-4 grid gap-3">
                  <Link
                    href="/login"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white text-sm font-bold text-[#071739] transition hover:bg-[#DCEEFF]"
                  >
                    Open one-click login
                  </Link>
                  <p className="text-xs leading-6 text-white/50">
                    Demo roles: Platform Admin, User Admin, Manager, and Employee.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
            <p>Copyright 2026 Optima Demo Organization. All rights reserved.</p>
            <p>Built for local FYP testing and product walkthroughs.</p>
          </div>
        </div>
      </section>

    </main>
  );
}
