import { useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Outlet } from '@/lib/api/outlets';
import type { OpenShiftFormValues } from '../hooks';

interface OpenShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outlets: Outlet[];
  cashierName: string;
  cashierOutletId?: string | null;
  onSubmit: (values: OpenShiftFormValues) => void;
  isPending: boolean;
  form: UseFormReturn<OpenShiftFormValues>;
}

export function OpenShiftDialog({
  open,
  onOpenChange,
  outlets,
  cashierName,
  cashierOutletId,
  onSubmit,
  isPending,
  form,
}: OpenShiftDialogProps) {
  const selectedOutletId = form.watch('outletId');
  const cashierHasOutlet = !!cashierOutletId;

  useEffect(() => {
    if (cashierOutletId) {
      form.setValue('outletId', cashierOutletId);
    }
  }, [cashierOutletId, form]);

  const isOutletDisabled = cashierHasOutlet;
  const canSubmit = cashierHasOutlet || (!cashierHasOutlet && selectedOutletId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Buka Shift Kasir</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel>Kasir</FormLabel>
              <Select disabled value="cashier">
                <FormControl>
                  <SelectTrigger>
                    <SelectValue>{cashierName}</SelectValue>
                  </SelectTrigger>
                </FormControl>
              </Select>
            </FormItem>
            <FormField
              control={form.control}
              name="outletId"
              render={({ field }) => {
                const outletName = cashierHasOutlet
                  ? outlets.find((o) => o.id === cashierOutletId)?.nama
                  : outlets.find((o) => o.id === field.value)?.nama;

                return (
                  <FormItem>
                    <FormLabel>Outlet</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isOutletDisabled}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih outlet">{outletName}</SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      {!cashierHasOutlet && (
                        <SelectContent>
                          {outlets?.map((outlet) => (
                            <SelectItem key={outlet.id} value={outlet.id}>
                              {outlet.nama}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      )}
                    </Select>
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="jumlahBuka"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah Buka (Kas di awal)</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      value={field.value || '0'}
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
              <Button type="submit" disabled={isPending || !canSubmit}>
                {isPending ? 'Membuka...' : 'Buka Shift'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
