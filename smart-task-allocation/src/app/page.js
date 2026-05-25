import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#0D1E4C] text-white">
      {/* Hero */}
      <section className="relative min-h-screen bg-gradient-to-b from-[#304FA8] via-[#4668C8] to-[#C7DDEB]">
        <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center text-2xl">
              Workflow+
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-white/85 md:flex">
            <a href="#demo">Product Demo</a>
            <a href="#testimonials">Testimonials</a>
            <a href="#announcement">Announcement</a>
            <a href="#pricing">Pricing</a>
            <a href="#about">About</a>
          </nav>

          <Link
            href="/login"
            className="rounded-lg bg-white/20 px-5 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-md transition hover:bg-white/30"
          >
            Get started
          </Link>
        </header>

        <div className="mx-auto flex max-w-5xl flex-col items-center px-6 pt-16 text-center">
          <div className="rounded-full border border-white/25 bg-white/10 px-4 py-1 text-xs text-white/90 backdrop-blur-md">
            Smart task allocation for SME teams
          </div>

          <h1 className="mt-8 max-w-3xl text-5xl font-light leading-tight tracking-tight md:text-7xl">
            Keep Your Team Working Smarter
          </h1>

          <p className="mt-6 max-w-xl text-sm leading-6 text-white/85 md:text-base">
            Assign tasks, manage staff availability, and track daily operations
            in one clean workspace.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/login"
              className="rounded-lg bg-white/25 px-7 py-3 text-sm font-semibold text-white shadow-sm backdrop-blur-md transition hover:bg-white/35"
            >
              Get started
            </Link>

            <a
              href="#demo"
              className="rounded-lg border border-white/25 bg-white/10 px-7 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
            >
              View demo
            </a>
          </div>

          <div className="mt-20 w-full max-w-4xl rounded-[28px] border border-white/30 bg-white/15 p-3 shadow-[0_30px_100px_rgba(13,30,76,0.45)] backdrop-blur-xl">
            <div className="rounded-[22px] border border-white/20 bg-[#0D1E4C]/35 p-6 text-left">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/60">Dashboard</p>
                  <h2 className="text-xl font-semibold">Today’s Allocation</h2>
                </div>
                <button className="rounded-lg bg-white/20 px-4 py-2 text-xs font-semibold">
                  + New Task
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <PreviewCard title="Pending Tasks" value="12" />
                <PreviewCard title="Assigned Staff" value="28" />
                <PreviewCard title="Completed" value="19" />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <TaskRow task="Inventory Restock" person="Alicia" />
                <TaskRow task="Outlet Cleaning" person="Ben" />
                <TaskRow task="Customer Support" person="Chen" />
                <TaskRow task="Delivery Packing" person="Daniel" />
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
            title="Everything in one workspace"
            text="Manage teams, assign tasks, monitor schedules, and track operations from a single dashboard."
          />

          <div className="rounded-[36px] bg-white p-5 shadow-[0_25px_80px_rgba(13,30,76,0.12)]">
            <div className="grid gap-5 md:grid-cols-3">
              <DemoCard
                title="Smart Allocation"
                text="Automatically assign suitable staff based on availability, role, and workload."
              />
              <DemoCard
                title="Availability Tracking"
                text="Track employee and casual worker schedules before assigning tasks."
              />
              <DemoCard
                title="Task Monitoring"
                text="Monitor task progress, pending tasks, and completed work easily."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-white px-6 py-28 text-[#0D1E4C]">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            label="Testimonials"
            title="Trusted by growing SMEs"
            text="Simple tools that help small teams reduce manual work and improve daily operations."
          />

          <div className="grid gap-6 md:grid-cols-3">
            <TestimonialCard
              quote="SmartTask reduced our manual scheduling workload significantly."
              name="Alicia Tan"
              role="Operations Manager"
            />
            <TestimonialCard
              quote="The smart allocation feature helped our team work more efficiently."
              name="Ben Lee"
              role="Store Supervisor"
            />
            <TestimonialCard
              quote="Simple interface, fast workflow, and easy staff management."
              name="Chen Wei"
              role="Business Owner"
            />
          </div>
        </div>
      </section>

      {/* Announcement */}
      <section id="announcement" className="bg-[#C7DDEB] px-6 py-28 text-[#0D1E4C]">
        <div className="mx-auto max-w-6xl rounded-[36px] bg-white p-10 shadow-[0_25px_80px_rgba(13,30,76,0.12)]">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#4668C8]">
                Announcement
              </p>

              <h2 className="mt-4 text-4xl font-light">
                New AI-powered task suggestions are coming soon
              </h2>

              <p className="mt-5 max-w-2xl text-[#52627a]">
                Workflow+ is introducing AI recommendations to improve task
                allocation accuracy and team productivity.
              </p>
            </div>

            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#0D1E4C] px-7 text-sm font-bold text-white transition hover:opacity-90"
            >
              Try Workflow+
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-[#0D1E4C] px-6 py-28 text-white">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            label="Pricing"
            title="Flexible plans for every business"
            text="Start simple and upgrade when your team needs more automation."
            dark
          />

          <div className="grid gap-20 md:grid-cols-2">
            <PricingCard
              title="Starter"
              price="Free"
              features={[
                "Basic task allocation",
                "Employee management",
                "Organization dashboard",
              ]}
            />
            <PricingCard
              title="Enterprise"
              price="Custom"
              features={[
                "Advanced AI features",
                "Custom integrations",
                "Dedicated support",
              ]}
            />
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-[#E0E5E9] px-6 py-28 text-[#0D1E4C]">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#4668C8]">
            About Workflow+
          </p>

          <h2 className="mt-4 text-4xl font-light md:text-5xl">
            Built for modern SME operations
          </h2>

          <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-[#52627a]">
            Workflow+ is a smart task allocation platform designed to help SMEs
            manage teams, improve scheduling efficiency, and simplify workforce
            operations through intelligent automation and clean workflows.
          </p>
        </div>
      </section>
    </main>
  );
}

function PreviewCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
      <p className="text-xs text-white/60">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function TaskRow({ task, person }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
      <p className="font-semibold">{task}</p>
      <p className="mt-1 text-sm text-white/65">Assigned to {person}</p>
    </div>
  );
}

function SectionTitle({ label, title, text, dark }) {
  return (
    <div className="mb-14 text-center">
      <p
        className={`text-sm font-bold uppercase tracking-[0.2em] ${
          dark ? "text-[#BBE1FA]" : "text-[#4668C8]"
        }`}
      >
        {label}
      </p>

      <h2 className="mt-4 text-4xl font-light md:text-5xl">{title}</h2>

      <p
        className={`mx-auto mt-5 max-w-2xl ${
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
    <div className="rounded-[28px] bg-[#F8FBFD] p-6">
      <h3 className="text-2xl font-bold">{title}</h3>
      <p className="mt-4 leading-7 text-[#52627a]">{text}</p>
    </div>
  );
}

function TestimonialCard({ quote, name, role }) {
  return (
    <div className="rounded-[28px] bg-[#F8FBFD] p-8 shadow-sm">
      <p className="text-lg leading-8 text-[#415579]">“{quote}”</p>

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
      className={`rounded-[32px] border p-8 ${
        featured
          ? "border-[#BBE1FA] bg-[#4668C8]"
          : "border-white/10 bg-white/5"
      }`}
    >
      <h3 className="text-2xl font-bold">{title}</h3>

      <p className="mt-4 text-5xl font-light">{price}</p>

      <ul className="mt-8 space-y-4 text-sm text-white/85">
        {features.map((feature) => (
          <li key={feature}>• {feature}</li>
        ))}
      </ul>

      <Link
        href="/login"
        className={`mt-10 inline-flex h-12 w-full items-center justify-center rounded-full text-sm font-bold ${
          featured ? "bg-white text-[#0D1E4C]" : "bg-white/10 text-white"
        }`}
      >
        Get Started
      </Link>
    </div>
  );
}