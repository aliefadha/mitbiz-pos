import { useNavigate } from '@tanstack/react-router';
import { ChevronDown, ChevronRight, ChevronsUpDown, Plus } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth-context';
import { useTenant } from '@/contexts/tenant-context';
import { type Outlet, type Tenant } from '@/lib/api/tenants';
import { type Role } from '@/lib/rbac';

export function TenantSwitcher() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    selectedTenant,
    selectedOutlet,
    setSelectedTenant,
    setSelectedOutlet,
    tenants,
    isLoading: tenantsLoading,
  } = useTenant();

  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  return (
    <div className="flex items-center">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer border-[#D1D1D1] border rounded-lg"
                disabled={tenantsLoading}
              >
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {selectedTenant
                      ? selectedOutlet
                        ? `${selectedTenant.nama} - ${selectedOutlet.nama}`
                        : selectedTenant.nama
                      : 'Pilih Tenant'}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg p-2"
              align="end"
              side="bottom"
              sideOffset={4}
            >
              {!tenants || tenants.length === 0 ? (
                <DropdownMenuItem disabled className="justify-center text-muted-foreground">
                  No data
                </DropdownMenuItem>
              ) : (
                tenants.map((tenant: Tenant) => (
                  <div key={tenant.id} className="flex flex-col mb-0.5">
                    <div
                      className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenFolders((prev) => ({
                          ...prev,
                          [tenant.id]: !prev[tenant.id],
                        }));
                      }}
                    >
                      {openFolders[tenant.id] ? (
                        <ChevronDown className="mr-1 h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="mr-1 h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="font-medium truncate">{tenant.nama}</span>
                    </div>
                    {openFolders[tenant.id] && (
                      <div className="flex flex-col pl-7 mt-0.5 space-y-0.5">
                        {(user?.role as Role) === 'owner' && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setSelectedOutlet(null);
                            }}
                            className="cursor-pointer flex items-center px-1"
                          >
                            <span
                              className={`truncate ${!selectedOutlet && selectedTenant?.id === tenant.id ? 'font-semibold' : ''}`}
                            >
                              {!selectedOutlet && selectedTenant?.id === tenant.id && (
                                <div className="inline-block align-middle mr-2 h-2 w-2 rounded-full bg-current" />
                              )}
                              Semua Outlet
                            </span>
                          </DropdownMenuItem>
                        )}
                        {tenant.outlets?.map((outlet: Outlet) => (
                          <DropdownMenuItem
                            key={outlet.id}
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setSelectedOutlet(outlet);
                            }}
                            className="cursor-pointer flex items-center px-1"
                          >
                            <span
                              className={`truncate ${selectedOutlet?.id === outlet.id ? 'font-semibold' : ''}`}
                            >
                              {selectedOutlet?.id === outlet.id && (
                                <div className="inline-block align-middle mr-2 h-2 w-2 rounded-full bg-current" />
                              )}
                              {outlet.nama}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
              {(user?.role as Role) !== 'cashier' && (
                <>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    className="gap-2 p-2 cursor-pointer"
                    onClick={() => navigate({ to: '/tenants/new' })}
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border bg-background text-muted-foreground">
                      <Plus className="size-4" />
                    </div>
                    <div className="font-medium text-muted-foreground">Add tenant</div>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
}
