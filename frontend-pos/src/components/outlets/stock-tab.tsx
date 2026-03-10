import { ArrowRightLeft, Edit2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePermissions } from '@/hooks/use-auth';
import type { ProductStockRow } from './hooks/use-outlet-detail-page';

interface StockTabProps {
  rows: ProductStockRow[];
  isLoading: boolean;
  searchText: string;
  onSearchChange: (value: string) => void;
  totalWithStock: number;
  totalProducts: number;
  onAddStock: (productId: string) => void;
  onEditStock: (row: ProductStockRow) => void;
  onDeleteStock: (stockId: string) => void;
  onAdjustStock: (row: ProductStockRow) => void;
}

export function StockTab({
  rows,
  isLoading,
  searchText,
  onSearchChange,
  totalWithStock,
  totalProducts,
  onAddStock,
  onEditStock,
  onDeleteStock,
  onAdjustStock,
}: StockTabProps) {
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission('stocks', 'create');
  const canUpdate = hasPermission('stocks', 'update');
  const canDelete = hasPermission('stocks', 'delete');
  const canAdjust = hasPermission('stockAdjustments', 'create');

  const hasActions = canUpdate || canDelete || canAdjust;

  return (
    <>
      <div className="mb-4 text-sm text-gray-500">
        {totalWithStock} dari {totalProducts} produk memiliki stock di outlet ini
      </div>
      <div className="mb-4">
        <Input
          placeholder="Cari produk..."
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-[300px]"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">No.</TableHead>
              <TableHead className="w-[120px]">SKU</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead className="w-[140px]">Harga Jual</TableHead>
              <TableHead className="w-[150px]">Stock</TableHead>
              <TableHead className="w-[180px]">Terakhir Diperbarui</TableHead>
              {hasActions && <TableHead className="w-[140px]">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.product.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">{row.product.sku}</code>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{row.product.nama}</div>
                  {row.product.category && (
                    <div className="text-xs text-gray-500">{row.product.category.nama}</div>
                  )}
                </TableCell>
                <TableCell>
                  {Number(row.product.hargaJual).toLocaleString('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  })}
                </TableCell>
                <TableCell>
                  {!row.stock ? (
                    canCreate ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAddStock(row.product.id)}
                      >
                        <Plus className="mr-1 h-3 w-3" /> Tambah
                      </Button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )
                  ) : (
                    <span
                      className={
                        row.stock.quantity > 0
                          ? 'text-green-600 font-medium'
                          : 'text-red-600 font-medium'
                      }
                    >
                      {row.stock.quantity}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-gray-500">
                  {row.stock?.updatedAt
                    ? new Date(row.stock.updatedAt).toLocaleString('id-ID')
                    : '-'}
                </TableCell>
                {hasActions && (
                  <TableCell>
                    {!row.stock ? null : (
                      <div className="flex gap-1">
                        {canAdjust && (
                          <Button variant="ghost" size="icon" onClick={() => onAdjustStock(row)}>
                            <ArrowRightLeft className="h-4 w-4" />
                          </Button>
                        )}
                        {canUpdate && (
                          <Button variant="ghost" size="icon" onClick={() => onEditStock(row)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteStock(row.stock!.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
