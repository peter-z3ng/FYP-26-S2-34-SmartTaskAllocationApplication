"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 120);
    }

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#0D1E4C] text-white">
      {/* Hero */}
      <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#304FA8] via-[#4668C8] to-[#C7DDEB]">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15),transparent_60%)]" />

        {/* Navbar */}
        <header className="relative z-40 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-sm font-black backdrop-blur-md">
              O
            </div>

            <span className="text-lg font-bold tracking-wide">Optima</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-white/85 md:flex">
            <a href="#demo" className="hover:text-white">
              Product Demo
            </a>

            <a href="#testimonials" className="hover:text-white">
              Testimonials
            </a>

            <a href="#announcement" className="hover:text-white">
              Announcement
            </a>

            <a href="#pricing" className="hover:text-white">
              Pricing
            </a>

            <a href="#about" className="hover:text-white">
              About
            </a>
          </nav>

          <Link
            href="/login"
            className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
          >
            Get Started
          </Link>
        </header>

        {/* Scroll Title */}
        <h1
          className={`fixed left-1/2 z-50 -translate-x-1/2 text-center font-extralight tracking-[0.18em] text-white transition-all duration-500 ${
            scrolled
              ? "top-10 left-40 text-2xl md:text-3xl bg-[#BBE1FA]/60 px-6 py-3 rounded-full backdrop-blur-md shadow-sm"
              : "top-32 text-6xl md:text-[9rem]"
          }`}
        >
          Optima
        </h1>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 pt-48 text-center">
          <p className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur-md">
            Smart Task Allocation Platform
          </p>

          <p className="mt-10 max-w-2xl text-lg leading-8 text-white/85">
            Automate task assignment, manage staff availability, and simplify
            daily workforce operations with one intelligent platform.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/login"
              className="rounded-full bg-white/20 px-8 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/30"
            >
              Get Started
            </Link>

            <a
              href="#demo"
              className="rounded-full border border-white/20 bg-white/10 px-8 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
            >
              View Demo
            </a>
          </div>

          {/* Home Preview */}
          <div className="mt-24 w-full max-w-5xl rounded-[36px] border border-white/20 bg-white/10 p-4 shadow-[0_40px_120px_rgba(13,30,76,0.45)] backdrop-blur-xl">
            <div className="rounded-[28px] border border-white/10 bg-[#0D1E4C]/40 p-8">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/60">Home</p>
                  <h2 className="text-2xl font-semibold">
                    Today&apos;s Workforce Overview
                  </h2>
                </div>

                <button className="rounded-full bg-white/15 px-5 py-2 text-xs font-semibold backdrop-blur-md">
                  + Create Task
                </button>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <PreviewCard title="Pending Tasks" value="12" />
                <PreviewCard title="Assigned Staff" value="28" />
                <PreviewCard title="Completed Tasks" value="19" />
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <TaskRow task="Inventory Restock" person="Alicia Tan" />
                <TaskRow task="Outlet Cleaning" person="Ben Lee" />
                <TaskRow task="Customer Support" person="Chen Wei" />
                <TaskRow task="Delivery Packing" person="Daniel Ong" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Demo */}
      <section id="demo" className="bg-[#E0E5E9] px-6 py-28 text-[#0D1E4C]">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            label="Product Demo"
            title="Everything in one intelligent workspace"
            text="Manage staff, allocate tasks, monitor schedules, and improve daily operations through one clean interface."
          />

          <div className="grid gap-6 md:grid-cols-3">
            <DemoCard
              title="Smart Allocation"
              text="Automatically assign suitable employees based on role and availability."
            />

            <DemoCard
              title="Schedule Tracking"
              text="View workforce schedules and task progress in real time."
            />

            <DemoCard
              title="Operational Insights"
              text="Monitor workloads, assignments, and workforce efficiency easily."
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className="bg-white px-6 py-28 text-[#0D1E4C]"
      >
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            label="Testimonials"
            title="Trusted by growing SMEs"
            text="Teams use Optima to reduce manual workload and improve operational efficiency."
          />

          <div className="grid gap-6 md:grid-cols-3">
            <TestimonialCard
              quote="Optima reduced our manual scheduling work significantly."
              name="Alicia Tan"
              role="Operations Manager"
            />

            <TestimonialCard
              quote="The smart allocation feature improved our team productivity."
              name="Ben Lee"
              role="Store Supervisor"
            />

            <TestimonialCard
              quote="Clean interface and simple task management."
              name="Chen Wei"
              role="Business Owner"
            />
          </div>
        </div>
      </section>

      {/* Announcement */}
      <section
        id="announcement"
        className="bg-[#C7DDEB] px-6 py-28 text-[#0D1E4C]"
      >
        <div className="mx-auto max-w-6xl rounded-[36px] bg-white p-10 shadow-[0_25px_80px_rgba(13,30,76,0.12)]">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#4668C8]">
                Announcement
              </p>

              <h2 className="mt-4 text-4xl font-light">
                AI-powered task suggestions coming soon
              </h2>

              <p className="mt-5 max-w-2xl text-[#52627a]">
                Optima is introducing intelligent recommendations to improve task
                allocation accuracy and workforce productivity.
              </p>
            </div>

            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#0D1E4C] px-7 text-sm font-bold text-white transition hover:opacity-90"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-[#0D1E4C] px-6 py-28">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            label="Pricing"
            title="Flexible plans for every organization"
            text="Start free and upgrade when your workforce grows."
            dark
          />

          <div className="grid gap-6 md:grid-cols-3">
            <PricingCard
              title="Starter"
              price="Free"
              features={[
                "Basic task allocation",
                "Employee management",
                "Dashboard overview",
              ]}
            />

            <PricingCard
              title="Team"
              price="--/mo"
              featured
              features={[
                "Smart allocation",
                "Analytics dashboard",
                "Priority support",
              ]}
            />

            <PricingCard
              title="Enterprise"
              price="Custom"
              features={[
                "Advanced AI tools",
                "Custom integrations",
                "Dedicated support",
              ]}
            />
          </div>
        </div>
      </section>

      {/* About */}
      <section
        id="about"
        className="bg-[#E0E5E9] px-6 py-28 text-[#0D1E4C]"
      >
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#4668C8]">
            About Optima
          </p>

          <h2 className="mt-4 text-4xl font-light md:text-5xl">
            Built for modern workforce management
          </h2>

          <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-[#52627a]">
            Optima is a smart task allocation platform designed for SMEs to
            simplify workforce operations, improve scheduling efficiency, and
            automate manual task assignment.
          </p>
        </div>
      </section>
    </main>
  );
}

function PreviewCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-md">
      <p className="text-xs text-white/60">{title}</p>
      <p className="mt-3 text-4xl font-bold">{value}</p>
    </div>
  );
}

function TaskRow({ task, person }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-md">
      <p className="font-semibold">{task}</p>
      <p className="mt-1 text-sm text-white/65">{person}</p>
    </div>
  );
}

function SectionTitle({ label, title, text, dark }) {
  return (
    <div className="mb-16 text-center">
      <p
        className={`text-sm font-bold uppercase tracking-[0.2em] ${
          dark ? "text-[#BBE1FA]" : "text-[#4668C8]"
        }`}
      >
        {label}
      </p>

      <h2 className="mt-4 text-4xl font-light md:text-5xl">
        {title}
      </h2>

      <p
        className={`mx-auto mt-6 max-w-2xl text-lg ${
          dark ? "text-white/70" : "text-[#52627a]"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

function DemoCard({ title, text }) {
  return (
    <div className="rounded-[32px] bg-white p-8 shadow-[0_20px_60px_rgba(13,30,76,0.08)]">
      <h3 className="text-2xl font-semibold">{title}</h3>

      <p className="mt-4 leading-8 text-[#52627a]">
        {text}
      </p>
    </div>
  );
}

function TestimonialCard({ quote, name, role }) {
  return (
    <div className="rounded-[32px] bg-[#F8FBFD] p-8 shadow-sm">
      <p className="text-lg leading-8 text-[#415579]">
        “{quote}”
      </p>

      <div className="mt-8">
        <p className="font-bold">{name}</p>
        <p className="text-sm text-[#627391]">{role}</p>
      </div>
    </div>
  );
}

function PricingCard({ title, price, features, featured }) {
  return (
    <div
      className={`rounded-[36px] border p-8 ${
        featured
          ? "border-[#BBE1FA] bg-[#4668C8]"
          : "border-white/10 bg-white/5"
      }`}
    >
      <h3 className="text-2xl font-semibold">{title}</h3>

      <p className="mt-5 text-5xl font-light">{price}</p>

      <ul className="mt-8 space-y-4 text-sm text-white/85">
        {features.map((feature) => (
          <li key={feature}>• {feature}</li>
        ))}
      </ul>

      <Link
        href="/login"
        className={`mt-10 inline-flex h-12 w-full items-center justify-center rounded-full text-sm font-bold ${
          featured
            ? "bg-white text-[#0D1E4C]"
            : "bg-white/10 text-white"
        }`}
      >
        Get Started
      </Link>
    </div>
  );
}
