import {
  OrdersTab,
  OutletsTab,
  OverviewTab,
  ProductsTab,
  SettingsTab,
  UsersTab,
} from '@/components/tenants/tabs';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Tenant } from '@/lib/api/tenants';

interface TenantDetailTabsProps {
  tenant: Tenant;
  tenantId: string;
}

export function TenantDetailTabs({ tenant, tenantId }: TenantDetailTabsProps) {
  return (
    <>
      <Separator />
      <Tabs defaultValue="overview" className="w-full">
        <TabsList variant="line">
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="outlets">Outlet</TabsTrigger>
          <TabsTrigger value="products">Produk</TabsTrigger>
          <TabsTrigger value="orders">Pesanan</TabsTrigger>
          <TabsTrigger value="users">Pengguna</TabsTrigger>
          <TabsTrigger value="settings">Pengaturan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab tenant={tenant} />
        </TabsContent>

        <TabsContent value="outlets">
          <OutletsTab slug={tenant.slug} />
        </TabsContent>

        <TabsContent value="products">
          <ProductsTab tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="orders">
          <OrdersTab tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="users">
          <UsersTab tenant={tenant} />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab tenant={tenant} />
        </TabsContent>
      </Tabs>
    </>
  );
}
