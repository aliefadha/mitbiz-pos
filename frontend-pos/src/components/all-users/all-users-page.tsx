import { useQuery } from '@tanstack/react-query';
import { Edit2, Eye, Plus, Search, Settings, Trash2, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { outletsApi } from '@/lib/api/outlets';
import { rolesApi } from '@/lib/api/roles';
import { usersApi } from '@/lib/api/users';
import { useSession } from '@/lib/auth-client';

// Role badge color mapping
function getRoleBadgeStyle(roleName: string) {
  const name = roleName.toLowerCase();
  if (name === 'admin') {
    return 'bg-blue-500 text-white hover:bg-blue-600';
  }
  if (name === 'kasir') {
    return 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50';
  }
  if (name === 'owner') {
    return 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50';
  }
  return 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-50';
}

// Placeholder customer type (ready to swap for real API type)
interface Customer {
  id: string;
  name: string;
  email: string;
  outletName: string;
  subscription: string;
  status: 'aktif' | 'nonaktif';
}

// Placeholder customer data (replace with real API data later)
const PLACEHOLDER_CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: 'Rudi Hartono',
    email: 'rudi.hartono@email.com',
    outletName: 'Cabang Jakarta Pusat',
    subscription: '1 Paket',
    status: 'aktif',
  },
  {
    id: '2',
    name: 'Rudi Hartono',
    email: 'rudi.hartono@email.com',
    outletName: 'Cabang Jakarta Pusat',
    subscription: '1 Paket',
    status: 'aktif',
  },
];

