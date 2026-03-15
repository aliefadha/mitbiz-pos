import { createFileRoute, useParams } from '@tanstack/react-router';
import { TenantDetailPage } from '@/components/tenants/tenant-detail-page';

function TenantDetailRoute() {
  const { tenantId } = useParams({
    from: '/_protected/(global)/tenants/$tenantId',
  });

  return <TenantDetailPage tenantId={tenantId} />;
}

export const Route = createFileRoute('/_protected/(global)/tenants/$tenantId')({
  component: TenantDetailRoute,
});
