import { createFileRoute, redirect } from '@tanstack/react-router';
import { SettingsPage } from '@/components/settings/settings-page';
import { checkPermission } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/settings/')({
  component: SettingsPage,
  beforeLoad: async () => {
    const { allowed } = await checkPermission('settings', 'read');
    if (!allowed) {
      throw redirect({ to: '/403' });
    }
  },
});
