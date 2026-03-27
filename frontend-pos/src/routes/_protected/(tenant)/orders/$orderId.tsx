import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { ArrowLeft, Check, RotateCcw, XCircle } from 'lucide-react';
import { useState } from 'react';
import {
  CancelOrderDialog,
  CompleteOrderDialog,
  RefundOrderDialog,
} from '@/components/orders/dialogs';
import { useOrderDetailPage } from '@/components/orders/hooks';
import { OrderInfoCard } from '@/components/orders/order-info-card';
import { OrderItemsTable } from '@/components/orders/order-items-table';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/use-auth';
import { checkPermissionWithScope } from '@/lib/permissions';
import { useSessionWithCache } from '@/lib/session-cache';

export function OrderDetailPage() {
  const { orderId } = useParams({ from: '/_protected/(tenant)/orders/$orderId' });
  const { data: session } = useSessionWithCache();
  const tenantId = session?.user?.tenantId;
  const { hasPermission } = usePermissions();

  const canUpdate = hasPermission('orders', 'update');

  const { order, isLoading } = useOrderDetailPage(orderId);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);

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

  if (!order || (tenantId && order.tenantId !== tenantId)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Pesanan tidak ditemukan</p>
        <Button variant="link" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      </div>
    );
  }

  const canCancel = order.status === 'complete' && canUpdate;
  const canComplete = (order.status === 'cancel' || order.status === 'refunded') && canUpdate;

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

      <div className="flex gap-6 mt-6 items-start">
        <OrderItemsTable order={order} />
        <OrderInfoCard order={order} />
      </div>

      {canCancel && (
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => setCancelDialogOpen(true)}>
            <XCircle className="mr-2 h-4 w-4" />
            Cancel Pesanan
          </Button>
          <Button variant="outline" onClick={() => setRefundDialogOpen(true)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Refund Pesanan
          </Button>
        </div>
      )}

      {canComplete && (
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => setCompleteDialogOpen(true)}>
            <Check className="mr-2 h-4 w-4" />
            Tandai Selesai
          </Button>
        </div>
      )}

      <CancelOrderDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen} order={order} />

      <CompleteOrderDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        order={order}
      />

      <RefundOrderDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen} order={order} />
    </div>
  );
}

export const Route = createFileRoute('/_protected/(tenant)/orders/$orderId')({
  component: OrderDetailPage,
  beforeLoad: async () => {
    await checkPermissionWithScope('orders', 'read', 'tenant');
  },
});
