import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Order } from '@/lib/api/orders';

interface OrderItemsTableProps {
  order: Order;
}

const formatRupiah = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `Rp ${new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)}`;
};

export function OrderItemsTable({ order }: OrderItemsTableProps) {
  const subtotal = parseFloat(order.subtotal) || 0;
  const totalDiskon = parseFloat(order.jumlahDiskon) || 0;
  const totalPajak = parseFloat(order.jumlahPajak) || 0;
  const total = parseFloat(order.total) || 0;

  return (
    <div className="flex-1 rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex gap-16 mb-6">
        <div>
          <p className=" text-gray-500 mb-1">Kasir</p>
          <p className="font-semibold ">{order.cashier?.name || '-'}</p>
        </div>
        <div>
          <p className=" text-gray-500 mb-1">Tanggal & Waktu</p>
          <p className="font-semibold ">{new Date(order.createdAt).toLocaleString('id-ID')}</p>
        </div>
        <div>
          <p className=" text-gray-500 mb-1">Nomor Antrian</p>
          <p className="font-semibold ">{order.nomorAntrian || '-'}</p>
        </div>
      </div>

      <div className="mb-6">
        <p className=" font-medium mb-3">Item Transaksi</p>
        <div className="overflow-hidden rounded-t-lg">
          <Table>
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-0">
                <TableHead className="text-sm text-gray-800 font-medium rounded-tl-lg rounded-bl-lg">
                  Produk
                </TableHead>
                <TableHead className="text-sm text-gray-800 font-medium">Qty</TableHead>
                <TableHead className="text-sm text-gray-800 font-medium">Harga</TableHead>
                <TableHead className="text-sm text-gray-800 font-medium">Diskon</TableHead>
                <TableHead className="text-sm text-gray-800 font-medium rounded-tr-lg rounded-br-lg">
                  Subtotal
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.orderItems && order.orderItems.length > 0 ? (
                order.orderItems.map((item) => {
                  const itemDiskon = parseFloat(item.jumlahDiskon) || 0;
                  return (
                    <TableRow key={item.id} className="border-b last:border-0 hover:bg-white">
                      <TableCell className=" py-3">{item.product?.nama || 'Product'}</TableCell>
                      <TableCell className=" py-3">{item.quantity}</TableCell>
                      <TableCell className=" py-3">{formatRupiah(item.hargaSatuan)}</TableCell>
                      <TableCell className=" py-3">{formatRupiah(itemDiskon)}</TableCell>
                      <TableCell className=" py-3">{formatRupiah(item.total)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-4">
                    Tidak ada item
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-3">
        <Separator />
        <div className="flex justify-between items-center pt-1">
          <span className=" text-gray-700">Subtotal:</span>
          <span className="">{formatRupiah(subtotal)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className=" text-red-500 font-medium">Diskon :</span>
          <span className=" text-red-500 font-medium">-{formatRupiah(totalDiskon)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className=" text-gray-700">Pajak :</span>
          <span className="">{formatRupiah(totalPajak)}</span>
        </div>
        <Separator className="my-1" />
        <div className="flex justify-between items-center pt-2">
          <span className="text-base font-bold">Total:</span>
          <span className="text-base font-bold">{formatRupiah(total)}</span>
        </div>
      </div>
    </div>
  );
}
