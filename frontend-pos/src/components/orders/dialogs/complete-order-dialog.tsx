import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
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

interface CompleteOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export function CompleteOrderDialog({ open, onOpenChange, order }: CompleteOrderDialogProps) {
  const queryClient = useQueryClient();

  const completeMutation = useMutation({
    mutationFn: (id: string) => ordersApi.update(id, { status: 'complete' }),
    onSuccess: () => {
      toast.success('Pesanan berhasil ditandai selesai');
      queryClient.invalidateQueries({ queryKey: ['order', order?.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Gagal menyelesaikan pesanan');
    },
  });

  const handleConfirm = () => {
    if (order?.id) {
      completeMutation.mutate(order.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            Selesaikan Pesanan
          </DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menyelesaikan pesanan{' '}
            <span className="font-semibold">{order?.orderNumber}</span>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button variant="default" onClick={handleConfirm} disabled={completeMutation.isPending}>
            {completeMutation.isPending ? 'Menyelesaikan...' : 'Selesaikan Pesanan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
