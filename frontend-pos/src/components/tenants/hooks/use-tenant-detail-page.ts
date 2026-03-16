import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { tenantsApi } from '@/lib/api/tenants';

export function useTenantDetailPage(tenantId: string) {
  const [activeTab, setActiveTab] = useState('overview');

  const {
    data: tenant,
    isLoading: tenantLoading,
    isError,
  } = useQuery({
    queryKey: ['tenant-detail', tenantId],
    queryFn: () => tenantsApi.getById(tenantId),
    enabled: !!tenantId,
  });

  const { data: summary } = useQuery({
    queryKey: ['tenant-summary', tenant?.slug],
    queryFn: () => tenantsApi.getSummary(tenant!.slug),
    enabled: !!tenant?.slug,
  });

  return {
    activeTab,
    setActiveTab,
    tenant,
    tenantLoading,
    isError,
    summary,
  };
}
