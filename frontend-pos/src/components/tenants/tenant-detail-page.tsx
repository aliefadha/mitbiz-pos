import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Globe,
  Layers,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  Settings,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
import { ordersApi } from '@/lib/api/orders';
import { productsApi } from '@/lib/api/products';
import { type Outlet, type Tenant, tenantsApi } from '@/lib/api/tenants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(num)
    .replace('IDR', 'Rp')
    .trim();
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  iconBgColor: string;
}

function StatCard({ icon, label, value, subtext, iconBgColor }: StatCardProps) {
  return (
    <Card className="py-4 gap-0">
      <CardContent className="flex items-center gap-4">
        <div className={`flex items-center justify-center h-12 w-12 rounded-xl ${iconBgColor}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-400 mb-0.5">{label}</p>
          <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
          {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Outlets Tab ──────────────────────────────────────────────────────────────

function OutletsTab({ slug }: { slug: string }) {
  const { data: outletsData, isLoading } = useQuery({
    queryKey: ['tenant-outlets', slug],
    queryFn: () => tenantsApi.getOutlets(slug),
  });

  const outlets: Outlet[] = outletsData?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-3 pt-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (outlets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Building2 className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-sm font-medium">Belum ada outlet</p>
        <p className="text-xs mt-1">Outlet yang terdaftar akan muncul di sini</p>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Outlet</TableHead>
            <TableHead>Kode</TableHead>
            <TableHead>Alamat</TableHead>
            <TableHead>No. Telepon</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {outlets.map((outlet) => (
            <TableRow key={outlet.id}>
              <TableCell className="font-medium text-gray-900">{outlet.nama}</TableCell>
              <TableCell>
                <code className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">
                  {outlet.kode}
                </code>
              </TableCell>
              <TableCell className="text-gray-500">{outlet.alamat || '—'}</TableCell>
              <TableCell className="text-gray-500">{outlet.noHp || '—'}</TableCell>
              <TableCell>
                <Badge
                  className={
                    outlet.isActive
                      ? 'bg-green-100 text-green-700 hover:bg-green-100'
                      : 'bg-red-100 text-red-700 hover:bg-red-100'
                  }
                >
                  {outlet.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab({ tenant }: { tenant: Tenant }) {
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['tenant-users', tenant.slug],
    queryFn: () => tenantsApi.getUsers(tenant.slug),
  });

  const users = usersData?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-3 pt-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Users className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-sm font-medium">Belum ada pengguna</p>
        <p className="text-xs mt-1">Pengguna yang terdaftar akan muncul di sini</p>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Bergabung</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-900">{user.name || '—'}</span>
                </div>
              </TableCell>
              <TableCell className="text-gray-500">{user.email}</TableCell>
              <TableCell>
                <Badge
                  className={
                    user.role === 'owner'
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-100'
                      : user.role === 'admin'
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                  }
                >
                  {user.role || 'member'}
                </Badge>
              </TableCell>
              <TableCell className="text-gray-500">{formatDate(user.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────

function ProductsTab({ tenantId }: { tenantId: string }) {
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['tenant-products', tenantId],
    queryFn: () => productsApi.getAll({ tenantId, limit: 50 }),
  });

  const products = productsData?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-3 pt-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Package className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-sm font-medium">Belum ada produk</p>
        <p className="text-xs mt-1">Produk yang terdaftar akan muncul di sini</p>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Nama Produk</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead className="text-right">Harga Beli</TableHead>
            <TableHead className="text-right">Harga Jual</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <code className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">
                  {product.sku}
                </code>
              </TableCell>
              <TableCell className="font-medium text-gray-900">{product.nama}</TableCell>
              <TableCell className="text-gray-500">{product.category?.nama || '—'}</TableCell>
              <TableCell className="text-right text-gray-500">
                {product.hargaBeli ? formatCurrency(product.hargaBeli) : '—'}
              </TableCell>
              <TableCell className="text-right font-medium text-gray-900">
                {formatCurrency(product.hargaJual)}
              </TableCell>
              <TableCell className="text-gray-500">{product.unit}</TableCell>
              <TableCell>
                <Badge
                  className={
                    product.isActive
                      ? 'bg-green-100 text-green-700 hover:bg-green-100'
                      : 'bg-red-100 text-red-700 hover:bg-red-100'
                  }
                >
                  {product.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────

function OrdersTab({ tenantId }: { tenantId: string }) {
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['tenant-orders', tenantId],
    queryFn: () => ordersApi.getAll({ tenantId, limit: 50 }),
  });

  const orders = ordersData?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-3 pt-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <ShoppingCart className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-sm font-medium">Belum ada pesanan</p>
        <p className="text-xs mt-1">Pesanan yang masuk akan muncul di sini</p>
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; className: string }> = {
    complete: { label: 'Selesai', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
    cancel: { label: 'Dibatalkan', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
    refunded: { label: 'Refund', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  };

  return (
    <div className="pt-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Order</TableHead>
            <TableHead>Outlet</TableHead>
            <TableHead>Kasir</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Tanggal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.complete;
            return (
              <TableRow key={order.id}>
                <TableCell>
                  <code className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">
                    {order.orderNumber}
                  </code>
                </TableCell>
                <TableCell className="text-gray-500">{order.outlet?.nama || '—'}</TableCell>
                <TableCell className="text-gray-500">
                  {order.cashier?.name || order.cashier?.email || '—'}
                </TableCell>
                <TableCell>
                  <Badge className={status.className}>{status.label}</Badge>
                </TableCell>
                <TableCell className="text-right font-medium text-gray-900">
                  {formatCurrency(order.total)}
                </TableCell>
                <TableCell className="text-gray-500">{formatDateTime(order.createdAt)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({ tenant }: { tenant: Tenant }) {
  const settings = tenant.settings;

  const settingItems = [
    {
      icon: <Globe className="h-4 w-4 text-blue-500" />,
      label: 'Zona Waktu',
      value: settings?.timezone || 'Asia/Jakarta',
    },
    {
      icon: <span className="text-sm font-medium text-green-600">Rp</span>,
      label: 'Mata Uang',
      value: settings?.currency || 'IDR',
    },
    {
      icon: <TrendingUp className="h-4 w-4 text-amber-500" />,
      label: 'Tarif Pajak',
      value: settings?.taxRate !== undefined ? `${settings.taxRate}%` : '0%',
    },
    {
      icon: <Package className="h-4 w-4 text-purple-500" />,
      label: 'Footer Struk',
      value: settings?.receiptFooter || 'Terima kasih telah berbelanja',
    },
  ];

  return (
    <div className="pt-2">
      <Card className="py-4 gap-0">
        <CardContent className="divide-y divide-gray-100">
          {settingItems.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between py-3.5 ${idx === 0 ? 'pt-0' : ''} ${idx === settingItems.length - 1 ? 'pb-0' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gray-50">
                  {item.icon}
                </div>
                <span className="text-sm text-gray-500">{item.label}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{item.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ tenant }: { tenant: Tenant }) {
  const infoItems = [
    {
      icon: <MapPin className="h-4 w-4 text-gray-400" />,
      label: 'Alamat',
      value: tenant.alamat || 'Belum diatur',
    },
    {
      icon: <Phone className="h-4 w-4 text-gray-400" />,
      label: 'Telepon',
      value: tenant.noHp || 'Belum diatur',
    },
    {
      icon: <Mail className="h-4 w-4 text-gray-400" />,
      label: 'Email Pemilik',
      value: tenant.user?.email || '—',
    },
    {
      icon: <Globe className="h-4 w-4 text-gray-400" />,
      label: 'Slug',
      value: tenant.slug,
    },
    {
      icon: <Calendar className="h-4 w-4 text-gray-400" />,
      label: 'Terdaftar Sejak',
      value: formatDate(tenant.createdAt),
    },
  ];

  return (
    <div className="pt-2 space-y-5">
      {/* Info Detail */}
      <Card className="py-4 gap-0">
        <CardContent>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Informasi Tenant</h3>
          <div className="space-y-0 divide-y divide-gray-100">
            {infoItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gray-50 shrink-0">
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settings Summary */}
      <Card className="py-4 gap-0">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Pengaturan</h3>
            <Settings className="h-4 w-4 text-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Pajak</p>
              <p className="text-lg font-bold text-gray-900">
                {tenant.settings?.taxRate !== undefined ? `${tenant.settings.taxRate}%` : '0%'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Mata Uang</p>
              <p className="text-lg font-bold text-gray-900">
                {tenant.settings?.currency || 'IDR'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface TenantDetailPageProps {
  tenantId: string;
}

export function TenantDetailPage({ tenantId }: TenantDetailPageProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const {
    data: tenant,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['tenant-detail', tenantId],
    queryFn: () => tenantsApi.getById(tenantId),
  });

  const { data: summary } = useQuery({
    queryKey: ['tenant-summary', tenant?.slug],
    queryFn: () => tenantsApi.getSummary(tenant!.slug),
    enabled: !!tenant?.slug,
  });

  // ── Loading State ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  // ── Error / Not Found State ────────────────────────────────────────────────

  if (isError || !tenant) {
    return (
      <div className="space-y-6">
        <Button
          variant="link"
          onClick={() => navigate({ to: '/tenants' })}
          className="pl-0 text-gray-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Manajemen Cabang
        </Button>
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <Building2 className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">Tenant tidak ditemukan</p>
          <p className="text-sm mt-1">Data tenant yang Anda cari tidak tersedia</p>
        </div>
      </div>
    );
  }

  // ── Main Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Button
        variant="link"
        onClick={() => navigate({ to: '/tenants' })}
        className="pl-0 text-gray-500"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Manajemen Cabang
      </Button>

      {/* Tenant Header Card */}
      <Card className="py-5 gap-0">
        <CardContent>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-500 text-white text-xl font-bold shrink-0">
                {tenant.nama.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <h1 className="text-xl font-bold text-gray-900">{tenant.nama}</h1>
                  <Badge
                    className={
                      tenant.isActive
                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                        : 'bg-red-100 text-red-700 hover:bg-red-100'
                    }
                  >
                    {tenant.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                  {tenant.alamat && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      {tenant.alamat}
                    </span>
                  )}
                  {tenant.noHp && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      {tenant.noHp}
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-400 mt-2">
                  Terdaftar sejak {formatDate(tenant.createdAt)}
                </p>
              </div>
            </div>

            {/* Edit Button */}
            <Button variant="outline" size="sm" className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Building2 className="h-5 w-5 text-blue-600" />}
          iconBgColor="bg-blue-50"
          label="Total Outlet"
          value={summary?.outletsCount ?? 0}
        />
        <StatCard
          icon={<Layers className="h-5 w-5 text-violet-600" />}
          iconBgColor="bg-violet-50"
          label="Kategori"
          value={summary?.categoriesCount ?? 0}
        />
        <StatCard
          icon={<Package className="h-5 w-5 text-amber-600" />}
          iconBgColor="bg-amber-50"
          label="Produk"
          value={summary?.productsCount ?? 0}
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-green-600" />}
          iconBgColor="bg-green-50"
          label="Pemilik"
          value={summary?.user?.name || summary?.user?.email || '—'}
        />
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
    </div>
  );
}
