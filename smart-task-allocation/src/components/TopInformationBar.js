"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { sideMenuNavigation } from "@/lib/sideMenuNavigation";

const platformActions = [
  { label: "Create workspace", href: "/manager/tasks", group: "Action" },
  { label: "Create task", href: "/manager/tasks", group: "Action" },
  { label: "Invite user", href: "/useradmin/accounts", group: "Action" },
  { label: "Organization profile", href: "/useradmin/organization", group: "Action" },
  { label: "Availability schedule", href: "/employee/availability", group: "Action" },
];

const notificationItems = [
  {
    id: 1,
    title: "Workspace activity",
    text: "Task updates and assignments will appear here.",
  },
  {
    id: 2,
    title: "Profile",
    text: "Profile and account alerts are available from every page.",
  },
];

function SearchIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  );
}

export default function TopInformationBar({ actor }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState({ email: "", name: "" });
  const [now, setNow] = useState(() => new Date());

  const searchItems = useMemo(() => {
    const navigationItems = Object.values(sideMenuNavigation).flatMap((section) =>
      section.items.map((item) => ({
        label: item.label,
        href: item.href,
        group: section.label,
      }))
    );

    return [...navigationItems, ...platformActions];
  }, []);

  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return searchItems
      .filter((item) =>
        `${item.group} ${item.label} ${item.href}`.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 7);
  }, [query, searchItems]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  async function loadProfile() {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;

    setProfile({
      email: user?.email ?? "Signed in user",
      name: user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Profile",
    });
  }

  async function openProfileMenu() {
    if (!isProfileOpen) {
      await loadProfile();
    }

    setIsProfileOpen((current) => !current);
    setIsNotificationsOpen(false);
  }

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function profileHref() {
    if (actor === "manager") {
      return "/manager/settings";
    }

    if (actor === "employee") {
      return "/employee/settings";
    }

    return "/useradmin/accounts";
  }

  return (
    <div className="relative z-30 flex min-h-14 w-full items-center gap-4 border-b border-[#9fb8d0]/60 bg-[#C7DDEB]/80 px-4 py-1 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="relative h-10 w-full max-w-[340px] shrink-0 ml-22">
        <span className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#61708a]">
          <SearchIcon />
        </span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search..."
          className="absolute inset-0 h-full w-full rounded-full border border-transparent bg-[#e8ebf1] pl-10 pr-4 text-sm font-medium text-[#07183b] outline-none placeholder:text-[#61708a] focus:border-[#b8c4d8] focus:bg-white"
          aria-label="Search across Pace"
        />

        {searchResults.length ? (
          <div className="absolute left-0 top-12 w-full overflow-hidden rounded-xl border border-[#d8e0ee] bg-white shadow-[0_18px_60px_rgba(7,24,59,0.16)]">
            {searchResults.map((item) => (
              <Link
                key={`${item.group}-${item.href}-${item.label}`}
                href={item.href}
                onClick={() => setQuery("")}
                className="flex items-center justify-between gap-3 border-b border-[#eef2f8] px-4 py-3 text-sm last:border-b-0 hover:bg-[#f4f7fb]"
              >
                <span className="font-bold text-[#07183b]">{item.label}</span>
                <span className="text-xs font-semibold text-[#61708a]">{item.group}</span>
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="min-w-0 flex-1" />

      <div className="flex shrink-0 items-center justify-end gap-3">
        <div className="relative">
        <button
          type="button"
          onClick={() => {
            setIsNotificationsOpen((current) => !current);
            setIsProfileOpen(false);
          }}
          className="flex max-w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#07183b] transition hover:bg-white/70"
          aria-label="Open notifications"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#0a72e8]" />
          <span className="truncate">Workspace activity: task updates will appear here</span>
        </button>

        {isNotificationsOpen ? (
          <div className="absolute right-0 top-12 w-80 rounded-xl border border-[#d8e0ee] bg-white p-3 shadow-[0_18px_60px_rgba(7,24,59,0.16)]">
            <div className="flex items-center justify-between px-1">
              <p className="font-bold text-[#07183b]">Notifications</p>
              <span className="rounded-full bg-[#eef6ff] px-2 py-1 text-xs font-bold text-[#0a2a66]">
                Live
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {notificationItems.map((item) => (
                <div key={item.id} className="rounded-lg bg-[#f8faff] p-3">
                  <p className="text-sm font-bold text-[#07183b]">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[#61708a]">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        </div>
        <p className="hidden whitespace-nowrap text-sm font-bold text-[#07183b] sm:block">
          {formatDateTime(now)}
        </p>
        <div className="relative">
          <button
            type="button"
            onClick={openProfileMenu}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0a2a66] text-white shadow-sm transition hover:bg-[#07183b]"
            aria-label="Profile"
            title="Profile"
          >
            <UserIcon />
          </button>

          {isProfileOpen ? (
            <div className="absolute right-0 top-14 w-72 rounded-xl border border-[#d8e0ee] bg-white p-3 shadow-[0_18px_60px_rgba(7,24,59,0.16)]">
              <div className="rounded-lg bg-[#f8faff] p-3">
                <p className="text-sm font-bold text-[#07183b]">{profile.name}</p>
                <p className="mt-1 truncate text-xs text-[#61708a]">{profile.email}</p>
              </div>
              <div className="mt-3 grid gap-2">
                <Link
                  href={profileHref()}
                  className="rounded-md px-3 py-2 text-sm font-bold text-[#07183b] hover:bg-[#eef6ff]"
                >
                  View profile
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="rounded-md px-3 py-2 text-left text-sm font-bold text-red-700 hover:bg-red-50"
                >
                  Log out
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) {
    return "";
  }

  const time = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(value);
  const day = new Intl.DateTimeFormat("en", { day: "numeric" }).format(value);
  const month = new Intl.DateTimeFormat("en", { month: "short" }).format(value);
  const year = new Intl.DateTimeFormat("en", { year: "2-digit" }).format(value);
  const weekday = new Intl.DateTimeFormat("en", { weekday: "short" }).format(value);

  return `${time} ${day} ${month} ${year} ${weekday}`;
}
