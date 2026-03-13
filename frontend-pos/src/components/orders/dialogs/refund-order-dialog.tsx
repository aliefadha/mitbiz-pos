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

interface RefundOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export function RefundOrderDialog({ open, onOpenChange, order }: RefundOrderDialogProps) {
  const handleConfirm = () => {
    toast.info('Fitur pengembalian pesanan belum tersedia');
    onOpenChange(false);
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
            className="bg-orange-500 hover:bg-orange-600"
          >
            Kembalikan Pesanan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
