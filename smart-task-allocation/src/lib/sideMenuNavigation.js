export const sideMenuNavigation = {
  useradmin: {
    label: "User Admin",
    homeHref: "/useradmin/accounts",
    items: [
      { label: "Accounts", href: "/useradmin/accounts", icon: "users" },
      { label: "Organization", href: "/useradmin/organization", icon: "organization" },
      { label: "Roles", href: "/useradmin/roles", icon: "settings" },
    ],
  },
  manager: {
    label: "Manager",
    homeHref: "/manager/workspace",
    items: [
      { label: "Workspace", href: "/manager/workspace", icon: "workspace" },
      { label: "Team", href: "/manager/team", icon: "users" },
      { label: "Organization", href: "/manager/organization", icon: "organization" },
      { label: "Inbox", href: "/manager/inbox", icon: "inbox" },
      { label: "My Space", href: "/manager/my-space", icon: "home" },
      { label: "Archive", href: "/manager/archive", icon: "archive" },
      { label: "Support", href: "/manager/support", icon: "support" },
    ],
  },
  employee: {
    label: "Employee",
    homeHref: "/employee",
    items: [
      { label: "Home", href: "/employee", icon: "home" },
      { label: "My Tasks", href: "/employee/tasks", icon: "tasks" },
      { label: "Availability", href: "/employee/availability", icon: "calendar" },
      { label: "Settings", href: "/employee/settings", icon: "settings" },
    ],
  },
};
