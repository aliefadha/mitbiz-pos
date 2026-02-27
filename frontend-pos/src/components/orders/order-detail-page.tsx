import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-700';
      case 'cancel':
        return 'bg-red-100 text-red-700';
      case 'refunded':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'complete':
        return 'Selesai';
      case 'cancel':
        return 'Dibatalkan';
      case 'refunded':
        return 'Dikembalikan';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!order) {
    return <div>Order not found</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h4 className="text-lg font-semibold m-0">Detail Pesanan</h4>
          <p className="text-sm text-gray-500 m-0">Lihat detail pesanan</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <h5 className="font-semibold mb-4">Informasi Pesanan</h5>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Nomor Pesanan</span>
              <span className="font-medium">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span
                className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(
                  order.status
                )}`}
              >
                {getStatusLabel(order.status)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Outlet</span>
              <span className="font-medium">{order.outlet?.nama || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tanggal</span>
              <span className="font-medium">{formatDate(order.createdAt)}</span>
            </div>
            {order.notes && (
              <div>
                <span className="text-gray-500">Catatan</span>
                <p className="font-medium mt-1">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h5 className="font-semibold mb-4">Ringkasan Pembayaran</h5>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatRupiah(order.subtotal)}</span>
            </div>
            {order.pajakBreakdown && order.pajakBreakdown.length > 0 && (
              <>
                {order.pajakBreakdown.map((tax) => (
                  <div key={tax.taxId} className="flex justify-between">
                    <span className="text-gray-500">
                      {tax.nama} ({tax.rate}%)
                    </span>
                    <span>{formatRupiah(tax.amount)}</span>
                  </div>
                ))}
              </>
            )}
            {order.diskonBreakdown && order.diskonBreakdown.length > 0 && (
              <>
                {order.diskonBreakdown.map((discount) => (
                  <div key={discount.discountId} className="flex justify-between">
                    <span className="text-gray-500">
                      {discount.nama} ({discount.rate}%)
                    </span>
                    <span>-{formatRupiah(discount.amount)}</span>
                  </div>
                ))}
              </>
            )}
            {order.paymentMethod && (
              <div className="flex justify-between">
                <span className="text-gray-500">Metode Pembayaran</span>
                <span>{order.paymentMethod.nama}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-3 mt-3">
              <span>Total</span>
              <span>{formatRupiah(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border bg-white p-6">
        <h5 className="font-semibold mb-4">Item Pesanan</h5>
        {order.orderItems && order.orderItems.length > 0 ? (
          <div className="space-y-3">
            {order.orderItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium">{item.product?.nama || 'Product'}</p>
                  <p className="text-sm text-gray-500">
                    {item.quantity} x {formatRupiah(item.hargaSatuan)}
                    {item.jumlahDiskon && item.jumlahDiskon !== '0' && (
                      <span className="ml-2 text-green-600">
                        (-{formatRupiah(item.jumlahDiskon)})
                      </span>
                    )}
                  </p>
                </div>
                <span className="font-medium">{formatRupiah(item.total)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Tidak ada item</p>
        )}
      </div>
    </div>
  );
}
