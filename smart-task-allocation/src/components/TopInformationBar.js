"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthHeaders } from "@/lib/clientAuth";
import { getDefaultAvatarUrl } from "@/lib/defaultAvatars";
import { getPendingTeamInvitations, respondToTeamInvitation } from "@/lib/localTeamStore";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { sideMenuNavigation } from "@/lib/sideMenuNavigation";

const roleActions = {
  platformadmin: [
    { label: "Review feedback", href: "/platformadmin", group: "Platform" },
    { label: "Update pricing plans", href: "/platformadmin", group: "Platform" },
    { label: "Open profile settings", href: "/platformadmin/settings", group: "Profile" },
  ],
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
    { label: "View assigned tasks", href: "/employee/tasks", group: "My Tasks" },
    { label: "Update availability", href: "/employee/availability", group: "Availability" },
    { label: "Manage profile settings", href: "/employee/settings", group: "Settings" },
  ],
};

const demoProfiles = {
  platformadmin: { name: "platform admin", email: "platformadmin@optima.co", avatarUrl: "", avatarReview: null },
  useradmin: { name: "user admin", email: "useradmin@optima.co", avatarUrl: "", avatarReview: null },
  manager: { name: "manager", email: "manager@optima.co", avatarUrl: "", avatarReview: null },
  employee: { name: "employee", email: "employee@optima.co", avatarUrl: "", avatarReview: null },
};

