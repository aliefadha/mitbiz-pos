import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, Building2 } from 'lucide-react';
import { useTenantDetailPage } from '@/components/tenants/hooks/use-tenant-detail-page';
import { TenantDetailHeader } from '@/components/tenants/tenant-detail-header';
import { TenantDetailStats } from '@/components/tenants/tenant-detail-stats';
import { TenantDetailTabs } from '@/components/tenants/tenant-detail-tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { checkPermissionWithScope } from '@/lib/permissions';

function TenantDetailPage() {
  const { tenantId } = useParams({ from: '/_protected/(global)/tenants/$tenantId' });
  const navigate = useNavigate();

  const { tenant, tenantLoading, isError, summary } = useTenantDetailPage(tenantId);

  if (tenantLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !tenant) {
    return (
      <div className="space-y-6">
        <Button
          variant="link"
          onClick={() => navigate({ to: '/tenants' })}
          className="pl-0 text-gray-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Manajemen Bisnis
        </Button>
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <Building2 className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">Bisnis tidak ditemukan</p>
          <p className="text-sm mt-1">Data bisnis yang Anda cari tidak tersedia</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="link"
        onClick={() => navigate({ to: '/tenants' })}
        className="pl-0 text-gray-500"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Manajemen Bisnis
      </Button>

      <TenantDetailHeader tenant={tenant} />

      <TenantDetailStats summary={summary} />

      <TenantDetailTabs tenant={tenant} tenantId={tenantId} />
    </div>
  );
}

export const Route = createFileRoute('/_protected/(global)/tenants/$tenantId')({
  component: TenantDetailPage,
  beforeLoad: async () => {
    await checkPermissionWithScope('tenants', 'read', 'global');
  },
});
