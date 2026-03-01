import { Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import {
  CreditCard,
  FileText,
  Folder,
  LayoutDashboard,
  LogOut,
  Package,
  Percent,
  Receipt,
  ShoppingCart,
  Store,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
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
import { useAuth } from '../contexts/auth-context';
import { TenantSwitcher } from './tenant-switcher';

interface MenuItem {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  permission: { resource: string; action: string };
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
        permission: { resource: 'dashboard', action: 'read' },
      },
      {
        key: '/laporan',
        icon: FileText,
        label: 'Laporan',
        permission: { resource: 'report', action: 'read' },
      },
    ],
  },
  {
    group: 'Transaksi',
    items: [
      {
        key: '/pos',
        icon: ShoppingCart,
        label: 'Kasir',
        permission: { resource: 'orders', action: 'create' },
      },
      {
        key: '/orders',
        icon: Receipt,
        label: 'Pesanan',
        permission: { resource: 'orders', action: 'read' },
      },
      {
        key: '/cash-shifts',
        icon: Wallet,
        label: 'Shift Kasir',
        permission: { resource: 'cashShifts', action: 'read' },
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
        permission: { resource: 'tenants', action: 'read' },
      },
      {
        key: '/outlets',
        icon: Store,
        label: 'Outlet',
        permission: { resource: 'outlets', action: 'read' },
      },
      {
        key: '/account',
        icon: User,
        label: 'Akun',
        permission: { resource: 'users', action: 'read' },
      },
      {
        key: '/categories',
        icon: Folder,
        label: 'Kategori',
        permission: { resource: 'categories', action: 'read' },
      },
      {
        key: '/products',
        icon: Package,
        label: 'Produk',
        permission: { resource: 'products', action: 'read' },
      },
      {
        key: '/taxes',
        icon: Receipt,
        label: 'Pajak',
        permission: { resource: 'taxes', action: 'read' },
      },
      {
        key: '/discounts',
        icon: Percent,
        label: 'Diskon',
        permission: { resource: 'discounts', action: 'read' },
      },
      {
        key: '/payment-methods',
        icon: CreditCard,
        label: 'Metode Pembayaran',
        permission: { resource: 'paymentMethods', action: 'read' },
      },
    ],
  },
];

function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Filter menu based on permissions
  const filteredMenuConfig = menuConfig
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        hasPermission(item.permission.resource, item.permission.action)
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
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span>{item.label}</span>
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
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  const { role } = useAuth();

  const getBreadcrumbLabel = () => {
    if (pathnames.length === 0) return 'Data Fetching';

    const firstSegment = pathnames[0];
    return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="inset" collapsible="icon">
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b bg-white pr-4 rounded-t-xl">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{getBreadcrumbLabel()}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          {role !== 'admin' && <TenantSwitcher />}
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 bg-slate-50/50">
          <div className="relative w-full h-full min-h-[calc(100vh-8rem)] rounded-xl border bg-white shadow-sm overflow-hidden p-6 text-slate-800">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