export function AllUsersPage() {
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId;

  // Ringkasan tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedOutletFilter, setSelectedOutletFilter] = useState<string>('all');

  // Daftar Pelanggan tab state
  const [pelangganSearchQuery, setPelangganSearchQuery] = useState('');
  const [pelangganOutletFilter, setPelangganOutletFilter] = useState<string>('all');
  const [pelangganStatusFilter, setPelangganStatusFilter] = useState<string>('aktif');

  // Fetch roles
  const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles', tenantId],
    queryFn: () => rolesApi.getAll({ tenantId, scope: tenantId ? 'tenant' : undefined }),
    enabled: !!tenantId,
  });

  // Fetch users
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', tenantId],
    queryFn: () => usersApi.getUsers({ tenantId }),
    enabled: !!tenantId,
  });

  // Fetch outlets
  const { data: outletsData } = useQuery({
    queryKey: ['outlets', tenantId],
    queryFn: () => outletsApi.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  // Summary stats
  const stats = useMemo(() => {
    if (!usersData?.users || !rolesData) {
      return { totalAdmin: 0, totalKasir: 0, totalUser: 0 };
    }
    const users = usersData.users;
    const totalAdmin = users.filter((u) => u.role?.name?.toLowerCase() === 'admin').length;
    const totalKasir = users.filter((u) => u.role?.name?.toLowerCase() === 'kasir').length;
    const totalUser = users.length;
    return { totalAdmin, totalKasir, totalUser };
  }, [usersData, rolesData]);

  // Filtered users (Ringkasan tab)
  const filteredUsers = useMemo(() => {
    if (!usersData?.users) return [];
    let users = usersData.users;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      users = users.filter(
        (u) => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
      );
    }

    if (selectedRoleFilter !== 'all') {
      users = users.filter((u) => u.role?.id === selectedRoleFilter);
    }

    if (selectedOutletFilter !== 'all') {
      users = users.filter((u) => u.outletId === selectedOutletFilter);
    }

    return users;
  }, [usersData, searchQuery, selectedRoleFilter, selectedOutletFilter]);

  // Filtered customers (Daftar Pelanggan tab)
  const filteredCustomers = useMemo(() => {
    let customers = PLACEHOLDER_CUSTOMERS;

    if (pelangganSearchQuery) {
      const query = pelangganSearchQuery.toLowerCase();
      customers = customers.filter(
        (c) => c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query)
      );
    }

    if (pelangganOutletFilter !== 'all') {
      customers = customers.filter((c) => c.outletName === pelangganOutletFilter);
    }

    if (pelangganStatusFilter !== 'all') {
      customers = customers.filter((c) => c.status === pelangganStatusFilter);
    }

    return customers;
  }, [pelangganSearchQuery, pelangganOutletFilter, pelangganStatusFilter]);

  if (isLoadingRoles || isLoadingUsers) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen User</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola admin dan kasir di semua cabang</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah User
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ringkasan">
        <TabsList>
          <TabsTrigger value="ringkasan">Ringkasan</TabsTrigger>
          <TabsTrigger value="daftar-pelanggan">Daftar Pelanggan</TabsTrigger>
        </TabsList>

        <TabsContent value="ringkasan" className="space-y-6 mt-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Admin */}
            <Card className="py-5">
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Total Admin</span>
                  <Settings className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                  <span className="text-3xl font-bold text-gray-900">{stats.totalAdmin}</span>
                </div>
                <span className="text-xs text-gray-400">Aktif di semua cabang</span>
              </CardContent>
            </Card>

            {/* Total Kasir */}
            <Card className="py-5">
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Total Kasir</span>
                  <Users className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                  <span className="text-3xl font-bold text-gray-900">{stats.totalKasir}</span>
                </div>
                <span className="text-xs text-gray-400">Aktif di semua cabang</span>
              </CardContent>
            </Card>

            {/* Total User */}
            <Card className="py-5">
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Total User</span>
                  <Settings className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                  <span className="text-3xl font-bold text-gray-900">{stats.totalUser}</span>
                </div>
                <span className="text-xs text-gray-400">Dari semua role</span>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="py-4">
            <CardContent className="space-y-4">
              {/* Filter Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari nama atau username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Role Filter */}
                <Select value={selectedRoleFilter} onValueChange={setSelectedRoleFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Semua role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua role</SelectItem>
                    {rolesData?.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Outlet/Cabang Filter */}
                <Select value={selectedOutletFilter} onValueChange={setSelectedOutletFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Semua cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua cabang</SelectItem>
                    {outletsData?.data?.map((outlet: { id: string; nama: string }) => (
                      <SelectItem key={outlet.id} value={outlet.id}>
                        {outlet.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="[&_tr]:border-b-0">
                    <TableRow className="bg-gray-50 hover:bg-gray-50 border-b-0">
                      <TableHead className="text-gray-600 font-medium rounded-tl-lg rounded-bl-lg">
                        Nama
                      </TableHead>
                      <TableHead className="text-gray-600 font-medium">Username</TableHead>
                      <TableHead className="text-gray-600 font-medium">Role</TableHead>
                      <TableHead className="text-gray-600 font-medium">Cabang</TableHead>
                      <TableHead className="text-gray-600 font-medium">Status</TableHead>
                      <TableHead className="text-gray-600 font-medium rounded-tr-lg rounded-br-lg text-center">
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">Belum ada user yang ditemukan</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-gray-50/50">
                          <TableCell className="font-medium text-gray-900">{user.name}</TableCell>
                          <TableCell className="text-gray-600">{user.email}</TableCell>
                          <TableCell>
                            {user.role ? (
                              <Badge
                                variant="outline"
                                className={`text-xs font-medium px-2.5 py-0.5 rounded-md ${getRoleBadgeStyle(
                                  user.role.name
                                )}`}
                              >
                                {user.role.name}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {user.outlet?.nama || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-transparent text-xs font-medium px-2.5 py-0.5">
                              Aktif
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="outline"
                                size="icon-sm"
                                className="text-gray-500 hover:text-gray-700"
                                title="Edit user"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon-sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                                title="Hapus user"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daftar Pelanggan Tab */}
        <TabsContent value="daftar-pelanggan" className="mt-4">
          <Card className="py-4">
            <CardContent className="space-y-4">
              {/* Filter Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari nama, email atau telepon..."
                    value={pelangganSearchQuery}
                    onChange={(e) => setPelangganSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Cabang Filter */}
                <Select value={pelangganOutletFilter} onValueChange={setPelangganOutletFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Semua Cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Cabang</SelectItem>
                    {outletsData?.data?.map((outlet: { id: string; nama: string }) => (
                      <SelectItem key={outlet.id} value={outlet.nama}>
                        {outlet.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={pelangganStatusFilter} onValueChange={setPelangganStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Aktif" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aktif">Aktif</SelectItem>
                    <SelectItem value="nonaktif">Nonaktif</SelectItem>
                    <SelectItem value="all">Semua</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Customers Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="[&_tr]:border-b-0">
                    <TableRow className="bg-gray-50 hover:bg-gray-50 border-b-0">
                      <TableHead className="text-gray-600 font-medium rounded-tl-lg rounded-bl-lg">
                        Nama
                      </TableHead>
                      <TableHead className="text-gray-600 font-medium">Kontak</TableHead>
                      <TableHead className="text-gray-600 font-medium">Cabang</TableHead>
                      <TableHead className="text-gray-600 font-medium">Langganan</TableHead>
                      <TableHead className="text-gray-600 font-medium">Status</TableHead>
                      <TableHead className="text-gray-600 font-medium rounded-tr-lg rounded-br-lg text-center">
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">Belum ada pelanggan yang ditemukan</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <TableRow key={customer.id} className="hover:bg-gray-50/50">
                          <TableCell className="font-medium text-gray-900">
                            {customer.name}
                          </TableCell>
                          <TableCell className="text-gray-600">{customer.email}</TableCell>
                          <TableCell className="text-gray-600">{customer.outletName}</TableCell>
                          <TableCell className="text-gray-600">{customer.subscription}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                customer.status === 'aktif'
                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-transparent text-xs font-medium px-2.5 py-0.5'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-100 border-transparent text-xs font-medium px-2.5 py-0.5'
                              }
                            >
                              {customer.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              <Button
                                variant="outline"
                                size="icon-sm"
                                className="text-gray-500 hover:text-gray-700"
                                title="Lihat detail"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
