import Image from "next/image";
import Link from "next/link";
import ElectricBorder from "@/components/ElectricBorder";

const PLANS = [
  {
    name: "Free",
    color: "#2563EB",
    price: "$0",
    cadence: "/forever",
    description: "For individuals getting started with smarter task management.",
    features: [
      "Up to 5 members",
      "1 workspace",
      "Basic task allocation",
      "Community support",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    color: "#7C3AED",
    badge: "Epic",
    price: "$29",
    cadence: "/monthly",
    description: "For growing teams that want AI to do the heavy lifting.",
    features: [
      "Unlimited workspaces",
      "AI-powered task allocation",
      "Team & organization management",
      "Smart recommendations",
      "Priority support",
    ],
    cta: "Start Free",
    highlighted: true,
  },
  {
    name: "Team",
    color: "#E8A23D",
    badge: "Legendary",
    price: "$99",
    cadence: "/monthly",
    description: "Best for large organizations that need maximum capabilities.",
    features: [
      "Everything in Pro",
      "AI Agents (Optimus)",
      "Advanced workforce analytics",
      "SSO & advanced roles",
      "Dedicated support",
    ],
    cta: "Start Free",
    highlighted: false,
  },
];

function CheckIcon({ color }) {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function PlanCard({ plan }) {
  return (
    <ElectricBorder
      color={plan.color}
      speed={1.2}
      chaos={1.4}
      thickness={3}
      showOnHover
      style={{ borderRadius: 28 }}
      className="h-full"
    >
      <div className="flex h-full flex-col rounded-[28px] border border-white/10 bg-[#0b0b0d] p-8 transition-colors duration-300 group-hover:border-transparent">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-white">{plan.name}</h3>
          {plan.badge ? (
            <span
              className="rounded-full px-3 py-0.5 text-xs font-bold"
              style={{ color: plan.color, backgroundColor: `${plan.color}22` }}
            >
              {plan.badge}
            </span>
          ) : null}
        </div>

        <div className="mt-6 flex items-end gap-1">
          <span className="text-6xl font-black tracking-tight text-white">{plan.price}</span>
          <span className="mb-2 text-sm font-medium text-white/50">{plan.cadence}</span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-white/60">{plan.description}</p>

        <div className="my-7 h-px w-full bg-white/10" />

        <ul className="flex flex-col gap-4">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-3 text-sm font-medium text-white/85">
              <CheckIcon color={plan.color} />
              {feature}
            </li>
          ))}
        </ul>

        <Link
          href="/signup"
          className="mt-auto pt-8"
        >
          <span
            className={`flex h-13 w-full items-center justify-center rounded-full py-3.5 text-sm font-bold transition ${
              plan.highlighted
                ? "bg-white text-[#0b0b0d] hover:bg-white/90"
                : "border border-white/20 text-white hover:border-white/50 hover:bg-white/5"
            }`}
          >
            {plan.cta}
          </span>
        </Link>
      </div>
    </ElectricBorder>
  );
}

export default function PricingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-black px-6 py-10 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/optimalogowhite.png" alt="Optima" width={36} height={36} className="h-9 w-9 object-contain" />
          <span className="text-sm font-extrabold">OPTIMA</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition hover:text-white"
        >
          <span aria-hidden="true">&larr;</span> Home
        </Link>
      </header>

      <section className="mx-auto mt-16 max-w-3xl text-center">
        <span className="rounded-full border border-white/15 px-4 py-1 text-sm font-medium text-white/80">
          Pricing
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
          Plans that scale with your team
        </h1>
        <p className="mt-4 text-base text-white/60">
          Start free, then upgrade as you grow. Every plan includes the Optima workspace.
        </p>
      </section>

      <section className="mx-auto mt-16 grid max-w-6xl gap-8 pb-20 md:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCard key={plan.name} plan={plan} />
        ))}
      </section>
    </main>
  );
}
