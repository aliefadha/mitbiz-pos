import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Outlet } from '@/lib/api/outlets';

interface DeleteOutletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outlet?: Outlet | null;
  onConfirm: () => void;
  isPending: boolean;
}

export function DeleteOutletDialog({
  open,
  onOpenChange,
  outlet,
  onConfirm,
  isPending,
}: DeleteOutletDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Hapus Outlet
          </DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus outlet{' '}
            <span className="font-semibold">{outlet?.nama}</span>? Tindakan ini tidak dapat
            dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
