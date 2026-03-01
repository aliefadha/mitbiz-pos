import { createContext, type ReactNode, useContext } from 'react';
import { type Outlet as OutletType, type Tenant } from '@/lib/api/tenants';

interface TenantContextType {
  selectedTenant: Tenant | null;
  selectedOutlet: OutletType | null;
  setSelectedTenant: (tenant: Tenant | null) => void;
  setSelectedOutlet: (outlet: OutletType | null) => void;
  tenants: Tenant[];
  isLoading: boolean;
}

const defaultValue: TenantContextType = {
  selectedTenant: null,
  selectedOutlet: null,
  setSelectedTenant: () => {},
  setSelectedOutlet: () => {},
  tenants: [],
  isLoading: false,
};

const TenantContext = createContext<TenantContextType>(defaultValue);

export function TenantProvider({ children }: { children: ReactNode }) {
  return (
    <TenantContext.Provider
      value={{
        selectedTenant: null,
        selectedOutlet: null,
        setSelectedTenant: () => {},
        setSelectedOutlet: () => {},
        tenants: [],
        isLoading: false,
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
