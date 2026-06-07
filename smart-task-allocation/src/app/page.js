"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import { featuredFeedback } from "@/lib/feedbackData";

const platformStats = [
  { label: "Open tasks routed", value: "128", detail: "today" },
  { label: "Eligible staff found", value: "42", detail: "across teams" },
  { label: "Schedule conflicts", value: "0", detail: "after checks" },
];

const heroHighlights = [
  { label: "Live readiness", value: "94%", text: "staff capacity visible before assignment" },
  { label: "Auto-match", value: "3 checks", text: "availability, conflict, skill fit" },
  { label: "Audit trail", value: "Every task", text: "requests, approvals, and updates retained" },
];

const features = [
  {
    title: "Smart employee matching",
    text: "Check availability, working windows, skills, qualifications, and current workload before assigning work.",
  },
  {
    title: "Clear task operations",
    text: "Create, update, delete, request, approve, and track tasks from one focused workflow.",
  },
  {
    title: "Role-based workspaces",
    text: "User admins, managers, employees, platform admins, and guests each see the tools they need.",
  },
];

const workflowSteps = [
  "Manager creates an open task",
  "System checks eligibility and conflicts",
  "Employee receives or requests assignment",
  "Progress, clock events, and history are tracked",
];

const outcomeCards = [
  {
    title: "Managers move faster",
    text: "Priority work, eligible employees, and exceptions are visible in one allocation command view.",
  },
  {
    title: "Employees stay clear",
    text: "Assignments, requests, availability, and clock events are separated into simple daily work screens.",
  },
  {
    title: "Admins keep control",
    text: "Plans, feedback, support inquiries, user roles, and organization profiles remain manageable.",
  },
];

