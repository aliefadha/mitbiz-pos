import { useMemo } from 'react';
import { type MenuGroup, menuConfig } from '@/config/menu';
import { useAuth } from '@/contexts/auth-context';
import { usePermissions } from '@/hooks/use-auth';

export function useMenuConfig(): MenuGroup[] {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  const userScope = user?.roles?.scope;

  const filteredMenuConfig = useMemo(() => {
    return menuConfig
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          // Check all permission actions (ALL must be satisfied)
          const hasAllPerms = item.permissions.every((perm) =>
            perm.actions.every((action) => hasPermission(perm.resource, action))
          );
          if (!hasAllPerms) return false;

          // Check scope requirement
          if (item.scope && item.scope !== userScope) {
            return false;
          }

          return true;
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [hasPermission, userScope]);

  return filteredMenuConfig;
}
