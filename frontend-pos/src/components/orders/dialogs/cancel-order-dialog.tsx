import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
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

interface CancelOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export function CancelOrderDialog({ open, onOpenChange, order }: CancelOrderDialogProps) {
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: (id: string) => ordersApi.cancel(id),
    onSuccess: () => {
      toast.success('Pesanan berhasil dibatalkan');
      queryClient.invalidateQueries({ queryKey: ['order', order?.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Gagal membatalkan pesanan');
    },
  });

  const handleConfirm = () => {
    if (order?.id) {
      cancelMutation.mutate(order.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Batalkan Pesanan
          </DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin membatalkan pesanan{' '}
            <span className="font-semibold">{order?.orderNumber}</span>? Tindakan ini tidak dapat
            dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={cancelMutation.isPending}>
            {cancelMutation.isPending ? 'Membatalkan...' : 'Batalkan Pesanan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
