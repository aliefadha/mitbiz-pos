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
import { Separator } from '@/components/ui/separator';
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
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useLogout, usePermissions } from '@/hooks/use-auth';
import type { UserScope } from '@/lib/permissions';
import { useAuth } from '../contexts/auth-context';

interface MenuItem {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  permissions: { resource: string; actions: string[] }[];
  scope?: UserScope;
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
        permissions: [{ resource: 'dashboard', actions: ['read'] }],
      },
      {
        key: '/laporan',
        icon: FileText,
        label: 'Laporan',
        permissions: [{ resource: 'report', actions: ['read'] }],
      },
      {
        key: '/cash-shifts',
        icon: Clock4,
        label: 'Shift Kasir',
        permissions: [{ resource: 'cashShifts', actions: ['read'] }],
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
        permissions: [{ resource: 'tenants', actions: ['read'] }],
        scope: 'global',
      },
      {
        key: '/outlets',
        icon: Store,
        label: 'Outlet',
        permissions: [{ resource: 'outlets', actions: ['read'] }],
      },
      {
        key: '/users',
        icon: Users,
        label: 'Pengguna',
        permissions: [{ resource: 'users', actions: ['read', 'create', 'list'] }],
      },
      {
        key: '/categories',
        icon: Folder,
        label: 'Kategori',
        permissions: [{ resource: 'categories', actions: ['read'] }],
      },
      {
        key: '/products',
        icon: Package,
        label: 'Produk',
        permissions: [{ resource: 'products', actions: ['read'] }],
      },
      {
        key: '/discounts',
        icon: Percent,
        label: 'Diskon',
        permissions: [{ resource: 'discounts', actions: ['read'] }],
      },
      {
        key: '/payment-methods',
        icon: CreditCard,
        label: 'Metode Pembayaran',
        permissions: [{ resource: 'paymentMethods', actions: ['read'] }],
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
        permissions: [
          { resource: 'stocks', actions: ['read'] },
          { resource: 'products', actions: ['read'] },
        ],
      },
      {
        key: '/stock-adjustment',
        icon: ChartBar,
        label: 'Penyesuaian Stok',
        permissions: [
          { resource: 'stockAdjustments', actions: ['read'] },
          { resource: 'products', actions: ['read'] },
        ],
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
        permissions: [{ resource: 'settings', actions: ['read'] }],
      },
      {
        key: '/orders',
        icon: History,
        label: 'Riwayat Transaksi',
        permissions: [{ resource: 'orders', actions: ['read'] }],
      },
    ],
  },
];

function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasAllPermissions } = usePermissions();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Filter menu based on permissions and scope
  const userScope = user?.roles?.scope;
  const filteredMenuConfig = menuConfig
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        // Check all permissions (all must pass)
        const hasAllPerms = hasAllPermissions(item.permissions);
        if (!hasAllPerms) return false;

        // Check scope requirement
        if (item.scope && item.scope !== userScope) {
          return false;
        }

        return true;
      }),
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
            <SidebarMenu className="group-data-[collapsible=icon]:items-center px-2 sm:px-0">
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
                    {item.icon && <item.icon className="h-4 w-4" />}
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
              <span className="truncate text-xs">{user?.email || ''}</span>
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
      <SidebarInset className="h-dvh overflow-y-auto">
        <header className="flex h-12 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 h-full">
          <div className="relative w-full h-full p-4">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
