"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Inter } from "next/font/google";
import LaserFlow from "@/components/LaserFlow";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const Lanyard = dynamic(() => import("@/components/Lanyard"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className={`${inter.className} overflow-x-hidden bg-black`}>
      <section className="relative min-h-[140vh] overflow-hidden">
        <header className="absolute inset-x-0 top-6 z-30">
          <div className="mx-auto flex w-[65%] items-center justify-between">
            <div className="flex shrink-0 items-center">
              <Image
                src="/optimalogowhite.png"
                alt="Optima logo"
                width={48}
                height={48}
                className="h-12 w-12 object-cover"
                priority
              />
              <span className="text-md font-extrabold text-white">OPTIMA</span>
            </div>

            <nav
              aria-label="Landing page navigation"
              className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-3 text-sm font-semibold text-white/80 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-md lg:flex"
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

            <div className="flex shrink-0 items-center gap-4">
              <Link
                href="/login"
                className="rounded-full border border-white/20 px-6 py-4 text-sm font-bold tracking-normal text-white transition hover:border-white/80 hover:bg-white/10"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-full border border-[#1E40AF]/20 bg-[#1E40AF]/20 px-6 py-4 text-sm font-bold tracking-normal text-white shadow-[0_0_22px_rgba(37,99,235,0.55)] transition hover:border-[#2563EB]/80 hover:bg-[#2563EB]/40 hover:shadow-[0_0_34px_rgba(37,99,235,0.75)]"
              >
                Experience
              </Link>
            </div>
          </div>
        </header>

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

      <section className="relative h-[400px] w-full bg-[#FFFFFF]"></section>

      <section
        id="products"
        className="relative overflow-hidden bg-[#FFFFFF] px-6"
      >
        <div className="relative mx-auto h-[620px] -left-[10%] w-[120%] overflow-hidden border-t border-t-neutral-300 bg-gradient-to-b from-[#FFFFFF] via-[#1E40AF] to-[#000000]">
          <Lanyard
            position={[0, 0, 20]}
            gravity={[0, -40, 0]}
            frontImage="/optimalogoblue.png"
            backImage="/lanyardcard.png"
            frontColor="#ffffff"
            frontImageScale={0.55}
            autoFlipInterval={3}
            flipSpeed={2}
            lanyardLogo="/optimalogowhite.png"
            lanyardColor="#000000"
            imageFit="contain"
          />
        </div>
      </section>

      <section className="relative h-[400px] w-full bg-[#000000]"></section>

    </main>
  );
}
