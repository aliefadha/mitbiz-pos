import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
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
          <div className="space-y-4 mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="jumlahTutup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jumlah Tutup (Kas di akhir)</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="0"
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
