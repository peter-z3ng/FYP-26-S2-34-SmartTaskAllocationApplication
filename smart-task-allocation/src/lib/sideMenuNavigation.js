export const sideMenuNavigation = {
  platformadmin: {
    label: "Platform Admin",
    homeHref: "/dashboard",
    items: [
      { label: "Home", href: "/dashboard", icon: "home" },
      { label: "Organisations", href: "/dashboard#organisations", icon: "organization" },
      { label: "Users", href: "/dashboard#users", icon: "users" },
      { label: "Roles", href: "/dashboard#roles", icon: "workspace" },
      { label: "Activity Logs", href: "/platformadmin/activity-logs", icon: "logs" },
      { label: "Settings", href: "/platformadmin/settings", icon: "settings" },
    ],
  },
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
    homeHref: "/manager",
    items: [
      { label: "Home", href: "/manager", icon: "home" },
      { label: "Workspace", href: "/manager/workspace", icon: "workspace" },
      { label: "Team", href: "/manager/team", icon: "users" },
      { label: "Settings", href: "/manager/settings", icon: "settings" },
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
