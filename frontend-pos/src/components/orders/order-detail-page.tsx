import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
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
import { type Order, type OrderItem, ordersApi } from '@/lib/api/orders';

interface OrderDetail extends Order {
  orderItems?: OrderItem[];
}

export function OrderDetailPage() {
  const { orderId } = useParams({ from: '/_protected/orders/$orderId' });

  const { data: orderData, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getById(orderId),
  });

  const order = orderData as OrderDetail | undefined;

  const formatRupiah = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `Rp ${new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)}`;
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}.${minutes}.${seconds}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-64" />
        <div className="flex gap-6 mt-6">
          <Skeleton className="h-[500px] flex-1" />
          <Skeleton className="h-[200px] w-[280px]" />
        </div>
      </div>
    );
  }

  if (!order) {
    return <div>Order not found</div>;
  }

  const subtotal = parseFloat(order.subtotal) || 0;
  const totalDiskon = parseFloat(order.jumlahDiskon) || 0;
  const totalPajak = parseFloat(order.jumlahPajak) || 0;
  const total = parseFloat(order.total) || 0;

  return (
    <div>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/orders">Riwayat Transaksi</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Detail Transaksi</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Main Content */}
      <div className="flex gap-6 mt-6 items-start">
        {/* Left Card - Transaction Details */}
        <div className="flex-1 rounded-lg border border-gray-200 bg-white p-6">
          {/* Kasir & Tanggal */}
          <div className="flex gap-16 mb-6">
            <div>
              <p className=" text-gray-500 mb-1">Kasir</p>
              <p className="font-semibold ">{order.cashier?.name || '-'}</p>
            </div>
            <div>
              <p className=" text-gray-500 mb-1">Tanggal & Waktu</p>
              <p className="font-semibold ">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className=" text-gray-500 mb-1">Nomor Antrian</p>
              <p className="font-semibold ">{order.nomorAntrian || '-'}</p>
            </div>
          </div>

          {/* Item Transaksi */}
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

          {/* Summary */}
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

        {/* Right Card - Invoice Info */}
        <div className="w-[280px] shrink-0 rounded-lg border border-gray-200 bg-white p-6 space-y-5">
          <div>
            <p className=" text-gray-500 mb-1">No. Invoice</p>
            <p className=" font-semibold">{order.orderNumber}</p>
          </div>
          <div>
            <p className=" text-gray-500 mb-1">Outlet</p>
            <p className=" font-semibold">{order.outlet?.nama || '-'}</p>
          </div>
          <div>
            <p className=" text-gray-500 mb-1">Metode Pembayaran</p>
            <p className=" font-semibold">{order.paymentMethod?.nama || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
