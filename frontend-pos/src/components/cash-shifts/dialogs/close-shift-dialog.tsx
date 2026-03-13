import type { UseFormReturn } from 'react-hook-form';
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
import type { CashShift } from '@/lib/api/cash-shifts';
import type { CloseShiftFormValues } from '../hooks';

interface CloseShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: CashShift | null;
  onSubmit: (values: CloseShiftFormValues) => void;
  isPending: boolean;
  form: UseFormReturn<CloseShiftFormValues>;
}

const formatRupiah = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export function CloseShiftDialog({
  open,
  onOpenChange,
  shift,
  onSubmit,
  isPending,
  form,
}: CloseShiftDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Tutup Shift Kasir</DialogTitle>
        </DialogHeader>
        {shift && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Jumlah Buka:</span>
                <span className="font-medium">{formatRupiah(shift.jumlahBuka)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Expected:</span>
                <span className="font-medium">{formatRupiah(shift.jumlahExpected)}</span>
              </div>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="jumlahTutup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jumlah Tutup (Kas di akhir)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="catatan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan (Opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan catatan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? 'Menutup...' : 'Tutup Shift'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
