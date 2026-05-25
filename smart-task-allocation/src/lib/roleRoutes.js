const ROLE_ROUTES = {
  platformadmin: "/platformadmin",
  platform_admin: "/platformadmin",
  "platform admin": "/platformadmin",
  useradmin: "/useradmin/accounts",
  user_admin: "/useradmin/accounts",
  "user admin": "/useradmin/accounts",
  manager: "/manager",
  employee: "/employee",
};

export function getHomeRouteForRole(roleName) {
  if (!roleName) {
    return null;
  }

  const normalizedRole = roleName.trim().toLowerCase();
  return ROLE_ROUTES[normalizedRole] ?? null;
}
