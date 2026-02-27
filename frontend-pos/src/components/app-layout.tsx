import { Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../contexts/auth-context";
import { TenantSwitcher } from "./tenant-switcher";
import { useLogout } from "@/hooks/use-auth";
import { type Role } from "@/lib/rbac";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Settings,
  User,
  LogOut,
  Bell,
  Users,
  ChevronsUpDown,
  Folder,
  Package,
  Store,
  Receipt,
  ShoppingCart,
  CreditCard,
  Percent,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const menuConfig = [
  {
    group: "Dashboard",
    items: [
      {
        key: "/dashboard",
        icon: LayoutDashboard,
        label: "Dashboard",
        roles: ["admin", "owner", "cashier"],
      },
    ],
  },
  {
    group: "Transaksi",
    items: [
      {
        key: "/pos",
        icon: ShoppingCart,
        label: "Kasir",
        roles: ["cashier", "owner"],
      },
      {
        key: "/orders",
        icon: Receipt,
        label: "Pesanan",
        roles: ["cashier", "owner"],
      },
    ],
  },
  {
    group: "Master Data",
    items: [
      {
        key: "/tenants",
        icon: Users,
        label: "Tenant",
        roles: ["admin",],
      },
      {
        key: "/outlets",
        icon: Store,
        label: "Outlet",
        roles: ["owner"],
      },
      {
        key: "/account",
        icon: User,
        label: "Akun",
        roles: ["admin", "owner"],
      },
      {
        key: "/categories",
        icon: Folder,
        label: "Kategori",
        roles: ["cashier", "owner"],
      },
      {
        key: "/products",
        icon: Package,
        label: "Produk",
        roles: ["cashier", "owner"],
      },
      {
        key: "/taxes",
        icon: Receipt,
        label: "Pajak",
        roles: ["cashier", "owner"],
      },
      {
        key: "/discounts",
        icon: Percent,
        label: "Diskon",
        roles: ["cashier", "owner"],
      },
      {
        key: "/payment-methods",
        icon: CreditCard,
        label: "Metode Pembayaran",
        roles: ["cashier", "owner"],
      },
    ],
  },
];

function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const logoutMutation = useLogout();

  const filteredMenuConfig = menuConfig
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.roles.includes((user?.role as Role) || "cashier"),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <SidebarHeader>
        {state === "expanded" ? (
          <div className="mx-auto py-2">
            <img src="/mitbiz-pos.png" className="w-32" alt="Mitbiz POS" />
          </div>
        ) : (
          <div className="flex justify-center py-2">
            <img
              src="/android-chrome-512x512.png"
              className="h-8 w-8"
              alt="Mitbiz POS"
            />
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
                      location.pathname === item.key ||
                      location.pathname.startsWith(item.key + "/")
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
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.name || "User"}
                    </span>
                    <span className="truncate text-xs">
                      {user?.email || ""}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem className="cursor-pointer">
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate({ to: "/settings" as any })}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logoutMutation.mutate()}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}

export function AppLayout() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);
  const { user } = useAuth();

  const getBreadcrumbLabel = () => {
    if (pathnames.length === 0) return "Data Fetching";

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
                  <BreadcrumbPage>
                    {getBreadcrumbLabel()}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          {(user?.role as Role) !== "admin" && <TenantSwitcher />}
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 bg-slate-50/50">
          <div className="w-full h-full min-h-[calc(100vh-8rem)] rounded-xl border bg-white shadow-sm overflow-hidden p-6 text-slate-800">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
