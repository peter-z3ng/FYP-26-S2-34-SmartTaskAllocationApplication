export const sideMenuNavigation = {
  platformadmin: {
    label: "Platform Admin",
    homeHref: "/platformadmin",
    items: [
      { label: "Home", href: "/platformadmin", icon: "home" },
      { label: "Homepage", href: "/platformadmin/homepage", icon: "home" },
      { label: "Activity Logs", href: "/platformadmin/activity-logs", icon: "logs" },
      { label: "User Feedback", href: "/platformadmin/feedback", icon: "tasks" },
      { label: "Feedback Analysis", href: "/platformadmin/feedback-analysis", icon: "workspace" },
      { label: "Subscriptions", href: "/platformadmin/subscriptions", icon: "calendar" },
      { label: "Contact Inquiries", href: "/platformadmin/contact-inquiries", icon: "users" },
      { label: "Profile", href: "/platformadmin/settings", icon: "settings" },
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
