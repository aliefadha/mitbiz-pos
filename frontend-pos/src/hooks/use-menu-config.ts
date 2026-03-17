import { useMemo } from 'react';
import { type MenuGroup, menuConfig } from '@/config/menu';
import { useAuth } from '@/contexts/auth-context';
import { usePermissions } from '@/hooks/use-auth';

export function useMenuConfig(): MenuGroup[] {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  const userScope = user?.roleScope;

  const filteredMenuConfig = useMemo(() => {
    return menuConfig
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          // Check permission with OR logic - user needs ANY of the specified permissions
          const hasAnyPerm = item.permissions.some((perm) => {
            const actionsToCheck = perm.actions || (perm.action ? [perm.action] : []);
            return actionsToCheck.some((action) => hasPermission(perm.resource, action));
          });
          if (!hasAnyPerm) return false;

          // Check scope requirement (default to 'tenant' if not specified)
          const itemScope = item.scope ?? 'tenant';
          if (itemScope !== userScope) {
            return false;
          }

          return true;
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [hasPermission, userScope]);

  return filteredMenuConfig;
}
