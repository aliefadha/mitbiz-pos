import { Card } from '@/components/ui/card';
import type { Order } from '@/lib/api/orders';

interface OrderInfoCardProps {
  order: Order;
}

export function OrderInfoCard({ order }: OrderInfoCardProps) {
  return (
    <Card className="w-[280px] shrink-0 rounded-lg border border-gray-200 bg-white p-6 space-y-5">
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
    </Card>
  );
}
