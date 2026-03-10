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
import type { Category } from '@/lib/api/categories';

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onConfirm: () => void;
  isPending: boolean;
}

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
  onConfirm,
  isPending,
}: DeleteCategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Hapus Kategori
          </DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus kategori{' '}
            <span className="font-semibold">{category?.nama}</span>? Tindakan ini tidak dapat
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
