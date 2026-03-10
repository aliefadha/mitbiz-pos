import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { StockAdjustment } from '@/lib/api/stock-adjustments';

interface AdjustmentsTabProps {
  adjustments: StockAdjustment[];
}

export function AdjustmentsTab({ adjustments }: AdjustmentsTabProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[60px]">No.</TableHead>
          <TableHead className="w-[180px]">Tanggal</TableHead>
          <TableHead>Produk</TableHead>
          <TableHead className="w-[120px]">Quantity</TableHead>
          <TableHead>Alasan</TableHead>
          <TableHead className="w-[160px]">Oleh</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {adjustments.map((adj, index) => (
          <TableRow key={adj.id}>
            <TableCell>{index + 1}</TableCell>
            <TableCell className="text-gray-500">
              {new Date(adj.createdAt).toLocaleString('id-ID')}
            </TableCell>
            <TableCell>
              <div className="font-medium">{adj.product?.nama || `Product #${adj.productId}`}</div>
              <div className="text-xs text-gray-500">{adj.product?.sku}</div>
            </TableCell>
            <TableCell>
              <span
                className={
                  adj.quantity > 0 ? 'text-green-600' : adj.quantity < 0 ? 'text-red-600' : ''
                }
              >
                {adj.quantity > 0 ? `+${adj.quantity}` : adj.quantity}
              </span>
            </TableCell>
            <TableCell className="text-gray-500">{adj.alasan || '-'}</TableCell>
            <TableCell className="text-gray-500">
              {adj.user?.name || adj.user?.email || adj.adjustedBy || '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
