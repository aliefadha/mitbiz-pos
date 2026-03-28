import type { UseFormReturn } from 'react-hook-form';
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
import type { PaymentMethod } from '@/lib/api/payment-methods';

export const paymentMethodFormSchema = z.object({
  nama: z.string().min(1, 'Nama metode pembayaran wajib diisi'),
});

export type PaymentMethodFormValues = z.infer<typeof paymentMethodFormSchema>;

interface CreatePaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPaymentMethod?: PaymentMethod | null;
  onSubmit: (values: PaymentMethodFormValues) => void;
  isPending: boolean;
  form: UseFormReturn<PaymentMethodFormValues>;
}

export function CreatePaymentMethodDialog({
  open,
  onOpenChange,
  editingPaymentMethod,
  onSubmit,
  isPending,
  form,
}: CreatePaymentMethodDialogProps) {
  const isEditing = !!editingPaymentMethod;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Metode Pembayaran</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama metode pembayaran" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isEditing ? 'Simpan' : 'Buat'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
