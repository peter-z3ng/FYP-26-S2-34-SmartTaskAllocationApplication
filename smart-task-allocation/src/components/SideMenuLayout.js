"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import { sideMenuNavigation } from "@/lib/sideMenuNavigation";

function NavIcon({ name }) {
  const commonProps = {
    className: "h-5 w-5 shrink-0",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  if (name === "users") {
    return (
      <svg {...commonProps}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (name === "tasks") {
    return (
      <svg {...commonProps}>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg {...commonProps}>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M3 10h18" />
      </svg>
    );
  }

  if (name === "settings") {
    return (
      <svg {...commonProps}>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.5a2 2 0 0 1-1 1.73l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.73v-.5a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  if (name === "organization") {
    return (
      <svg {...commonProps}>
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-6h6v6" />
        <path d="M9 10h.01" />
        <path d="M15 10h.01" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

export default function SideMenuLayout({ actor, title, subtitle, children }) {
  const pathname = usePathname();
  const navigation = sideMenuNavigation[actor];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#061225] text-[#07183b] sm:p-6 lg:p-8">
      <div className="animated-base absolute inset-0" aria-hidden="true" />
      <div className="animated-mesh absolute inset-0" aria-hidden="true" />
      <div className="particle-field absolute inset-0" aria-hidden="true" />
      <div
        className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl"
        style={{ animation: "dashboard-orbit 14s ease-in-out infinite" }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 right-0 h-96 w-96 rounded-full bg-sky-300/15 blur-3xl"
        style={{ animation: "dashboard-orbit 18s ease-in-out infinite reverse" }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1600px] gap-6 rounded-[30px] border border-white/15 bg-white/10 p-4 shadow-[0_30px_100px_rgba(0,0,0,0.25)] backdrop-blur-2xl sm:p-6">
        <div className="hidden w-16 mt-28 shrink-0 flex-col z-10 justify-between md:flex">
          <aside className="group flex w-16 flex-col items-center rounded-[34px] border border-white/15 bg-white/12 py-6 text-white shadow-sm backdrop-blur-xl transition-all duration-300 hover:w-56">
            <div className="flex w-full flex-col items-center gap-8">

              <nav
                className="flex w-full flex-col gap-3 px-2"
                aria-label={`${navigation.label} navigation`}
              >
                {navigation.items.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      aria-label={item.label}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex h-12 w-full items-center gap-3 rounded-full px-3 transition-colors ${
                        isActive
                          ? "bg-teal-300 text-[#05202c] shadow-[0_10px_24px_rgba(94,234,212,0.25)]"
                          : "text-white/78 hover:bg-white/12 hover:text-white"
                      }`}
                    >
                      <NavIcon name={item.icon} />

                      <span className="hidden whitespace-nowrap text-sm font-bold group-hover:block">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            
          </aside>

          <aside className="group flex w-16 flex-col items-center rounded-full border border-white/15 bg-white/12 py-2 text-white shadow-sm backdrop-blur-xl transition-all duration-300">
                <Link
              href="/login"
              title="Log out"
              aria-label="Log out"
              className="flex h-12 w-[calc(100%-1rem)] items-center gap-3 rounded-2xl px-3 text-white/78 hover:bg-white/12 hover:text-white"
            >
              <svg
                className="h-5 w-5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
            </Link>
          </aside>
        </div>
          
        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex flex-col gap-4 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-4">
              <BrandLogo />

              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-teal-200">
                  {navigation.label}
                </p>

                <h1 className="mt-1 text-3xl font-black text-white">{title}</h1>

                {subtitle ? <p className="mt-2 text-sm leading-6 text-white/70">{subtitle}</p> : null}
              </div>
            </div>

            <nav
              className="flex gap-2 overflow-x-auto rounded-2xl border border-white/15 bg-white/12 p-2 shadow-sm backdrop-blur-xl md:hidden"
              aria-label={`${navigation.label} mobile navigation`}
            >
              {navigation.items.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors ${
                      isActive ? "bg-teal-300 text-[#05202c]" : "text-white/78 hover:bg-white/12 hover:text-white"
                    }`}
                  >
                    <NavIcon name={item.icon} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <div className="min-w-0 flex-1">{children}</div>
        </section>
      </div>
    </main>
  );
}
