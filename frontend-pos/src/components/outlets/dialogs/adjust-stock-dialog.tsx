import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const adjustStockFormSchema = z.object({
  quantity: z.number(),
  alasan: z.string().optional(),
});

type AdjustStockFormValues = z.infer<typeof adjustStockFormSchema>;

interface AdjustStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  currentQuantity: number;
  onSubmit: (values: AdjustStockFormValues) => void;
  isPending: boolean;
  form: ReturnType<typeof useForm<AdjustStockFormValues>>;
}

export function AdjustStockDialog({
  open,
  onOpenChange,
  productName,
  currentQuantity,
  onSubmit,
  isPending,
  form,
}: AdjustStockDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock — {productName}</DialogTitle>
        </DialogHeader>
        <div className="mb-4 text-sm text-gray-500">
          Stock saat ini: <strong>{currentQuantity ?? 0}</strong>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah Adjustment</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Contoh: 10 atau -5"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">
                    Gunakan angka positif untuk menambah, negatif untuk mengurangi
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="alasan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alasan</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Restock dari supplier" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export { adjustStockFormSchema };
export type { AdjustStockFormValues };
