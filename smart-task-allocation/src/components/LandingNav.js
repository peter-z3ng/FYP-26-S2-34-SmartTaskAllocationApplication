import Image from "next/image";
import Link from "next/link";

// Top navigation shared across the landing and pricing pages.
export default function LandingNav() {
  return (
    <header className="absolute inset-x-0 top-6 z-30">
      <div className="mx-auto flex w-[65%] items-center justify-between">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/optimalogowhite.png"
            alt="Optima logo"
            width={48}
            height={48}
            className="h-12 w-12 object-cover"
            priority
          />
          <span className="text-md font-extrabold text-white">OPTIMA</span>
        </Link>

        <nav
          aria-label="Landing page navigation"
          className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-md lg:flex"
        >
          {["Products", "Resources", "Community", "Pricing"].map((item) =>
            item === "Pricing" ? (
              <Link
                key={item}
                href="/pricing"
                className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white"
              >
                {item}
              </Link>
            ) : (
              <a
                key={item}
                href={`/#${item.toLowerCase()}`}
                className="rounded-full px-4 py-2 transition hover:bg-white/10 hover:text-white"
              >
                {item}
              </a>
            )
          )}
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
  );
}
