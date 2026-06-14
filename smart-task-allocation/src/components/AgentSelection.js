"use client";

import Image from "next/image";
import { useState } from "react";
import AgentDeployModal from "@/components/AgentDeployModal";

const AGENTS = [
  {
    id: "blue",
    name: "Optimus Blue",
    title: "Orchestrator",
    image: "/optimusblue.png",
    access: ["User Admin", "Manager", "Employee", "Platform Admin"],
    description:
      "Coordinates work across every team, balances workloads, and keeps projects moving from start to finish. The all-rounder available to everyone.",
  },
  {
    id: "sage",
    name: "Optimus Sage",
    title: "Product Strategist",
    image: "/optimussage.png",
    access: ["Platform Admin"],
    description:
      "Shapes product direction, prioritizes the roadmap, and turns high-level goals into clear, actionable plans.",
  },
  {
    id: "red",
    name: "Optima Red",
    title: "Team Architect",
    image: "/optimusred.png",
    access: ["Manager"],
    description:
      "Designs team structures, matches the right people to the right tasks, and fine-tunes collaboration across the org.",
  },
  {
    id: "black",
    name: "Optima Black",
    title: "Developer",
    image: "/optimusblack.png",
    access: ["Platform Admin"],
    description:
      "Builds, automates, and ships technical work — from scaffolding features to wiring up integrations behind the scenes.",
  },
];

export default function AgentSelection() {
  const [selectedId, setSelectedId] = useState(AGENTS[0].id);
  const [deployedId, setDeployedId] = useState(null);
  const [deployAgent, setDeployAgent] = useState(null);
  const selected = AGENTS.find((agent) => agent.id === selectedId) ?? AGENTS[0];

  function handleLockIn(agent) {
    // Optimus Red opens the guided team-build workflow; others just deploy.
    if (agent.id === "red") {
      setDeployAgent(agent);
      return;
    }
    setDeployedId(agent.id);
  }

  return (
    <div className="flex h-full min-h-0 gap-4">
      {/* Left: agent roster */}
      <aside className="hidden w-72 shrink-0 flex-col gap-3 overflow-y-auto rounded-[28px] border border-white/60 bg-white/25 p-4 backdrop-blur-sm lg:flex">
        <h2 className="px-2 pb-1 text-xs font-bold uppercase tracking-[0.2em] text-[#0D1E4C]/70">
          Choose your agent
        </h2>
        {AGENTS.map((agent) => {
          const isActive = agent.id === selectedId;
          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => setSelectedId(agent.id)}
              className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                isActive
                  ? "border-white bg-white/70 shadow-[0_10px_24px_rgba(10,42,102,0.15)]"
                  : "border-white/40 bg-white/30 hover:bg-white/50"
              }`}
            >
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#0D1E4C]/10">
                <Image
                  src={agent.image}
                  alt={agent.name}
                  fill
                  sizes="48px"
                  className="object-cover object-top"
                />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-[#0D1E4C]">{agent.name}</span>
                <span className="block truncate text-xs text-[#0D1E4C]/60">{agent.title}</span>
              </span>
            </button>
          );
        })}
      </aside>

      {/* Middle: agent character */}
      <section className="relative min-h-0 flex-1 overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-b from-white/45 to-white/10 backdrop-blur-sm">
        <Image
          key={selected.id}
          src={selected.image}
          alt={selected.name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain object-top p-6"
        />

        {/* Frosted band over the bottom of the character */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-black/75 via-black/45 to-transparent px-6 pb-8 pt-20 text-center backdrop-blur-xs">
          <h1 className="text-5xl font-black tracking-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.55)] sm:text-6xl">
            {selected.name}
          </h1>
          <p className="text-base font-semibold uppercase tracking-[0.3em] text-white/85">
            {selected.title}
          </p>
          <button
            type="button"
            onClick={() => handleLockIn(selected)}
            className="mt-2 rounded-full bg-white px-12 py-3 text-sm font-black uppercase tracking-[0.25em] text-[#0D1E4C] shadow-[0_0_30px_rgba(255,255,255,0.45)] transition hover:scale-[1.03] hover:shadow-[0_0_44px_rgba(255,255,255,0.7)]"
          >
            {deployedId === selected.id ? "Deployed ✓" : "Lock In"}
          </button>
        </div>
      </section>

      {/* Right: access + capabilities */}
      <aside className="hidden w-80 shrink-0 flex-col gap-6 overflow-y-auto rounded-[28px] border border-white/60 bg-white/25 p-6 backdrop-blur-sm xl:flex">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#0D1E4C]/70">
            Available to
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {selected.access.map((role) => (
              <span
                key={role}
                className="rounded-full border border-[#0D1E4C]/15 bg-white/70 px-4 py-1.5 text-xs font-bold text-[#0D1E4C]"
              >
                {role}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#0D1E4C]/70">
            What {selected.name} does
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-[#0D1E4C]/80">{selected.description}</p>
        </div>
      </aside>

      {deployAgent ? (
        <AgentDeployModal
          agent={deployAgent}
          onClose={() => {
            setDeployedId(deployAgent.id);
            setDeployAgent(null);
          }}
        />
      ) : null}
    </div>
  );
}
