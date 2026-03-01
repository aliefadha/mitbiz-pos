import { db } from '@/db';
import { roles, user } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function findUserRoles(userId: string) {
  const userWithRole = await db
    .select({
      id: roles.id,
      name: roles.name,
      scope: roles.scope,
    })
    .from(user)
    .leftJoin(roles, eq(user.roleId, roles.id))
    .where(eq(user.id, userId))
    .limit(1);

  return userWithRole[0] || null;
}
