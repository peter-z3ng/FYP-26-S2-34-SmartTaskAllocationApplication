"use client";

import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import GradualBlur from "@/components/GradualBlur";
import LaserFlow from "@/components/LaserFlow";
import optimaLogo from "@/public/optimalogowhite.png";
import optimusImage from "@/public/optimus.jpg";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export default function Home() {
  return (
    <main className={`${inter.className} overflow-x-hidden bg-black`}>
      <section className="relative min-h-screen overflow-hidden">
        <header className="absolute left-[18%] right-[18%] top-7 z-10 flex items-center justify-between">
          <div className="flex items-center">
            <Image
              src={optimaLogo}
              alt="Optima logo"
              className="h-12 w-12 object-cover"
              priority
            />
            <span className="text-md font-extrabold text-white">OPTIMA</span>
          </div>

          <nav
            aria-label="Landing page navigation"
            className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-md lg:flex"
          >
            {["Products", "Resources", "Community", "Pricing"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white"
              >
                {item}
              </a>
            ))}
          </nav>

          <Link
            href="/login"
            className="rounded-full border border-white/25 px-6 py-4 text-sm font-bold uppercase tracking-normal text-white transition hover:border-white/70 hover:bg-white/10"
          >
            Log in
          </Link>
        </header>

        <div className="absolute left-[50%] -top-20 z-[10] h-[145.5vh] min-h-[360px] w-screen -translate-x-1/2 overflow-hidden">
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

        <div className="absolute left-[18%] top-[30%] z-10 max-w-[780px]">
          <h1 className="text-balance font-bold leading-[1.2] tracking-[0.8] md:text-3xl lg:text-6xl bg-[linear-gradient(90deg,#FFFFFF_0%,#FFFFFF_30%,#2563EB_45%,#000000_80%)] bg-clip-text text-transparent">
            Every Great Team Runs on Optima
          </h1>
        </div>

        <section
          aria-label="Dashboard preview"
          className="absolute left-1/2 top-[70vh] z-[6] h-[52vh] min-h-[360px] w-[65%] -translate-x-1/2 overflow-hidden rounded-t-[20px] border-2 border-[#2563EB] bg-[#120F17] shadow-[0_0_90px_rgba(37,99,235,0.9)]"
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
