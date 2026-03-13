import { useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Outlet } from '@/lib/api/outlets';
import type { User } from '@/lib/api/users';
import type { OpenShiftFormValues } from '../hooks';

interface OpenShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outlets: Outlet[];
  users: User[];
  currentUserId?: string;
  onSubmit: (values: OpenShiftFormValues) => void;
  isPending: boolean;
  form: UseFormReturn<OpenShiftFormValues>;
}

export function OpenShiftDialog({
  open,
  onOpenChange,
  outlets,
  users,
  currentUserId,
  onSubmit,
  isPending,
  form,
}: OpenShiftDialogProps) {
  const selectedCashierId = form.watch('cashierId');
  const selectedCashier = users.find((u) => u.id === selectedCashierId);
  const cashierHasOutlet = !!selectedCashier?.outletId;
  const selectedOutletId = form.watch('outletId');

  useEffect(() => {
    if (selectedCashier?.outletId) {
      form.setValue('outletId', selectedCashier.outletId);
    } else if (!selectedCashier?.outletId && selectedCashierId) {
      form.setValue('outletId', '');
    }
  }, [selectedCashier, selectedCashierId, form]);

  const isOutletDisabled = cashierHasOutlet;
  const canSubmit =
    selectedCashierId && (cashierHasOutlet || (!cashierHasOutlet && selectedOutletId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Buka Shift Kasir</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cashierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kasir</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || currentUserId || ''}
                    value={field.value || currentUserId || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kasir" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="outletId"
              render={({ field }) => {
                const outletName = cashierHasOutlet
                  ? selectedCashier?.outlet?.nama ||
                    outlets.find((o) => o.id === selectedCashier?.outletId)?.nama
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
