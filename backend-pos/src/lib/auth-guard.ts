import { auth } from "./auth";
import { db } from "../db";
import { user, member, teamMember, team } from "../db/schema/auth-schema";
import { eq, and } from "drizzle-orm";

export const ROLE_HIERARCHY: Record<string, number> = {
  superadmin: 100,
  owner: 50,
  cashier: 10,
} as const;

const ROLE_PERMISSIONS: Record<string, string[]> = {
  superadmin: ["*"],
  owner: [
    "product:create", "product:read", "product:update", "product:delete",
    "category:create", "category:read", "category:update", "category:delete",
    "transaction:create", "transaction:read", "transaction:update", "transaction:delete", "transaction:refund",
    "outlet:create", "outlet:read", "outlet:update", "outlet:delete",
    "report:read", "report:export",
    "settings:read", "settings:update",
  ],
  cashier: [
    "product:read",
    "category:read",
    "transaction:create", "transaction:read",
    "outlet:read",
    "report:read",
    "settings:read",
  ],
};

export async function isSuperadmin(userId: string): Promise<boolean> {
  const userIdList = (process.env.SUPERADMIN_USER_IDS?.split(",") || []) as string[];
  return userIdList.includes(userId);
}

export async function getUserRole(userId: string): Promise<string | null> {
  const [userRecord] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return userRecord?.role ?? null;
}

export async function getActiveOrganizationId(headers: Headers): Promise<string | null> {
  const session = await auth.api.getSession({ headers });
  return session?.session?.activeOrganizationId ?? null;
}

export async function getActiveTeamId(headers: Headers): Promise<string | null> {
  const session = await auth.api.getSession({ headers });
  return session?.session?.activeTeamId ?? null;
}

export async function getUserOrganizations(userId: string): Promise<string[]> {
  const members = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, userId));
  return members.map((m) => m.organizationId);
}

export async function getUserTeams(userId: string, organizationId: string): Promise<string[]> {
  const teams = await db
    .select({ teamId: teamMember.teamId })
    .from(teamMember)
    .innerJoin(team, eq(teamMember.teamId, team.id))
    .where(and(eq(teamMember.userId, userId), eq(team.organizationId, organizationId)));
  return teams.map((t) => t.teamId);
}

export async function canAccessOrganization(userId: string, organizationId: string): Promise<boolean> {
  if (await isSuperadmin(userId)) return true;
  const role = await getUserRole(userId);
  if (role === "owner") return true;

  const [memberRecord] = await db
    .select()
    .from(member)
    .where(and(eq(member.organizationId, organizationId), eq(member.userId, userId)))
    .limit(1);

  return memberRecord !== undefined;
}

export async function isOrganizationOwner(userId: string, organizationId: string): Promise<boolean> {
  if (await isSuperadmin(userId)) return true;
  const role = await getUserRole(userId);
  return role === "owner";
}

export async function canAccessTeam(
  userId: string,
  teamId: string,
  organizationId: string
): Promise<boolean> {
  if (await isSuperadmin(userId)) return true;

  const role = await getUserRole(userId);
  if (role === "owner") return true;

  const [teamMemberRecord] = await db
    .select()
    .from(teamMember)
    .where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))
    .limit(1);

  return teamMemberRecord !== undefined;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

export async function checkPermission(
  userId: string,
  permission: string,
  _organizationId?: string
): Promise<PermissionCheckResult> {
  if (await isSuperadmin(userId)) return { allowed: true };

  const role = await getUserRole(userId);
  if (!role) return { allowed: false, reason: "No role assigned" };

  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return { allowed: false, reason: "Unknown role" };

  const allowed = permissions.includes("*") || permissions.includes(permission);
  return {
    allowed,
    reason: allowed ? undefined : `Role '${role}' does not have permission '${permission}'`,
  };
}

export function hasHigherRole(role1: string, role2: string): boolean {
  return (ROLE_HIERARCHY[role1] || 0) > (ROLE_HIERARCHY[role2] || 0);
}
