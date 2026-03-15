import { CheckCircle2, Edit2, Eye, Package, Plus, Search, Trash2 } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// --- Mock Data ---
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: 'bulanan' | 'tahunan';
  isActive: boolean;
  features: string[];
  usedByCount: number;
}

const mockPlans: SubscriptionPlan[] = [
  {
    id: '1',
    name: 'Paket Basic',
    description: 'Solusi sederhana untuk bisnis kecil yang baru memulai',
    price: 99000,
    duration: 'bulanan',
    isActive: true,
    features: ['Maks 1 Cabang', 'Maks 3 Kasir', 'Transaksi POS', 'Laporan Penjualan'],
    usedByCount: 12,
  },
  {
    id: '2',
    name: 'Paket Pro',
    description: 'Untuk bisnis yang memiliki beberapa cabang dan membutuhkan laporan lebih lengkap',
    price: 1999000,
    duration: 'tahunan',
    isActive: true,
    features: [
      'Maks 5 Cabang',
      'Maks 10 Kasir',
      'Laporan Lengkap',
      'Manajemen Stok',
      'Diskon & Pajak',
    ],
    usedByCount: 4,
  },
];

// --- Mock Active Subscribers ---
interface ActiveSubscriber {
  id: string;
  businessName: string;
  ownerName: string;
  planName: string;
  status: 'Aktif' | 'Nonaktif';
  expiredDate: string;
}

const mockSubscribers: ActiveSubscriber[] = [
  {
    id: '1',
    businessName: 'Cafe Kita',
    ownerName: 'Rina',
    planName: 'Pro',
    status: 'Aktif',
    expiredDate: '12 Aug',
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace('IDR', 'Rp')
    .trim();
}

export function SubscriptionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Filtered plans
  const filteredPlans = useMemo(() => {
    let plans = mockPlans;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      plans = plans.filter(
        (p) => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
      );
    }

    // Filter by duration
    if (selectedDuration !== 'all') {
      plans = plans.filter((p) => p.duration === selectedDuration);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      const isActive = selectedStatus === 'aktif';
      plans = plans.filter((p) => p.isActive === isActive);
    }

    return plans;
  }, [searchQuery, selectedDuration, selectedStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Manajemen Langganan – Semua Cabang
        </h1>
        <p className="text-sm text-gray-500 mt-1">Kelola paket langganan untuk semua cabang</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="paket-langganan">
        <TabsList>
          <TabsTrigger value="paket-langganan">Paket Langganan</TabsTrigger>
          <TabsTrigger value="pelanggan-aktif">Pelanggan Aktif</TabsTrigger>
          <TabsTrigger value="per-cabang">Per Cabang</TabsTrigger>
        </TabsList>

        <TabsContent value="paket-langganan" className="space-y-6 mt-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari paket..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Duration Filter */}
            <Select value={selectedDuration} onValueChange={setSelectedDuration}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Semua Durasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Durasi</SelectItem>
                <SelectItem value="bulanan">Bulanan</SelectItem>
                <SelectItem value="tahunan">Tahunan</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Semua" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="aktif">Aktif</SelectItem>
                <SelectItem value="nonaktif">Nonaktif</SelectItem>
              </SelectContent>
            </Select>

            {/* Add Plan Button */}
            <Button className="gap-2 whitespace-nowrap">
              <Plus className="h-4 w-4" />
              Tambah Paket
            </Button>
          </div>

          {/* Plan Cards Grid */}
          {filteredPlans.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium text-gray-500">Tidak ada paket ditemukan</p>
                <p className="text-sm">Coba ubah filter atau tambah paket baru</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pelanggan-aktif" className="mt-4">
          <Card className="py-5">
            <CardContent className="space-y-4">
              {/* Section Title */}
              <h2 className="text-base font-bold text-gray-900">Pelanggan Berlangganan</h2>

              {/* Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="[&_tr]:border-b-0">
                    <TableRow className="bg-gray-50 hover:bg-gray-50 border-b-0">
                      <TableHead className="text-gray-600 font-medium rounded-tl-lg rounded-bl-lg">
                        Bisnis
                      </TableHead>
                      <TableHead className="text-gray-600 font-medium">Owner</TableHead>
                      <TableHead className="text-gray-600 font-medium">Paket</TableHead>
                      <TableHead className="text-gray-600 font-medium">Status</TableHead>
                      <TableHead className="text-gray-600 font-medium">Expired</TableHead>
                      <TableHead className="text-gray-600 font-medium rounded-tr-lg rounded-br-lg text-center">
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockSubscribers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                          <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">Belum ada pelanggan berlangganan</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      mockSubscribers.map((subscriber) => (
                        <TableRow key={subscriber.id} className="hover:bg-gray-50/50">
                          <TableCell className="font-medium text-gray-900">
                            {subscriber.businessName}
                          </TableCell>
                          <TableCell className="text-gray-600">{subscriber.ownerName}</TableCell>
                          <TableCell className="text-gray-600">{subscriber.planName}</TableCell>
                          <TableCell className="text-gray-600">{subscriber.status}</TableCell>
                          <TableCell className="text-gray-600">{subscriber.expiredDate}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              <Button
                                variant="outline"
                                size="icon-sm"
                                className="text-gray-500 hover:text-gray-700 rounded-full"
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

        <TabsContent value="per-cabang" className="mt-4">
          <Card className="py-12">
            <CardContent className="text-center text-gray-400">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium text-gray-500">Per Cabang</p>
              <p className="text-sm">Fitur ini akan segera hadir</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Plan Card Component ---
function PlanCard({ plan }: { plan: SubscriptionPlan }) {
  return (
    <Card className="flex flex-col justify-between py-5">
      <CardContent className="flex flex-col gap-4">
        {/* Plan Header: Name + Status Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
          </div>
          {plan.isActive && (
            <Badge className="bg-blue-500 text-white hover:bg-blue-600 text-xs font-medium px-2.5 py-0.5 shrink-0">
              Aktif
            </Badge>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 leading-relaxed">{plan.description}</p>

        {/* Price */}
        <div>
          <span className="text-2xl font-bold text-blue-500">{formatCurrency(plan.price)}</span>
          <span className="text-sm text-gray-400 ml-1">
            /{plan.duration === 'bulanan' ? 'Bulan' : 'Tahun'}
          </span>
        </div>

        {/* Features */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Fitur:</p>
          <ul className="space-y-1.5">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle2 className="h-4.5 w-4.5 text-blue-500 shrink-0 fill-blue-500 stroke-white" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Used By */}
        <div>
          <p className="text-xs text-gray-400 italic mb-1.5">Digunakan oleh:</p>
          <Badge
            variant="outline"
            className="text-xs font-medium text-gray-600 border-gray-300 px-2.5 py-0.5 rounded-md"
          >
            {plan.usedByCount} Bisnis
          </Badge>
        </div>
      </CardContent>

      {/* Divider */}
      <div className="px-6">
        <div className="border-t border-gray-200 my-2" />
      </div>

      {/* Actions */}
      <div className="px-6 flex items-center gap-2">
        <Button variant="outline" className="flex-1 gap-2 text-gray-700">
          <Edit2 className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="text-red-500 hover:text-red-700 hover:bg-red-50 hover:border-red-200 shrink-0"
          title="Hapus paket"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
