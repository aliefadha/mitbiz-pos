import { Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import {
  ChartBar,
  Clock4,
  CreditCard,
  FileText,
  Folder,
  History,
  LayoutDashboard,
  LogOut,
  Package,
  Package2,
  Percent,
  Settings,
  Store,
  User,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar';
import { useLogout, usePermissions } from '@/hooks/use-auth';
import { useAuth } from '../contexts/auth-context';

interface MenuItem {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  permission: { resource: string; actions: string[] };
}

interface MenuGroup {
  group: string;
  items: MenuItem[];
}

const menuConfig: MenuGroup[] = [
  {
    group: 'Dashboard',
    items: [
      {
        key: '/dashboard',
        icon: LayoutDashboard,
        label: 'Dashboard',
        permission: { resource: 'dashboard', actions: ['read'] },
      },
      {
        key: '/laporan',
        icon: FileText,
        label: 'Laporan',
        permission: { resource: 'report', actions: ['read'] },
      },
      {
        key: '/cash-shifts',
        icon: Clock4,
        label: 'Shift Kasir',
        permission: { resource: 'cashShifts', actions: ['read'] },
      },
    ],
  },
  {
    group: 'Master Data',
    items: [
      {
        key: '/tenants',
        icon: Users,
        label: 'Tenant',
        permission: { resource: 'tenants', actions: ['create'] },
      },
      {
        key: '/outlets',
        icon: Store,
        label: 'Outlet',
        permission: { resource: 'outlets', actions: ['read'] },
      },
      {
        key: '/kasir',
        icon: Users,
        label: 'Kasir',
        permission: { resource: 'users', actions: ['read', 'create', 'list'] },
      },
      {
        key: '/categories',
        icon: Folder,
        label: 'Kategori',
        permission: { resource: 'categories', actions: ['read'] },
      },
      {
        key: '/products',
        icon: Package,
        label: 'Produk',
        permission: { resource: 'products', actions: ['read'] },
      },
      {
        key: '/discounts',
        icon: Percent,
        label: 'Diskon',
        permission: { resource: 'discounts', actions: ['read'] },
      },
      {
        key: '/payment-methods',
        icon: CreditCard,
        label: 'Metode Pembayaran',
        permission: { resource: 'paymentMethods', actions: ['read'] },
      },
    ],
  },
  {
    group: 'Inventory',
    items: [
      {
        key: '/stocks',
        icon: Package2,
        label: 'Stok',
        permission: { resource: 'tenants', actions: ['read', 'update'] },
      },
      {
        key: '/stock-adjustment',
        icon: ChartBar,
        label: 'Penyesuaian Stok',
        permission: { resource: 'order', actions: ['read'] },
      },
    ],
  },
  {
    group: 'Pengaturan',
    items: [
      {
        key: '/settings',
        icon: Settings,
        label: 'Pengaturan',
        permission: { resource: 'tenants', actions: ['read', 'update'] },
      },
      {
        key: '/orders',
        icon: History,
        label: 'Riwayat Transaksi',
        permission: { resource: 'order', actions: ['read'] },
      },
    ],
  },
];

function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasAnyPermission } = usePermissions();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Filter menu based on permissions
  const filteredMenuConfig = menuConfig
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        hasAnyPermission(item.permission.resource, item.permission.actions)
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <SidebarHeader>
        {state === 'expanded' ? (
          <div className="mx-auto py-2">
            <img src="/mitbiz-pos.png" className="w-32" alt="Mitbiz POS" />
          </div>
        ) : (
          <div className="flex justify-center py-2">
            <img src="/android-chrome-512x512.png" className="h-8 w-8" alt="Mitbiz POS" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {filteredMenuConfig.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    onClick={() => navigate({ to: item.key })}
                    isActive={
                      location.pathname === item.key || location.pathname.startsWith(item.key + '/')
                    }
                    className="cursor-pointer"
                  >
                    {item.icon && <item.icon className="h-2 w-2" />}
                    <span className="text-[14px]">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex flex-row gap-2 p-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-1 group-data-[collapsible=icon]:p-2">
          <div className="flex items-center gap-3 p-2 border border-[#D1D1D1] rounded-lg flex-1 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:flex-none">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold">{user?.name || 'User'}</span>
              <span className="truncate text-xs">{user?.roles?.name || ''}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 border border-[#D1D1D1] rounded-lg hover:bg-red-50 text-slate-600 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:p-0"
            title="Logout"
          >
            <LogOut className="h-5 w-5 text-red-600 group-data-[collapsible=icon]:h-4 group-data-[collapsible=icon]:w-4" />
          </button>
        </div>
      </SidebarFooter>
    </>
  );
}

export function AppLayout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="inset" collapsible="icon" className="h-dvh">
        <AppSidebar />
      </Sidebar>
      <SidebarInset className="p-4 h-dvh overflow-hidden">
        <main className="flex flex-1 flex-col gap-4 h-full overflow-hidden">
          <div className="relative w-full h-full overflow-y-auto md:scrollbar-hide">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
