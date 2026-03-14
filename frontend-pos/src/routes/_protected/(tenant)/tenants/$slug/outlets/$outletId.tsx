import { createFileRoute } from '@tanstack/react-router';
import { OutletDetailPage } from '@/components/outlets/outlet-detail-page';

export const Route = createFileRoute('/_protected/(tenant)/tenants/$slug/outlets/$outletId')({
  component: OutletDetailPage,
});