const plans = [
  {
    title: "Starter",
    price: "Free",
    text: "For small teams starting with simple task tracking.",
    features: ["Task dashboard", "Employee list", "Manual assignment"],
  },
  {
    title: "Team",
    price: "Growth",
    text: "For SMEs that need smarter daily allocation.",
    featured: true,
    features: ["Smart allocation", "Availability checks", "Request approval"],
  },
  {
    title: "Enterprise",
    price: "Custom",
    text: "For organizations with advanced workflow needs.",
    features: ["AI recommendations", "Priority support", "Custom reporting"],
  },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [supportForm, setSupportForm] = useState({
    name: "",
    email: "",
    inquiryType: "General Question",
    message: "",
  });
  const [supportMessage, setSupportMessage] = useState("");
  const [supportError, setSupportError] = useState("");

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 48);
    }

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function updateSupportField(field, value) {
    setSupportForm((current) => ({ ...current, [field]: value }));
  }

  async function submitSupportInquiry(event) {
    event.preventDefault();
    setSupportMessage("");
    setSupportError("");

    try {
      const response = await fetch("/api/contact-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supportForm),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not submit support inquiry.");
      }

      setSupportMessage("Your inquiry has been submitted.");
      setSupportForm({
        name: "",
        email: "",
        inquiryType: "General Question",
        message: "",
      });
    } catch (error) {
      setSupportError(error.message);
    }
  }

  return (
    <main className="landing-flow relative min-h-screen overflow-hidden text-white">
      <AnimatedBackdrop />
      <header
        className={`animate-slide-down fixed inset-x-0 top-0 z-50 border-b transition ${
          scrolled
            ? "border-white/10 bg-[#071428]/90 shadow-lg backdrop-blur"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="button-lift">
            <BrandLogo />
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-white/75 lg:flex">
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#workflow" className="hover:text-white">
              Workflow
            </a>
            <Link href="/feedback" className="hover:text-white">
              Feedback
            </Link>
            <a href="#pricing" className="hover:text-white">
              Pricing
            </a>
            <a href="#contact" className="hover:text-white">
              Contact
            </a>
          </nav>

          <Link
            href="/login"
            className="button-lift rounded-lg bg-white px-5 py-2.5 text-sm font-black text-[#071428] hover:bg-[#D9F99D]"
          >
            Sign in
          </Link>
        </div>
      </header>

      <section className="relative isolate z-10 overflow-hidden pt-24">
        <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="animate-reveal inline-flex rounded-lg border border-[#5EEAD4]/30 bg-[#5EEAD4]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#A7F3D0]">
              Smart Task Allocation Platform
            </p>
            <h1 className="animate-reveal delay-100 mt-7 max-w-3xl text-5xl font-black leading-tight tracking-tight md:text-7xl">
              Assign the right work to the right people.
            </h1>
            <p className="animate-reveal delay-200 mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              TaskNova helps SMEs reduce manual scheduling, avoid double booking, and keep task progress visible across managers and employees.
            </p>

            <div className="animate-reveal delay-300 mt-6 flex flex-wrap gap-3">
              <span className="landing-pill">Paid Pro automation</span>
              <span className="landing-pill">Employee ability grid</span>
              <span className="landing-pill">Role-based dashboards</span>
            </div>

            <div className="animate-reveal delay-300 mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="button-lift rounded-lg bg-[#5EEAD4] px-7 py-3 text-center text-sm font-black text-[#071428] shadow-[0_18px_50px_rgba(94,234,212,0.28)] hover:bg-[#99F6E4]"
              >
                Create workspace
              </Link>
              <a
                href="#features"
                className="button-lift rounded-lg border border-white/20 bg-white/10 px-7 py-3 text-center text-sm font-black text-white hover:bg-white/15"
              >
                Explore features
              </a>
            </div>

            <div className="animate-reveal delay-400 mt-12 grid max-w-2xl gap-3 sm:grid-cols-3">
              {platformStats.map((stat, index) => (
                <div key={stat.label} className={`motion-card rounded-lg border border-white/10 bg-white/10 p-4 delay-${Math.min(index + 1, 4)}00`}>
                  <p className="text-3xl font-black text-white">{stat.value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-300">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="animate-reveal delay-400 mt-5 grid max-w-2xl gap-3 md:grid-cols-3">
              {heroHighlights.map((item) => (
                <HeroSignal key={item.label} {...item} />
              ))}
            </div>
          </div>

          <DashboardPreview />
        </div>
      </section>

      <OutcomeBand />

      <section id="features" className="relative z-10 overflow-hidden px-6 py-28 text-white">
        <div className="relative mx-auto max-w-7xl">
          <SectionTitle
            dark
            label="Core Features"
            title="Built around real allocation decisions"
            text="The platform connects task requirements with employee capacity so managers can move faster without losing control."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} index={index + 1} {...feature} />
            ))}
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {outcomeCards.map((card) => (
              <OutcomeCard key={card.title} {...card} />
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="relative z-10 overflow-hidden px-6 py-28 text-white">
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <SectionTitle
            dark
            alignLeft
            label="Workflow"
            title="From open task to completed work"
            text="Every allocation produces a clear trail: who requested, who approved, who was assigned, and how the task progressed."
          />
          <div className="grid gap-4">
            {workflowSteps.map((step, index) => (
              <div key={step} className="motion-card grid grid-cols-[44px_1fr] gap-4 rounded-lg border border-white/10 bg-white/10 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-xl">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#5EEAD4] text-sm font-black text-[#071428]">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-black text-white">{step}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    {index === 1
                      ? "Availability, duplicate booking, active assignments, skills, and qualifications are checked before confirmation."
                      : "The system keeps the next action clear for the responsible role."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="feedback" className="relative z-10 overflow-hidden px-6 py-28 text-white">
        <div className="relative mx-auto max-w-7xl">
          <SectionTitle
            dark
            label="User Feedback"
            title="Designed for small teams that need clarity"
            text="TaskNova presents allocation work in simple screens for daily operations."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {featuredFeedback.map((item) => (
              <TestimonialCard key={item.name} {...item} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/feedback"
              className="button-lift inline-flex h-12 items-center justify-center rounded-md bg-[#0B2B45] px-7 text-sm font-black text-white transition hover:bg-[#123D5D]"
            >
              View all customer feedback
            </Link>
          </div>
        </div>
      </section>

      <section id="pricing" className="relative z-10 overflow-hidden px-6 py-28">
        <div className="relative mx-auto max-w-7xl">
          <SectionTitle
            dark
            label="Plans"
            title="Start lean, add intelligence as you grow"
            text="The PRD supports basic operations, smart allocation, analytics, AI recommendations, and support workflows."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {plans.map((plan) => (
              <PricingCard key={plan.title} {...plan} />
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="relative z-10 px-6 py-28 text-white">
        <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1fr] lg:items-start">
          <SectionTitle
            dark
            alignLeft
            label="Contact Support"
            title="Questions before signing up?"
            text="Send a technical, pricing, account registration, or general inquiry to platform support."
          />

          <form onSubmit={submitSupportInquiry} className="motion-card rounded-lg border border-white/15 bg-white/90 p-6 text-[#071428] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                value={supportForm.name}
                onChange={(event) => updateSupportField("name", event.target.value)}
                placeholder="Name"
                className="h-12 rounded-md border border-[#B8C4D8] px-3 text-sm outline-none"
                required
              />
              <input
                type="email"
                value={supportForm.email}
                onChange={(event) => updateSupportField("email", event.target.value)}
                placeholder="Email address"
                className="h-12 rounded-md border border-[#B8C4D8] px-3 text-sm outline-none"
                required
              />
            </div>
            <select
              value={supportForm.inquiryType}
              onChange={(event) => updateSupportField("inquiryType", event.target.value)}
              className="mt-4 h-12 w-full rounded-md border border-[#B8C4D8] bg-white px-3 text-sm outline-none"
            >
              <option>Technical Support</option>
              <option>Pricing</option>
              <option>Account Registration</option>
              <option>General Question</option>
            </select>
            <textarea
              value={supportForm.message}
              onChange={(event) => updateSupportField("message", event.target.value)}
              placeholder="Message"
              className="mt-4 min-h-32 w-full rounded-md border border-[#B8C4D8] px-3 py-2 text-sm outline-none"
              required
            />
            {supportError ? <p className="mt-4 text-sm font-semibold text-red-700">{supportError}</p> : null}
            {supportMessage ? <p className="mt-4 text-sm font-semibold text-[#0F766E]">{supportMessage}</p> : null}
            <button className="mt-5 h-12 rounded-md bg-[#0B2B45] px-6 text-sm font-black text-white transition hover:bg-[#123D5D]">
              Submit Inquiry
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function AnimatedBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="animated-base absolute inset-0" />
      <div className="animated-mesh absolute inset-0" />
      <div className="aurora-ribbon ribbon-one absolute left-[-10%] top-[8%] h-72 w-[120%] rotate-[-8deg]" />
      <div className="aurora-ribbon ribbon-two absolute left-[-12%] top-[42%] h-80 w-[125%] rotate-[7deg]" />
      <div className="aurora-ribbon ribbon-three absolute left-[-18%] bottom-[5%] h-72 w-[130%] rotate-[-4deg]" />
      <div className="particle-field absolute inset-0" />
      <div className="site-vignette absolute inset-0" />
    </div>
  );
}

function HeroSignal({ label, value, text }) {
  return (
    <div className="hero-signal-card">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-100">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-300">{text}</p>
    </div>
  );
}

function OutcomeBand() {
  return (
    <section className="relative z-10 px-6">
      <div className="mx-auto grid max-w-7xl gap-4 rounded-[28px] border border-white/12 bg-white/8 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.22)] backdrop-blur-2xl md:grid-cols-4">
        <div className="rounded-3xl bg-[#5EEAD4] p-5 text-[#071428]">
          <p className="text-xs font-black uppercase tracking-[0.18em]">Routing health</p>
          <p className="mt-3 text-4xl font-black">Live</p>
          <p className="mt-2 text-sm font-bold">Designed for daily operations, not spreadsheet cleanup.</p>
        </div>
        <OutcomeMetric label="Recommendation confidence" value="98%" />
        <OutcomeMetric label="Conflict scan" value="< 1s" />
        <OutcomeMetric label="Plan visibility" value="3 tiers" />
      </div>
    </section>
  );
}

function OutcomeMetric({ label, value }) {
  return (
    <div className="outcome-metric">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-100">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-[#5EEAD4] to-[#D9F99D]" />
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="animate-reveal delay-300 float-panel relative">
      <div className="command-orbit command-orbit-one" />
      <div className="command-orbit command-orbit-two" />
      <div className="command-shell rounded-[28px] border border-white/15 bg-[#F7FAFC] p-4 text-[#071428] shadow-[0_28px_90px_rgba(0,0,0,0.35)]">
        <div className="overflow-hidden rounded-[22px] border border-[#D8E3EE] bg-white">
          <div className="flex flex-col gap-4 border-b border-[#E2E8F0] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F766E]">Manager Dashboard</p>
              <h2 className="mt-1 text-xl font-black">Live allocation command center</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="pulse-live rounded-md bg-[#DCFCE7] px-3 py-1 text-xs font-black text-[#166534]">Live</span>
              <span className="rounded-md bg-[#E0F2FE] px-3 py-1 text-xs font-black text-[#075985]">Paid Pro</span>
            </div>
          </div>

          <div className="grid gap-4 p-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-3">
              <TaskPreviewRow title="Front desk coverage" person="Alicia Tan" status="Eligible" tone="green" />
              <TaskPreviewRow title="Inventory count" person="Ben Lee" status="Pending" tone="amber" />
              <TaskPreviewRow title="Customer support queue" person="Chen Wei" status="Assigned" tone="blue" />
              <TaskPreviewRow title="Outlet closing checklist" person="Daniel Ong" status="Conflict free" tone="green" />
            </div>

            <div className="space-y-4">
              <div className="rounded-[20px] bg-[#0B2B45] p-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5EEAD4]">Auto recommendation</p>
                    <h3 className="mt-3 text-2xl font-black">Best match found</h3>
                  </div>
                  <div className="confidence-dial">
                    <span>98%</span>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  Ranked by availability, schedule conflicts, workload, and required skills before confirmation.
                </p>
                <div className="motion-card mt-5 rounded-lg bg-white/10 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Alicia Tan</span>
                    <span className="font-black text-[#D9F99D]">Ready</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/10">
                    <div className="progress-sweep h-2 w-[98%] rounded-full bg-[#5EEAD4]" />
                  </div>
                </div>
              </div>
              <div className="allocation-stream">
                <StreamEvent title="Availability checked" text="Monday 09:00-18:00" />
                <StreamEvent title="No duplicate booking" text="0 conflicts detected" />
                <StreamEvent title="Skill fit confirmed" text="Customer Support L5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StreamEvent({ title, text }) {
  return (
    <div className="stream-event">
      <span className="stream-dot" />
      <div>
        <p className="text-sm font-black text-[#071428]">{title}</p>
        <p className="mt-1 text-xs font-bold text-[#52627A]">{text}</p>
      </div>
    </div>
  );
}

function TaskPreviewRow({ title, person, status, tone }) {
  const tones = {
    green: "bg-[#DCFCE7] text-[#166534]",
    amber: "bg-[#FEF3C7] text-[#92400E]",
    blue: "bg-[#DBEAFE] text-[#1E40AF]",
  };

  return (
    <div className="motion-card grid grid-cols-[1fr_auto] gap-3 rounded-lg border border-[#E2E8F0] p-4">
      <div>
        <h3 className="font-black">{title}</h3>
        <p className="mt-1 text-sm text-[#52627A]">{person}</p>
      </div>
      <span className={`h-fit rounded-md px-3 py-1 text-xs font-black ${tones[tone]}`}>{status}</span>
    </div>
  );
}

function SectionTitle({ label, title, text, dark, alignLeft }) {
  return (
    <div className={`mb-12 ${alignLeft ? "text-left" : "text-center"}`}>
      <p className={`text-xs font-black uppercase tracking-[0.22em] ${dark ? "text-[#5EEAD4]" : "text-[#0F766E]"}`}>
        {label}
      </p>
      <h2 className={`mt-4 text-4xl font-black tracking-tight md:text-5xl ${dark ? "text-white" : "text-[#071428]"}`}>
        {title}
      </h2>
      <p className={`mt-5 max-w-2xl text-base leading-8 ${alignLeft ? "" : "mx-auto"} ${dark ? "text-slate-300" : "text-[#52627A]"}`}>
        {text}
      </p>
    </div>
  );
}

function FeatureCard({ index, title, text }) {
  return (
    <article className="animate-reveal motion-card rounded-lg border border-[#D8E3EE] bg-white p-6 shadow-sm">
      <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#E8F6F3] text-sm font-black text-[#0F766E]">
        {String(index).padStart(2, "0")}
      </span>
      <h3 className="mt-6 text-xl font-black">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[#52627A]">{text}</p>
    </article>
  );
}

function OutcomeCard({ title, text }) {
  return (
    <article className="motion-card rounded-[22px] border border-white/12 bg-white/8 p-6 text-white backdrop-blur-xl">
      <span className="inline-flex rounded-full border border-[#5EEAD4]/30 bg-[#5EEAD4]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#A7F3D0]">
        Outcome
      </span>
      <h3 className="mt-5 text-xl font-black">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">{text}</p>
    </article>
  );
}

function TestimonialCard({ quote, name, role, rating }) {
  return (
    <Link href="/feedback" className="animate-reveal motion-card block rounded-lg border border-[#BFE4DD] bg-white p-6 shadow-sm">
      <div className="mb-5 text-sm font-black text-[#0F766E]">
        {"?".repeat(rating)}
        {"?".repeat(5 - rating)}
      </div>
      <p className="text-lg font-semibold leading-8 text-[#0B2B45]">&quot;{quote}&quot;</p>
      <div className="mt-7 border-t border-[#E2E8F0] pt-5">
        <p className="font-black">{name}</p>
        <p className="mt-1 text-sm text-[#52627A]">{role}</p>
        <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-[#0F766E]">
          Read full review
        </p>
      </div>
    </Link>
  );
}

function PricingCard({ title, price, text, features, featured }) {
  return (
    <article
      className={`animate-reveal motion-card rounded-lg border p-6 ${
        featured ? "border-[#5EEAD4] bg-[#0B2B45] text-white shadow-[0_24px_70px_rgba(94,234,212,0.18)]" : "border-white/10 bg-white/5"
      }`}
    >
      <h3 className="text-2xl font-black">{title}</h3>
      <p className={`mt-4 text-4xl font-black ${featured ? "text-[#5EEAD4]" : "text-white"}`}>{price}</p>
      <p className={`mt-3 text-sm leading-6 ${featured ? "text-slate-200" : "text-slate-300"}`}>{text}</p>
      <ul className="mt-6 space-y-3 text-sm">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#5EEAD4]" />
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href="/signup"
        className={`button-lift mt-7 inline-flex h-11 w-full items-center justify-center rounded-md text-sm font-black ${
          featured ? "bg-[#5EEAD4] text-[#071428] hover:bg-[#99F6E4]" : "bg-white text-[#071428] hover:bg-[#D9F99D]"
        }`}
      >
        Get Started
      </Link>
    </article>
  );
}
