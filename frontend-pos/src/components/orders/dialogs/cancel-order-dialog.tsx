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

interface CancelOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export function CancelOrderDialog({ open, onOpenChange, order }: CancelOrderDialogProps) {
  const handleConfirm = () => {
    toast.info('Fitur pembatalan pesanan belum tersedia');
    onOpenChange(false);
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
          <Button variant="destructive" onClick={handleConfirm}>
            Batalkan Pesanan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
