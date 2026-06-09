"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { sideMenuNavigation } from "@/lib/sideMenuNavigation";

const roleActions = {
  manager: [
    { label: "Create workspace", href: "/manager/workspace", group: "Workspace" },
    { label: "Create workspace item", href: "/manager/workspace", group: "Workspace" },
    { label: "Review team capacity", href: "/manager/team", group: "Team" },
    { label: "View organization", href: "/manager/organization", group: "Organization" },
    { label: "Open inbox", href: "/manager/inbox", group: "Inbox" },
    { label: "Open my space", href: "/manager/my-space", group: "My Space" },
    { label: "Review archive", href: "/manager/archive", group: "Archive" },
    { label: "Get support", href: "/manager/support", group: "Support" },
  ],
  useradmin: [
    { label: "Create account", href: "/useradmin/accounts", group: "Accounts" },
    { label: "Invite user", href: "/useradmin/accounts", group: "Accounts" },
    { label: "Update organization profile", href: "/useradmin/organization", group: "Organization" },
    { label: "Review roles", href: "/useradmin/roles", group: "Roles" },
  ],
  employee: [
    { label: "Open workspace", href: "/employee/workspace", group: "Workspace" },
    { label: "Review team", href: "/employee/team", group: "Team" },
    { label: "Open inbox", href: "/employee/inbox", group: "Inbox" },
    { label: "Open my space", href: "/employee/my-space", group: "My Space" },
    { label: "Get support", href: "/employee/support", group: "Support" },
  ],
};

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
  const searchInputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState({ email: "", name: "" });
  const [now, setNow] = useState(() => new Date());

  const searchItems = useMemo(() => {
    const navigationItems =
      sideMenuNavigation[actor]?.items.map((item) => ({
        label: item.label,
        href: item.href,
        group: sideMenuNavigation[actor].label,
        type: "Page",
      })) ?? [];
    const actionItems = (roleActions[actor] ?? []).map((item) => ({
      ...item,
      type: "Action",
    }));

    return [...actionItems, ...navigationItems];
  }, [actor]);

  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return searchItems;
    }

    return searchItems
      .filter((item) =>
        `${item.group} ${item.label} ${item.href}`.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 8);
  }, [query, searchItems]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    searchInputRef.current?.focus();
  }, [isSearchOpen]);

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
      return "/manager/my-space";
    }

    if (actor === "employee") {
      return "/employee/my-space";
    }

    return "/useradmin/accounts";
  }

  return (
    <div className="relative z-100 flex min-h-14 w-full items-center gap-4 bg-[#C7DDEB]/80 px-4 py-1 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="relative h-10 w-full max-w-[340px] shrink-0 ml-22">
        <span className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#61708a]">
          <SearchIcon />
        </span>
        <button
          type="button"
          onClick={() => {
            setIsSearchOpen(true);
            setIsNotificationsOpen(false);
            setIsProfileOpen(false);
          }}
          className="absolute inset-0 h-full w-full rounded-full border border-transparent bg-[#e8ebf1] pl-10 pr-4 text-left text-sm font-medium text-[#61708a] outline-none transition hover:bg-white/80 focus:border-[#b8c4d8] focus:bg-white"
          aria-label="Open global search"
        >
          Search...
        </button>
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
          <div className="absolute right-0 top-12 w-80 rounded-xl border border-white/60 bg-white/20 p-3 shadow-[0_18px_60px_rgba(7,24,59,0.16)] backdrop-blur-sm">
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
            <div className="absolute right-0 top-14 w-72 rounded-xl border border-white/60 bg-white/20 p-3 shadow-[0_18px_60px_rgba(7,24,59,0.16)] backdrop-blur-lg">
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

      {isSearchOpen ? (
        <div className="fixed inset-0 z-50 bg-black/35 px-4 py-10 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#151719] text-white shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
            <div className="flex items-center gap-4 border-b border-white/10 px-6 py-5">
              <span className="text-white/65">
                <SearchIcon />
              </span>
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setIsSearchOpen(false);
                    setQuery("");
                  }
                }}
                placeholder="Search for apps and commands..."
                className="h-6 min-w-0 flex-1 bg-transparent text-xl font-semibold text-white outline-none placeholder:text-white/45"
                aria-label="Search for apps and commands"
              />
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  setQuery("");
                }}
                className="rounded-md border border-white/15 px-3 py-2 text-sm font-bold text-white/70 hover:bg-white/10"
              >
                Esc
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-4 py-4">
              <p className="px-3 py-2 text-sm font-bold text-white/55">
                Actions and pages
              </p>
              <div className="space-y-1">
                {searchResults.map((item) => (
                  <Link
                    key={`${item.type}-${item.group}-${item.href}-${item.label}`}
                    href={item.href}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setQuery("");
                    }}
                    className="flex items-center justify-between gap-4 rounded-lg px-3 py-3 text-left hover:bg-white/10"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-black">
                        {item.label.charAt(0)}
                      </span>
                      <span className="truncate text-sm font-bold">{item.label}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-white/55">
                      {item.group}
                    </span>
                  </Link>
                ))}
                {!searchResults.length ? (
                  <p className="rounded-lg px-3 py-8 text-center text-sm font-semibold text-white/45">
                    No matching actions or pages for this account.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white/55">
              <span>{sideMenuNavigation[actor]?.label} search only</span>
              <span>Open result</span>
            </div>
          </div>
        </div>
      ) : null}
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
