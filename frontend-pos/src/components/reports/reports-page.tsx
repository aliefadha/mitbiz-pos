import { DollarSign, Percent, Receipt, TrendingUp, Upload } from 'lucide-react';
import { useState } from 'react';
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

// --- Mock Data ---
interface TopProduct {
  rank: number;
  name: string;
  quantity: number;
  totalRevenue: number;
}

const mockTopProducts: TopProduct[] = [
  { rank: 1, name: 'Nasi Goreng', quantity: 288, totalRevenue: 7098471 },
  { rank: 2, name: 'Mie Goreng', quantity: 274, totalRevenue: 5395052 },
  { rank: 3, name: 'Coklat Batang', quantity: 288, totalRevenue: 7098471 },
  { rank: 4, name: 'Keripik Kentang', quantity: 288, totalRevenue: 7098471 },
  { rank: 5, name: 'Buku Tulis', quantity: 288, totalRevenue: 7098471 },
  { rank: 6, name: 'Es Jeruk', quantity: 288, totalRevenue: 7098471 },
  { rank: 7, name: 'Es Teh Manis', quantity: 288, totalRevenue: 7098471 },
  { rank: 8, name: 'Pulpen Biru', quantity: 288, totalRevenue: 7098471 },
  { rank: 9, name: 'Nasi Goreng', quantity: 288, totalRevenue: 7098471 },
  { rank: 10, name: 'Nasi Goreng', quantity: 288, totalRevenue: 7098471 },
];

const mockSummary = {
  totalPendapatan: 86613715,
  totalTransaksi: 1138,
  rataRataTransaksi: 76110,
  totalDiskon: 2727969,
};

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

export function ReportsPage() {
  const [reportType, setReportType] = useState<string>('penjualan');
  const [branch, setBranch] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Filter Laporan */}
      <Card className="py-5">
        <CardContent className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Filter Laporan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Jenis Laporan */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">Jenis Laporan</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih jenis laporan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="penjualan">Laporan Penjualan</SelectItem>
                  <SelectItem value="produk">Laporan Produk</SelectItem>
                  <SelectItem value="stok">Laporan Stok</SelectItem>
                  <SelectItem value="kasir">Laporan Kasir</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cabang */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">Cabang</label>
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih cabang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Cabang</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tanggal Mulai */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">Tanggal Mulai</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="dd/mm/yyyy"
              />
            </div>

            {/* Tanggal Akhir */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">Tanggal Akhir</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="dd/mm/yyyy"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pendapatan */}
        <Card className="py-5">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Total Pendapatan</span>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(mockSummary.totalPendapatan)}
              </span>
            </div>
            <span className="text-xs text-gray-400">Pendapatan kotor</span>
          </CardContent>
        </Card>

        {/* Total Transaksi */}
        <Card className="py-5">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Total Transaksi</span>
              <Receipt className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <span className="text-2xl font-bold text-gray-900">
                {formatNumber(mockSummary.totalTransaksi)}
              </span>
            </div>
            <span className="text-xs text-gray-400">Jumlah transaksi</span>
          </CardContent>
        </Card>

        {/* Rata-rata Transaksi */}
        <Card className="py-5">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Rata-rata Transaksi</span>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(mockSummary.rataRataTransaksi)}
              </span>
            </div>
            <span className="text-xs text-gray-400">Per transaksi</span>
          </CardContent>
        </Card>

        {/* Total Diskon */}
        <Card className="py-5">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Total Diskon</span>
              <Percent className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(mockSummary.totalDiskon)}
              </span>
            </div>
            <span className="text-xs text-gray-400">Diskon diberikan</span>
          </CardContent>
        </Card>
      </div>

      {/* 10 Produk Terlaris */}
      <Card className="py-5">
        <CardContent className="space-y-4">
          <h2 className="text-base font-bold text-gray-900">10 Produk Terlaris</h2>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="[&_tr]:border-b-0">
                <TableRow className="bg-gray-50 hover:bg-gray-50 border-b-0">
                  <TableHead className="text-gray-600 font-medium rounded-tl-lg rounded-bl-lg">
                    Peringkat
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">Produk</TableHead>
                  <TableHead className="text-gray-600 font-medium">Jumlah Produk</TableHead>
                  <TableHead className="text-gray-600 font-medium rounded-tr-lg rounded-br-lg">
                    Total Pendapatan
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTopProducts.map((product) => (
                  <TableRow key={product.rank} className="hover:bg-gray-50/50">
                    <TableCell className="text-gray-600">{product.rank}</TableCell>
                    <TableCell className="font-medium text-gray-900">{product.name}</TableCell>
                    <TableCell className="text-gray-600">
                      {formatNumber(product.quantity)}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {formatCurrency(product.totalRevenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
