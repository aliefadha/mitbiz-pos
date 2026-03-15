import { useQuery } from '@tanstack/react-query';
import { Edit2, Plus, Search, Settings, Trash2, Users } from 'lucide-react';
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
import { tenantsApi } from '@/lib/api/tenants';
import { usersApi } from '@/lib/api/users';

export function AllUsersPage() {
  // Ringkasan tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>('all');

  // Fetch users
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers(),
  });

  // Fetch tenants
  const { data: tenantsData } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantsApi.getAll(),
  });

  // Summary stats
  const stats = useMemo(() => {
    const totalUser = usersData?.users?.length || 0;
    const totalBisnis = tenantsData?.length || 0;
    return { totalUser, totalBisnis };
  }, [usersData, tenantsData]);

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

    if (selectedTenantFilter !== 'all') {
      users = users.filter((u) => u.tenantId === selectedTenantFilter);
    }

    return users;
  }, [usersData, searchQuery, selectedTenantFilter]);

  if (isLoadingUsers) {
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
          <p className="text-sm text-gray-500 mt-1">Kelola admin dan kasir di semua bisnis</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total User */}
            <Card className="py-5">
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Total User</span>
                  <Users className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                  <span className="text-3xl font-bold text-gray-900">{stats.totalUser}</span>
                </div>
                <span className="text-xs text-gray-400">Dari semua role</span>
              </CardContent>
            </Card>

            {/* Total Bisnis */}
            <Card className="py-5">
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Total Bisnis</span>
                  <Settings className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                  <span className="text-3xl font-bold text-gray-900">{stats.totalBisnis}</span>
                </div>
                <span className="text-xs text-gray-400">Tenant yang terdaftar</span>
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

                {/* Tenant/Bisnis Filter */}
                <Select value={selectedTenantFilter} onValueChange={setSelectedTenantFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Semua Bisnis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Bisnis</SelectItem>
                    {tenantsData?.map((tenant: { id: string; nama: string }) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.nama}
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
                      <TableHead className="text-gray-600 font-medium">Bisnis</TableHead>
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
                          <TableCell className="text-gray-600">
                            {user.tenant?.nama || '-'}
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
                    placeholder="Cari nama atau username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Tenant/Bisnis Filter */}
                <Select value={selectedTenantFilter} onValueChange={setSelectedTenantFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Semua Bisnis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Bisnis</SelectItem>
                    {tenantsData?.map((tenant: { id: string; nama: string }) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.nama}
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
                      <TableHead className="text-gray-600 font-medium">Bisnis</TableHead>
                      <TableHead className="text-gray-600 font-medium">Status</TableHead>
                      <TableHead className="text-gray-600 font-medium rounded-tr-lg rounded-br-lg text-center">
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">Belum ada user yang ditemukan</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-gray-50/50">
                          <TableCell className="font-medium text-gray-900">{user.name}</TableCell>
                          <TableCell className="text-gray-600">{user.email}</TableCell>
                          <TableCell className="text-gray-600">
                            {user.tenant?.nama || '-'}
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
      </Tabs>
    </div>
  );
}
