import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Outlet } from '@/lib/api/outlets';
import type { Product } from '@/lib/api/products';

interface CreateAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outlets: Outlet[];
  products: Product[];
  selectedOutlet: string;
  selectedProduct: string;
  quantity: string;
  alasan: string;
  isPending: boolean;
  onOutletChange: (value: string) => void;
  onProductChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onAlasanChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function CreateAdjustmentDialog({
  open,
  onOpenChange,
  outlets,
  products,
  selectedOutlet,
  selectedProduct,
  quantity,
  alasan,
  isPending,
  onOutletChange,
  onProductChange,
  onQuantityChange,
  onAlasanChange,
  onSubmit,
  onCancel,
}: CreateAdjustmentDialogProps) {
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onCancel();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tambah Penyesuaian Stok</DialogTitle>
          <DialogDescription>Tambah atau kurangi stok produk di outlet tertentu.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="outlet">Outlet *</Label>
              <Select value={selectedOutlet} onValueChange={onOutletChange}>
                <SelectTrigger id="outlet">
                  <SelectValue placeholder="Pilih outlet" />
                </SelectTrigger>
                <SelectContent>
                  {outlets.map((outlet) => (
                    <SelectItem key={`outlet-${outlet.id}`} value={outlet.id}>
                      {outlet.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="product">Produk *</Label>
              <Select
                value={selectedProduct}
                onValueChange={onProductChange}
                disabled={!selectedOutlet}
              >
                <SelectTrigger id="product">
                  <SelectValue
                    placeholder={selectedOutlet ? 'Pilih produk' : 'Pilih outlet terlebih dahulu'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={`product-${product.id}`} value={product.id}>
                      {product.nama} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quantity">Jumlah Penyesuaian *</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Contoh: 10 (tambah) atau -5 (kurang)"
                value={quantity}
                onChange={(e) => onQuantityChange(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Gunakan nilai positif untuk menambah stok, negatif untuk mengurangi.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="alasan">Alasan</Label>
              <Textarea
                id="alasan"
                placeholder="Alasan penyesuaian stok (opsional)"
                value={alasan}
                onChange={(e) => onAlasanChange(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending || !selectedOutlet || !selectedProduct || !quantity}
            >
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
