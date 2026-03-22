import { type Permission } from './api/roles';
import { authClient } from './auth-client';

interface SessionUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  image?: string;
  roleId?: string;
  roleScope?: string;
  tenantId?: string;
  outletId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Session {
  user: SessionUser;
  session: {
    id: string;
    expiresAt: Date;
    token: string;
  };
}

// Session caching
let cachedSession: Session | null = null;
let sessionCacheTimestamp: number = 0;
const SESSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getCachedSession(): Session | null {
  if (!cachedSession) return null;
  if (Date.now() - sessionCacheTimestamp > SESSION_CACHE_TTL) {
    cachedSession = null;
    sessionCacheTimestamp = 0;
    return null;
  }
  return cachedSession;
}

export function setCachedSession(session: Session): void {
  cachedSession = session;
  sessionCacheTimestamp = Date.now();
}

export function clearCachedSession(): void {
  cachedSession = null;
  sessionCacheTimestamp = 0;
}

export async function getSessionWithCache(): Promise<Session | null> {
  const cached = getCachedSession();
  if (cached) return cached;

  const result = await authClient.getSession();
  if (result.data) {
    setCachedSession(result.data as Session);
    return result.data as Session;
  }
  return null;
}

// Permissions caching
const permissionsCache: Map<string, Permission[]> = new Map();
const permissionsCacheTimestamp: Map<string, number> = new Map();
const PERMISSIONS_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export function getCachedPermissions(roleId: string): Permission[] | null {
  if (!roleId) return null;

  const cached = permissionsCache.get(roleId);
  const timestamp = permissionsCacheTimestamp.get(roleId);

  if (!cached || !timestamp) return null;
  if (Date.now() - timestamp > PERMISSIONS_CACHE_TTL) {
    permissionsCache.delete(roleId);
    permissionsCacheTimestamp.delete(roleId);
    return null;
  }
  return cached;
}

export function setCachedPermissions(roleId: string, permissions: Permission[]): void {
  permissionsCache.set(roleId, permissions);
  permissionsCacheTimestamp.set(roleId, Date.now());
}

export function clearPermissionsCache(): void {
  permissionsCache.clear();
  permissionsCacheTimestamp.clear();
}
