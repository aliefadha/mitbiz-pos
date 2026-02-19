import { redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export type Role = "admin" | "owner" | "cashier";

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: [
    "/tenants",
    "/settings",
    "/account",
    "/dashboard",
    "/inventory",
    "/outlets",
  ],
  owner: ["/tenants/new", "/settings", "/dashboard", "/inventory", "/outlets"],
  cashier: ["/dashboard", "/inventory", "/outlets"],
};

export async function checkAuth() {
  const { data: session } = await authClient.getSession();
  if (!session) {
    throw redirect({ to: "/login" });
  }
  return session;
}

export async function checkRoleAccess(pathname: string) {
  const session = await checkAuth();
  // @ts-ignore
  const role = (session.user.role as Role) || "cashier";
  const allowedRoutes = ROLE_PERMISSIONS[role];

  const hasAccess = allowedRoutes.some((route) => pathname.startsWith(route));

  if (!hasAccess) {
    throw redirect({ to: "/dashboard" });
  }

  return { session, role };
}