const fallbackNotificationItems = [
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
      className="h-6 w-6"
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

function getDemoProfile(actor) {
  if (typeof window === "undefined") return demoProfiles[actor] ?? demoProfiles.manager;

  const storedRole = window.localStorage.getItem("workflowDemoRole")?.toLowerCase().replace(/\s+/g, "");
  const profileKey = storedRole || actor;
  return demoProfiles[profileKey] ?? demoProfiles[actor] ?? demoProfiles.manager;
}

function profileHref(actor) {
  if (actor === "manager") return "/manager/my-space";
  if (actor === "employee") return "/employee/settings";
  if (actor === "platformadmin") return "/platformadmin/settings";
  return "/useradmin/accounts";
}

export default function TopInformationBar({ actor }) {
  const router = useRouter();
  const searchInputRef = useRef(null);
  const notificationsRef = useRef(null);
  const profileMenuRef = useRef(null);
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState(() => getDemoProfile(actor));
  const [notifications, setNotifications] = useState(fallbackNotificationItems);
  const [notificationError, setNotificationError] = useState("");
  const [now, setNow] = useState(() => new Date());

  const searchItems = useMemo(() => {
    const navigation = sideMenuNavigation[actor];
    const navigationItems =
      navigation?.items.map((item) => ({
        label: item.label,
        href: item.href,
        group: navigation.label,
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

    if (!normalizedQuery) return searchItems;

    return searchItems
      .filter((item) => `${item.group} ${item.label} ${item.href}`.toLowerCase().includes(normalizedQuery))
      .slice(0, 8);
  }, [query, searchItems]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadProfile();
      loadNotifications();
    }, 0);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor]);

  useEffect(() => {
    if (!isSearchOpen && !isNotificationsOpen && !isProfileOpen) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
        setQuery("");
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isSearchOpen, isNotificationsOpen, isProfileOpen]);

  useEffect(() => {
    if (!isNotificationsOpen && !isProfileOpen) return undefined;

    function handleOutsidePointerDown(event) {
      const target = event.target;

      if (!(target instanceof Node)) return;

      if (notificationsRef.current?.contains(target) || profileMenuRef.current?.contains(target)) {
        return;
      }

      setIsNotificationsOpen(false);
      setIsProfileOpen(false);
    }

    document.addEventListener("pointerdown", handleOutsidePointerDown, true);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown, true);
  }, [isNotificationsOpen, isProfileOpen]);

  async function loadProfile() {
    try {
      const response = await fetch("/api/profile", { headers: await getAuthHeaders() });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load profile.");
      }

      setProfile({
        email: result.account?.email ?? getDemoProfile(actor).email,
        name: result.profile?.full_name ?? result.account?.username ?? getDemoProfile(actor).name,
        avatarUrl: result.profile?.profile_picture_url ?? "",
        avatarReview: result.avatarReview ?? null,
      });
    } catch {
      setProfile(getDemoProfile(actor));
    }
  }

  async function loadNotifications() {
    try {
      setNotificationError("");
      const response = await fetch("/api/notifications", { headers: await getAuthHeaders() });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load notifications.");
      }

      const apiItems = result.items?.length ? result.items : [];
      const teamInvites =
        actor === "employee"
          ? getPendingTeamInvitations(profile).map((invitation) => ({
              id: `team-invite-${invitation.inviteId}`,
              kind: "teamInvite",
              inviteId: invitation.inviteId,
              title: "Team invitation received",
              text: `Manager invited you to join ${invitation.teamName}.`,
              status: "Pending",
              href: "/employee",
              createdAt: invitation.createdAt,
            }))
          : [];

      setNotifications([...teamInvites, ...apiItems]);
    } catch (loadError) {
      setNotificationError(loadError.message);
      setNotifications(fallbackNotificationItems);
    }
  }

  function handleTeamInvitation(inviteId, status) {
    respondToTeamInvitation(inviteId, status);
    setNotifications((current) => current.filter((item) => item.inviteId !== inviteId));
  }

  async function openProfileMenu() {
    if (!isProfileOpen) await loadProfile();

    setIsProfileOpen((current) => !current);
    setIsNotificationsOpen(false);
  }

  async function signOut() {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } else if (typeof window !== "undefined") {
      window.localStorage.removeItem("workflowDemoEmail");
      window.localStorage.removeItem("workflowDemoRole");
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <div className="top-info-bar relative z-40 flex min-h-14 w-full items-center gap-4 bg-[#C7DDEB]/80 px-4 py-1 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="relative ml-0 hidden h-10 w-full max-w-[340px] shrink-0 md:block lg:ml-22">
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

      <div className="flex min-w-0 shrink-0 items-center justify-end gap-3">
        <div ref={notificationsRef} className="relative min-w-0">
          <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen((current) => !current);
              setIsProfileOpen(false);
              loadNotifications();
            }}
            className="flex max-w-[42vw] items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#07183b] transition hover:bg-white/70 sm:max-w-full"
            aria-label="Open notifications"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#0a72e8]" />
            <span className="truncate">
              Workspace activity: task updates will appear here
            </span>
          </button>

          {isNotificationsOpen ? (
            <div className="top-info-popover absolute right-0 top-12 w-80 rounded-xl border border-white/60 bg-white/20 p-3 shadow-[0_18px_60px_rgba(7,24,59,0.16)] backdrop-blur-sm sm:w-96">
              <div className="flex items-center justify-between px-1">
                <p className="font-bold text-[#07183b]">Notifications</p>
                <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-sm font-bold text-[#0a2a66]">Live</span>
              </div>
              <div className="mt-3 space-y-2">
                {notificationError ? (
                  <p className="rounded-lg bg-[#f8faff] p-3 text-xs font-bold leading-5 text-[#61708a]">
                    {notificationError}
                  </p>
                ) : null}
                {!notifications.length ? (
                  <p className="rounded-lg bg-[#f8faff] p-3 text-xs font-bold leading-5 text-[#61708a]">
                    No task or profile notifications right now.
                  </p>
                ) : null}
                {notifications.map((item) => (
                  <div key={item.id} className="rounded-lg bg-[#f8faff] p-3 transition hover:-translate-y-0.5 hover:bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={item.href || profileHref(actor)}
                        onClick={() => setIsNotificationsOpen(false)}
                        className="text-sm font-bold text-[#07183b] hover:underline"
                      >
                        {item.title}
                      </Link>
                      {item.status ? (
                        <span className="rounded-full bg-[#eef6ff] px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-[#0a2a66]">
                          {item.status}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[#61708a]">{item.text}</p>
                    {item.kind === "teamInvite" ? (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleTeamInvitation(item.inviteId, "Accepted")}
                          className="rounded-full bg-[#0a72e8] px-3 py-1.5 text-xs font-black text-white"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTeamInvitation(item.inviteId, "Rejected")}
                          className="rounded-full border border-[#fecdd3] bg-white px-3 py-1.5 text-xs font-black text-[#be123c]"
                        >
                          Reject
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <p className="hidden whitespace-nowrap text-sm font-bold text-[#07183b] sm:block">{formatDateTime(now)}</p>

        <div ref={profileMenuRef} className="relative">
          <button
            type="button"
            onClick={openProfileMenu}
            className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#0a2a66] text-white shadow-sm transition hover:bg-[#07183b]"
            aria-label="Profile"
            title="Profile"
          >
            <Image
              src={profile.avatarUrl || getDefaultAvatarUrl(profile)}
              alt=""
              fill
              sizes="56px"
              unoptimized
              className="object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <span className="absolute inset-0 -z-10 flex items-center justify-center">
              <UserIcon />
            </span>
          </button>

          {isProfileOpen ? (
            <div className="top-info-popover absolute right-0 top-16 w-72 rounded-xl border border-white/60 bg-white/20 p-3 shadow-[0_18px_60px_rgba(7,24,59,0.16)] backdrop-blur-lg">
              <div className="rounded-lg bg-[#f8faff] p-3">
                <p className="text-sm font-bold text-[#07183b]">{profile.name}</p>
                <p className="mt-1 truncate text-xs text-[#61708a]">{profile.email}</p>
              </div>
              {profile.avatarReview?.status ? (
                <div className="mt-3 rounded-lg bg-[#f8faff] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0a2a66]">
                    Avatar {profile.avatarReview.status}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#61708a]">
                    {profile.avatarReview.status === "Rejected"
                      ? profile.avatarReview.moderationNote || "Your uploaded avatar was not approved."
                      : profile.avatarReview.status === "Pending"
                        ? "Your uploaded avatar is waiting for Platform Admin review."
                        : "Your approved avatar is visible on your profile icon."}
                  </p>
                </div>
              ) : null}
              <div className="mt-3 grid gap-2">
                <Link
                  href={profileHref(actor)}
                  className="rounded-md px-3 py-2 text-sm font-bold text-[#07183b] hover:bg-[#eef6ff]"
                  onClick={() => setIsProfileOpen(false)}
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
              <p className="px-3 py-2 text-sm font-bold text-white/55">Actions and pages</p>
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
                    <span className="shrink-0 text-sm font-semibold text-white/55">{item.group}</span>
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
  if (!value) return "";

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
