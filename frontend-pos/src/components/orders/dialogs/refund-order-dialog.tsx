import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Order } from '@/lib/api/orders';
import { ordersApi } from '@/lib/api/orders';

interface RefundOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export function RefundOrderDialog({ open, onOpenChange, order }: RefundOrderDialogProps) {
  const queryClient = useQueryClient();

  const refundMutation = useMutation({
    mutationFn: (id: string) => ordersApi.refund(id),
    onSuccess: () => {
      toast.success('Pesanan berhasil dikembalikan');
      queryClient.invalidateQueries({ queryKey: ['order', order?.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Gagal mengembalikan pesanan');
    },
  });

  const handleConfirm = () => {
    if (order?.id) {
      refundMutation.mutate(order.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-orange-500" />
            Kembalikan Pesanan
          </DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin mengembalikan pesanan{' '}
            <span className="font-semibold">{order?.orderNumber}</span>? Tindakan ini akan
            mengembalikan dana ke pelanggan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={refundMutation.isPending}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {refundMutation.isPending ? 'Mengembalikan...' : 'Kembalikan Pesanan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
