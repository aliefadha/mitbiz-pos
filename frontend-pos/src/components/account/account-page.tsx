import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTenant } from '@/contexts/tenant-context';
import { type Outlet, outletsApi } from '@/lib/api/outlets';
import { type Tenant, tenantsApi } from '@/lib/api/tenants';
import { type CreateUserDto, usersApi } from '@/lib/api/users';
import { useSession } from '@/lib/auth-client';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.string(),
  tenantId: z.string().optional(),
  outletId: z.string().optional(),
});

export function AccountPage() {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('cashier');
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'cashier',
      tenantId: undefined,
      outletId: undefined,
    },
  });
  const { data: session } = useSession();
  // @ts-expect-error - role is added by custom session client
  const userRole = (session?.user?.role as string) || 'cashier';
  const { selectedTenant: contextSelectedTenant, selectedOutlet: contextSelectedOutlet } =
    useTenant();

  const isOwner = userRole === 'owner';
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (createModalOpen && isOwner) {
      form.setValue('role', 'cashier');
      setSelectedRole('cashier');

      if (contextSelectedTenant) {
        const tenantId = contextSelectedTenant.id.toString();
        setSelectedTenant(tenantId);
        form.setValue('tenantId', tenantId);
      }

      if (contextSelectedOutlet) {
        form.setValue('outletId', contextSelectedOutlet.id.toString());
      }
    }
  }, [createModalOpen, isOwner, contextSelectedTenant, contextSelectedOutlet, form]);

  const effectiveTenantId = contextSelectedTenant?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['users', effectiveTenantId],
    queryFn: () => usersApi.getUsers({ tenantId: effectiveTenantId }),
    enabled: !isOwner && !!effectiveTenantId,
  });

  const { data: tenantsData } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantsApi.getAll({ isActive: true }),
  });

  const { data: outletsData } = useQuery({
    queryKey: ['outlets', selectedTenant],
    queryFn: () => outletsApi.getAll({ isActive: true, tenantId: selectedTenant || undefined }),
    enabled: !!selectedTenant,
  });

  const filteredUsersQuery = useQuery({
    queryKey: ['users', 'filtered', contextSelectedTenant?.id],
    queryFn: () => usersApi.getUsers({ tenantId: contextSelectedTenant?.id }),
    enabled: isOwner && !!contextSelectedTenant,
  });

  const displayedUsers = isOwner ? (filteredUsersQuery.data?.users ?? []) : (data?.users ?? []);

  const tenantsList =
    isOwner && contextSelectedTenant ? [contextSelectedTenant] : (tenantsData ?? []);
  const outlets = outletsData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (data: CreateUserDto) => usersApi.createUser(data),
    onSuccess: () => {
      setCreateModalOpen(false);
      form.reset();
      setSelectedTenant(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (isOwner) {
        queryClient.invalidateQueries({ queryKey: ['users', 'filtered'] });
      }
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to create user');
    },
  });

  const isOutletRequired = selectedRole === 'cashier' && (!isOwner || !contextSelectedOutlet);
  const outletId = form.watch('outletId');
  const isSubmitDisabled = (isOutletRequired && !outletId) || !effectiveTenantId;

  const getVerifiedColor = (verified: boolean) => {
    return verified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  };

  return (
    <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-lg font-semibold m-0">Akun</h4>
            <p className="text-sm text-gray-500 m-0">Kelola semua akun dalam sistem</p>
          </div>
          <div className="flex gap-2">
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Akun
              </Button>
            </DialogTrigger>
          </div>
        </div>

        {isLoading || (isOwner && filteredUsersQuery.isLoading) ? (
          <div className="p-6 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead className="w-[180px]">Dibuat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedUsers.map((user, index) => (
                <TableRow key={user.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserIcon className="h-4 w-4" />
                      </div>
                      {user.name}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getVerifiedColor(!!user.emailVerified)}`}
                    >
                      {user.emailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString('id-ID')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                createMutation.mutate({
                  ...values,
                  tenantId: values.tenantId
                    ? values.tenantId
                    : isOwner && effectiveTenantId
                      ? effectiveTenantId
                      : undefined,
                  outletId: values.outletId ? values.outletId : undefined,
                } as CreateUserDto);
              })}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama akun" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan email akun" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Masukkan password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isOwner && (
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(v);
                          setSelectedRole(v);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isAdmin && <SelectItem value="admin">Admin</SelectItem>}
                          {isAdmin && <SelectItem value="owner">Owner</SelectItem>}
                          <SelectItem value="cashier">Cashier</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {selectedRole === 'cashier' && (
                <>
                  {!isOwner && (
                    <FormField
                      control={form.control}
                      name="tenantId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tenant</FormLabel>
                          <Select
                            onValueChange={(v) => {
                              field.onChange(v);
                              setSelectedTenant(v);
                              form.setValue('outletId', undefined);
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select tenant" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {tenantsList.map((tenant: Tenant) => (
                                <SelectItem key={tenant.id} value={tenant.id.toString()}>
                                  {tenant.nama}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {(!isOwner || !contextSelectedOutlet) && (
                    <FormField
                      control={form.control}
                      name="outletId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Outlet</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!selectedTenant || outlets.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select outlet" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {outlets.map((outlet: Outlet) => (
                                <SelectItem key={outlet.id} value={outlet.id.toString()}>
                                  {outlet.nama}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending || isSubmitDisabled}>
                  Create
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </div>
    </Dialog>
  );
}
