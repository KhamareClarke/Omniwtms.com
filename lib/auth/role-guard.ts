/**
 * Central role-based access: defines roles, their home routes, and auth keys.
 * Used by dashboard, courier, and customer layouts for redirect logic.
 */

export type AppRole = "client" | "admin" | "courier" | "customer" | null;

const ROLE_HOME: Record<Exclude<AppRole, null>, string> = {
  client: "/dashboard",
  admin: "/dashboard",
  courier: "/courier",
  customer: "/customer",
};

const STORAGE_KEYS = {
  client: "currentUser",
  admin: "currentUser",
  courier: "currentCourier",
  customer: "currentCustomer",
} as const;

/** Get current role from localStorage (which key is set). Client and admin both use currentUser. */
export function getCurrentRole(): AppRole {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("currentUser");
  if (user) {
    try {
      const data = JSON.parse(user);
      return data.type === "admin" ? "admin" : "client";
    } catch {
      return "client";
    }
  }
  if (localStorage.getItem("currentCourier")) return "courier";
  if (localStorage.getItem("currentCustomer")) return "customer";
  return null;
}

/** Home route for a role. */
export function getHomeForRole(role: AppRole): string {
  if (!role) return "/auth/login";
  return ROLE_HOME[role];
}

/** Path is allowed for this role (dashboard for client/admin, /courier for courier, /customer for customer). */
export function isPathAllowedForRole(path: string, role: AppRole): boolean {
  if (!role) return false;
  if (path.startsWith("/dashboard")) return role === "client" || role === "admin";
  if (path.startsWith("/courier")) return role === "courier";
  if (path.startsWith("/customer")) return role === "customer";
  return false;
}

/** Get redirect path when user is on a route they're not allowed. Returns home for their role or login. */
export function getRedirectForWrongRole(currentPath: string): string {
  const role = getCurrentRole();
  if (!role) return "/auth/login";
  if (currentPath.startsWith("/dashboard") && role !== "client" && role !== "admin")
    return ROLE_HOME[role];
  if (currentPath.startsWith("/courier") && role !== "courier") return ROLE_HOME[role];
  if (currentPath.startsWith("/customer") && role !== "customer") return ROLE_HOME[role];
  return ""; // no redirect needed
}

/** Clear all role-related storage (logout). */
export function clearAllRoleStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("currentUser");
  localStorage.removeItem("currentCourier");
  localStorage.removeItem("currentCustomer");
}
