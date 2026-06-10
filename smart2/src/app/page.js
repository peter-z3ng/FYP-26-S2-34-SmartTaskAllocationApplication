"use client";

import Image from "next/image";
import Link from "next/link";
import GradualBlur from "@/components/GradualBlur";
import LaserFlow from "@/components/LaserFlow";
import optimaLogo from "@/public/optimalogo.jpg";
import optimusImage from "@/public/optimus.jpg";

export default function Home() {
  return (
    <main className="overflow-x-hidden bg-black">
      <section className="relative min-h-screen overflow-hidden">
        <header className="absolute left-8 right-8 top-7 z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src={optimaLogo}
              alt="Optima logo"
              className="h-11 w-11 rounded-xl object-cover"
              priority
            />
            <span className="text-2xl font-bold text-white">Optima</span>
          </div>

          <Link
            href="/login"
            className="rounded-full border border-white/25 px-6 py-3 text-sm font-bold uppercase tracking-normal text-white transition hover:border-white/70 hover:bg-white/10"
          >
            Log in
          </Link>
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

        <div className="absolute ml-30 top-[22%] z-10 max-w-[780px]">
          <h1 className="text-balance text-4xl font-black leading-[0.95] tracking-normal text-white md:text-6xl">
            Every Great Team Runs on Optima
          </h1>
        </div>

        <section
          aria-label="Dashboard preview"
          className="absolute left-1/2 top-1/2 z-[6] h-[60%] w-[86%] -translate-x-1/2 overflow-hidden rounded-[20px] border-2 border-[#2563EB] bg-[#120F17] shadow-[0_0_90px_rgba(37,99,235,0.9)]"
        />
      </section>

      <section
        className="relative min-h-[1480px] overflow-hidden bg-[#120F17]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(180,142,214,0.22) 1.5px, transparent 1.5px)",
          backgroundSize: "40px 40px",
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-white/10" />

        <div className="relative z-10 flex h-[460px] items-center justify-center px-8">
          <h2 className="text-center text-7xl font-black leading-none tracking-normal text-[#b897d8] md:text-8xl">
            Meet
          </h2>
        </div>

        <div className="relative z-[4] mx-auto h-[600px] w-[40%] min-w-[300px] overflow-hidden rounded-[70px] border border-[#b897d8]/25 bg-black shadow-[0_0_90px_rgba(184,151,216,0.35)]">
          <Image
            src={optimusImage}
            alt="Optimus reveal"
            fill
            className="object-cover"
            sizes="1200px"
            priority
          />
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

        <div className="relative z-10 flex h-[340px] items-center justify-center px-8">
          <h2 className="text-center text-7xl font-black leading-none tracking-normal text-[#b897d8] md:text-8xl">
            Optimus
          </h2>
        </div>

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
