import { useQuery } from '@tanstack/react-query';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { type Outlet as OutletType, type Tenant, tenantsApi } from '@/lib/api/tenants';
import { useAuth } from './auth-context';

interface TenantContextType {
  selectedTenant: Tenant | null;
  selectedOutlet: OutletType | null;
  setSelectedTenant: (tenant: Tenant | null) => void;
  setSelectedOutlet: (outlet: OutletType | null) => void;
  tenants: Tenant[];
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const [selectedTenant, setSelectedTenantState] = useState<Tenant | null>(null);
  const [selectedOutlet, setSelectedOutletState] = useState<OutletType | null>(null);

  const { data: tenantsData, isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantsApi.getMyTenants(),
    enabled: !!user?.id,
  });

  const tenants = tenantsData ?? [];

  useEffect(() => {
    if (tenants.length > 0 && !selectedTenant) {
      if (role === 'cashier' && user?.outletId) {
        const tenantWithOutlet = tenants.find((t) =>
          t.outlets?.some((o) => o.id === user.outletId)
        );
        if (tenantWithOutlet) {
          setSelectedTenantState(tenantWithOutlet);
          const outlet = tenantWithOutlet.outlets?.find((o) => o.id === user.outletId);
          if (outlet) {
            setSelectedOutletState(outlet);
          }
        }
      } else {
        setSelectedTenantState(tenants[0]);
      }
    }
  }, [tenants, selectedTenant, role, user?.outletId]);

  useEffect(() => {
    if (selectedTenant && user?.outletId) {
      const outlet = selectedTenant.outlets?.find((o) => o.id === user.outletId);
      if (outlet) {
        setSelectedOutletState(outlet);
      }
    }
  }, [selectedTenant, user?.outletId]);

  const setSelectedTenant = (tenant: Tenant | null) => {
    if (role === 'cashier') return;
    setSelectedTenantState(tenant);
    if (tenant?.outlets && tenant.outlets.length > 0) {
      const defaultOutlet = tenant.outlets[0];
      if (user?.outletId) {
        const userOutlet = tenant.outlets.find((o) => o.id === user.outletId);
        setSelectedOutletState(userOutlet || defaultOutlet);
      } else {
        setSelectedOutletState(defaultOutlet);
      }
    } else {
      setSelectedOutletState(null);
    }
  };

  const setSelectedOutlet = (outlet: OutletType | null) => {
    if (role === 'cashier') return;
    setSelectedOutletState(outlet);
  };

  return (
    <TenantContext.Provider
      value={{
        selectedTenant,
        selectedOutlet,
        setSelectedTenant,
        setSelectedOutlet,
        tenants,
        isLoading: tenantsLoading,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
