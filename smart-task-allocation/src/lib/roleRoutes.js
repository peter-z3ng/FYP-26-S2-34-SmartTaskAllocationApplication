const ROLE_ROUTES = {
  platformadmin: "/platformadmin",
  platform_admin: "/platformadmin",
  "platform admin": "/platformadmin",
  useradmin: "/useradmin",
  user_admin: "/useradmin",
  "user admin": "/useradmin",
  manager: "/manager",
  employee: "/employee",
};

export function getDashboardRouteForRole(roleName) {
  if (!roleName) {
    return null;
  }

  const normalizedRole = roleName.trim().toLowerCase();
  return ROLE_ROUTES[normalizedRole] ?? null;
}
