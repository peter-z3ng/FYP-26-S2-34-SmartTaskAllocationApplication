"use client";

import Image from "next/image";
import Link from "next/link";
import GradualBlur from "@/components/GradualBlur";
import LaserFlow from "@/components/LaserFlow";
import PublicFeedbackStrip from "@/components/PublicFeedbackStrip";
import optimaLogo from "@/public/optimalogo.jpg";
import optimusImage from "@/public/optimus.jpg";

const previewRows = [
  { task: "Priority inventory audit", owner: "Daniel Ong", state: "Auto routed", score: "100%" },
  { task: "Front desk coverage", owner: "Alicia Tan", state: "Approved", score: "98%" },
  { task: "Customer support queue", owner: "Chen Wei", state: "Ready", score: "94%" },
];

const platformSignals = [
  { label: "Smart allocation", value: "Live", detail: "Availability, conflicts, skill fit, and workload checked together." },
  { label: "Request approval", value: "Clear", detail: "Managers can approve employee requests and retain the audit trail." },
  { label: "AI recommendations", value: "Pro", detail: "Paid users receive ranked assignment suggestions and reports." },
];

const operatorStats = [
  ["Availability", "92%"],
  ["Skill coverage", "88%"],
  ["Dispatch load", "41%"],
];

export default function Home() {
  return (
    <main className="optima-landing overflow-x-hidden bg-black text-white">
      <section className="relative min-h-screen overflow-hidden">
        <header className="absolute left-6 right-6 top-6 z-20 flex items-center justify-between md:left-8 md:right-8 md:top-7">
          <Link href="/" className="group flex items-center gap-4" aria-label="Optima home">
            <Image
              src={optimaLogo}
              alt="Optima logo"
              className="h-11 w-11 rounded-xl object-cover shadow-[0_0_28px_rgba(37,99,235,0.42)] transition group-hover:scale-105"
              priority
            />
            <span className="text-2xl font-bold tracking-normal text-white">Optima</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/feedback"
              className="hidden rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-white/80 transition hover:border-white/60 hover:bg-white/10 md:inline-flex"
            >
              Feedback
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/25 px-6 py-3 text-sm font-bold uppercase tracking-normal text-white transition hover:border-white/70 hover:bg-white/10"
            >
              Log in
            </Link>
          </div>
        </header>

        <LaserFlow
          horizontalBeamOffset={0.1}
          verticalBeamOffset={0}
          horizontalSizing={0.5}
          verticalSizing={4}
          wispDensity={1}
          wispSpeed={15}
          wispIntensity={5}
          flowSpeed={0.35}
          flowStrength={0.25}
          fogIntensity={0.45}
          fogScale={0.3}
          fogFallSpeed={0.6}
          decay={1.1}
          falloffStart={1.2}
          color="#2563EB"
          className="absolute inset-0 translate-y-14"
        />

        <div className="pointer-events-none absolute inset-0 z-[3] bg-[radial-gradient(circle_at_30%_15%,rgba(37,99,235,0.22),transparent_30rem),linear-gradient(180deg,transparent_55%,rgba(0,0,0,0.76))]" />

        <div className="absolute left-7 top-[17%] z-10 max-w-[760px] md:left-24 lg:left-32">
          <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-blue-100 backdrop-blur">
            Smart task allocation command system
          </p>
          <h1 className="text-balance text-5xl font-black leading-[0.92] tracking-normal text-white md:text-6xl lg:text-7xl">
            Every Great Team Runs on Optima
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-blue-50/78">
            Route the right work to the right people with availability checks, request approval, AI recommendations,
            and clear operational reporting in one dispatch workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="rounded-full bg-white px-7 py-4 text-sm font-black text-[#120F17] shadow-[0_0_36px_rgba(255,255,255,0.28)] transition hover:-translate-y-1 hover:bg-blue-50"
            >
              Create workspace
            </Link>
            <Link
              href="/manager"
              className="rounded-full border border-white/20 bg-white/10 px-7 py-4 text-sm font-black text-white backdrop-blur transition hover:-translate-y-1 hover:border-white/70"
            >
              View manager demo
            </Link>
          </div>
        </div>

        <section
          aria-label="Optima dashboard preview"
          className="optima-preview-panel absolute left-1/2 top-[66%] z-[6] w-[88%] -translate-x-1/2 overflow-hidden rounded-[24px] border-2 border-[#2563EB] bg-[#120F17]/94 p-5 shadow-[0_0_90px_rgba(37,99,235,0.85)] backdrop-blur md:top-[61%] md:h-[48%] md:p-7"
        >
          <div className="optima-scanline" aria-hidden="true" />
          <div className="relative z-10 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-300">Allocation board</p>
                  <h2 className="mt-2 text-2xl font-black">Today&apos;s routing queue</h2>
                </div>
                <span className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-black text-[#08201d]">Live</span>
              </div>

              <div className="space-y-3">
                {previewRows.map((row) => (
                  <article key={row.task} className="optima-task-row grid gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 md:grid-cols-[1fr_auto]">
                    <div>
                      <h3 className="text-base font-black text-white">{row.task}</h3>
                      <p className="mt-1 text-sm text-blue-100/70">{row.owner}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-blue-400/18 px-3 py-1 text-xs font-black text-blue-100">{row.state}</span>
                      <span className="text-lg font-black text-emerald-200">{row.score}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <aside className="rounded-[20px] border border-blue-300/20 bg-[#071428] p-5">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">Recommendation</p>
              <h2 className="mt-3 text-3xl font-black">Best match found</h2>
              <p className="mt-4 text-sm leading-6 text-blue-100/75">
                Optima ranks employees by plan access, availability, schedule conflicts, and required qualifications
                before assignment.
              </p>
              <div className="mt-6 space-y-4">
                {operatorStats.map(([label, value]) => (
                  <div key={label}>
                    <div className="mb-2 flex justify-between text-xs font-black uppercase tracking-[0.18em] text-blue-100/70">
                      <span>{label}</span>
                      <span>{value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-300 to-emerald-200" style={{ width: value }} />
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>
      </section>

      <section
        className="relative min-h-[1280px] overflow-hidden bg-[#120F17] py-28"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(180,142,214,0.22) 1.5px, transparent 1.5px)",
          backgroundSize: "40px 40px",
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-white/10" />

        <div className="relative z-10 flex h-[280px] items-center justify-center px-8 md:h-[360px]">
          <h2 className="text-center text-7xl font-black leading-none tracking-normal text-[#b897d8] md:text-8xl">
            Meet
          </h2>
        </div>

        <div className="relative z-[4] mx-auto h-[520px] w-[min(42rem,82vw)] overflow-hidden rounded-[56px] border border-[#b897d8]/25 bg-black shadow-[0_0_90px_rgba(184,151,216,0.35)] md:h-[620px] md:rounded-[70px]">
          <Image src={optimusImage} alt="Optimus reveal" fill className="object-cover" sizes="900px" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#120F17]/20" />
          <GradualBlur
            target="parent"
            position="top"
            height="8rem"
            strength={10}
            divCount={10}
            curve="bezier"
            exponential
            opacity={2}
            zIndex={8}
          />
          <GradualBlur
            target="parent"
            position="bottom"
            height="10rem"
            strength={5}
            divCount={8}
            curve="bezier"
            exponential
            opacity={1}
            zIndex={8}
          />
        </div>

        <div className="relative z-10 flex h-[260px] items-center justify-center px-8 md:h-[320px]">
          <h2 className="text-center text-7xl font-black leading-none tracking-normal text-[#b897d8] md:text-8xl">
            Optimus
          </h2>
        </div>

        <div className="relative z-10 mx-auto grid max-w-6xl gap-5 px-6 pb-20 md:grid-cols-3">
          {platformSignals.map((signal) => (
            <article key={signal.label} className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#b897d8]">{signal.label}</p>
                <span className="rounded-full bg-[#b897d8]/18 px-3 py-1 text-xs font-black text-[#dac4ef]">
                  {signal.value}
                </span>
              </div>
              <p className="text-sm leading-7 text-white/72">{signal.detail}</p>
            </article>
          ))}
        </div>

        <PublicFeedbackStrip />

        <GradualBlur
          target="parent"
          position="bottom"
          height="12rem"
          strength={2.8}
          divCount={8}
          curve="bezier"
          exponential
          opacity={1}
          zIndex={12}
        />
      </section>
    </main>
  );
}
