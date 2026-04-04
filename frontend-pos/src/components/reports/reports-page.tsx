import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CheckCircle, CreditCard, RefreshCw, Upload, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
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
import {
  type SubscriptionHistory,
  type SubscriptionHistoryAction,
  subscriptionPlansApi,
} from '@/lib/api/subscriptions';
import { tenantsApi } from '@/lib/api/tenants';
import { useSessionWithCache } from '@/lib/session-cache';

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

function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

function formatDate(dateString: string): string {
  return format(new Date(dateString), 'dd MMM yyyy', { locale: id });
}

function formatActionLabel(action: SubscriptionHistoryAction): string {
  const labels: Record<SubscriptionHistoryAction, string> = {
    subscribed: 'Berlangganan',
    renewed: 'Diperpanjang',
    changed: 'Diubah',
    cancelled: 'Dibatalkan',
  };
  return labels[action] || action;
}

function formatBillingCycleLabel(cycle: string | undefined): string {
  if (!cycle) return '-';
  const labels: Record<string, string> = {
    monthly: 'Bulanan',
    quarterly: '3 Bulanan',
    semi_annual: '6 Bulanan',
    yearly: 'Tahunan',
  };
  return labels[cycle] || cycle;
}

function formatActionBadgeColor(action: SubscriptionHistoryAction): string {
  const colors: Record<SubscriptionHistoryAction, string> = {
    subscribed: 'bg-green-100 text-green-700',
    renewed: 'bg-blue-100 text-blue-700',
    changed: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return colors[action] || 'bg-gray-100 text-gray-700';
}

export function ReportsPage() {
  const { data: session } = useSessionWithCache();
  const tenantId = session?.user?.tenantId;

  const { data: tenantData } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => tenantsApi.getById(tenantId!),
    enabled: !!tenantId,
  });

  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [subscriptionAction, setSubscriptionAction] = useState<string>('all');

  const { data: allTenantsData } = useQuery({
    queryKey: ['tenants', 'all'],
    queryFn: () => tenantsApi.getAll(),
  });

  const allTenants = allTenantsData ?? [];

  const selectedTenantSlug =
    selectedTenant === 'all'
      ? tenantData?.slug
      : allTenants.find((t) => t.id === selectedTenant)?.slug;

  const { data: subscriptionHistoryData, isLoading: subscriptionHistoryLoading } = useQuery({
    queryKey: ['subscription-history', selectedTenant, selectedTenantSlug, subscriptionAction],
    queryFn: () => {
      if (selectedTenant === 'all') {
        return subscriptionPlansApi.getAllHistory({
          action:
            subscriptionAction === 'all'
              ? undefined
              : (subscriptionAction as SubscriptionHistoryAction),
          limit: 50,
        });
      }
      return subscriptionPlansApi.getTenantHistory(selectedTenantSlug!, {
        action:
          subscriptionAction === 'all'
            ? undefined
            : (subscriptionAction as SubscriptionHistoryAction),
        limit: 50,
      });
    },
    enabled: selectedTenant === 'all' ? true : !!selectedTenantSlug,
  });

  const subscriptionHistory: SubscriptionHistory[] = subscriptionHistoryData?.data ?? [];

  const subscriptionMetrics = useMemo(() => {
    const history = subscriptionHistory;
    const totalRevenue = history.reduce((sum, h) => sum + (Number(h.amountPaid) || 0), 0);
    const subscribed = history.filter((h) => h.action === 'subscribed').length;
    const renewed = history.filter((h) => h.action === 'renewed').length;
    const cancelled = history.filter((h) => h.action === 'cancelled').length;

    return {
      totalRevenue,
      subscribed,
      renewed,
      cancelled,
    };
  }, [subscriptionHistory]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Laporan Komprehensif</h1>
          <p className="text-sm text-gray-500 mt-1">Generate dan analisis laporan bisnis</p>
        </div>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Export Laporan
        </Button>
      </div>

      <Card className="py-5">
        <CardContent className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Filter Laporan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">Aksi Langganan</label>
              <Select value={subscriptionAction} onValueChange={setSubscriptionAction}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua Aksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Aksi</SelectItem>
                  <SelectItem value="subscribed">Berlangganan</SelectItem>
                  <SelectItem value="renewed">Diperpanjang</SelectItem>
                  <SelectItem value="changed">Diubah</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">Tenant</label>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Tenant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tenant</SelectItem>
                  {allTenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">Tanggal</label>
              <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="py-5">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Total Pendapatan</span>
              <CreditCard className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(subscriptionMetrics.totalRevenue)}
              </span>
            </div>
            <span className="text-xs text-gray-400">Pendapatan langganan</span>
          </CardContent>
        </Card>

        <Card className="py-5">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Total Berlangganan</span>
              <CheckCircle className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <span className="text-2xl font-bold text-gray-900">
                {formatNumber(subscriptionMetrics.subscribed)}
              </span>
            </div>
            <span className="text-xs text-gray-400">Langganan baru</span>
          </CardContent>
        </Card>

        <Card className="py-5">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Total Perpanjangan</span>
              <RefreshCw className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <span className="text-2xl font-bold text-gray-900">
                {formatNumber(subscriptionMetrics.renewed)}
              </span>
            </div>
            <span className="text-xs text-gray-400">Perpanjangan langganan</span>
          </CardContent>
        </Card>

        <Card className="py-5">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Total Pembatalan</span>
              <XCircle className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <span className="text-2xl font-bold text-gray-900">
                {formatNumber(subscriptionMetrics.cancelled)}
              </span>
            </div>
            <span className="text-xs text-gray-400">Pembatalan langganan</span>
          </CardContent>
        </Card>
      </div>

      <Card className="py-5">
        <CardContent className="space-y-4">
          <h2 className="text-base font-bold text-gray-900">Riwayat Langganan</h2>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="[&_tr]:border-b-0">
                <TableRow className="bg-gray-50 hover:bg-gray-50 border-b-0">
                  <TableHead className="text-gray-600 font-medium rounded-tl-lg rounded-bl-lg">
                    Tanggal
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">Aksi</TableHead>
                  <TableHead className="text-gray-600 font-medium">Paket</TableHead>
                  <TableHead className="text-gray-600 font-medium">Billing Cycle</TableHead>
                  <TableHead className="text-gray-600 font-medium">Jumlah</TableHead>
                  <TableHead className="text-gray-600 font-medium">Periode</TableHead>
                  <TableHead className="text-gray-600 font-medium rounded-tr-lg rounded-br-lg">
                    Invoice
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptionHistoryLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Memuat...
                    </TableCell>
                  </TableRow>
                ) : subscriptionHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  subscriptionHistory.map((history) => (
                    <TableRow key={history.id} className="hover:bg-gray-50/50">
                      <TableCell className="text-gray-600">
                        {formatDate(history.createdAt)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formatActionBadgeColor(history.action)}`}
                        >
                          {formatActionLabel(history.action)}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {history.planName}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatBillingCycleLabel(history.billingCycle)}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {history.amountPaid ? formatCurrency(Number(history.amountPaid)) : '-'}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(history.periodStart)} - {formatDate(history.periodEnd)}
                      </TableCell>
                      <TableCell className="text-gray-600">{history.invoiceRef || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
