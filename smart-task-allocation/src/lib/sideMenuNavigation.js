export const sideMenuNavigation = {
  useradmin: {
    label: "User Admin",
    homeHref: "/useradmin",
    items: [
      { label: "Home", href: "/useradmin", icon: "home" },
      { label: "Organization", href: "/useradmin/organization", icon: "organization" },
      { label: "Accounts", href: "/useradmin/accounts", icon: "users" },
      { label: "Roles", href: "/useradmin/roles", icon: "settings" },
    ],
  },
  manager: {
    label: "Manager",
    homeHref: "/manager",
    items: [
      { label: "Home", href: "/manager", icon: "home" },
      { label: "Tasks", href: "/manager/tasks", icon: "tasks" },
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
