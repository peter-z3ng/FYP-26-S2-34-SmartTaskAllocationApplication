"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sideMenuNavigation } from "@/lib/sideMenuNavigation";
import TopInformationBar from "@/components/TopInformationBar";

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

  if (name === "workspace") {
    return (
      <svg {...commonProps}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
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

export default function SideMenuLayout({ actor, children }) {
  const pathname = usePathname();
  const navigation = sideMenuNavigation[actor];

  return (
    <main className="h-screen overflow-hidden bg-[#C7DDEB] text-[#07183b]">
      <TopInformationBar actor={actor} />
      <div className="flex h-[calc(100vh-3.5rem)] w-full gap-2 overflow-hidden bg-[#C7DDEB] pl-1 pb-2 pr-2 sm:pb-2 sm:pl-2 sm:pr-2 lg:pb-2 lg:pl-2 lg:pr-2">
        <div className="hidden w-16 shrink-0 flex-col z-50 justify-between md:flex">
          <aside className="group flex w-16 flex-col items-center rounded-[34px] bg-white/20 border border-white/60 py-6 backdrop-blur-sm shadow-sm transition-all duration-300 hover:w-56">
            <div className="flex w-full flex-col items-center gap-8">

              <nav
                className="flex w-full flex-col gap-6 px-2"
                aria-label={`${navigation.label} navigation`}
              >
                {navigation.items.map((item) => {
                  const isActive = !item.href.includes("#") && pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      aria-label={item.label}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex h-12 w-full items-center gap-3 rounded-full px-3 transition-colors ${
                        isActive
                          ? "bg-[#0D1E4C] text-white shadow-[0_10px_24px_rgba(10,42,102,0.22)]"
                          : "text-[#0D1E4C] hover:bg-white/40"
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

          <aside className="group flex w-16 flex-col items-center rounded-full bg-white/40 backdrop-blur-sm py-2 shadow-sm transition-all duration-300">
            <Link
              href="/login"
              title="Log out"
              aria-label="Log out"
              className="flex h-12 w-[calc(100%-1rem)] items-center gap-3 rounded-2xl px-3 text-[#07183b] hover:bg-[#eef2f8]"
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
          
        <div className="min-h-0 min-w-0 flex-1">
          {children}
        </div>
      </div>
    </main>
  );
}
