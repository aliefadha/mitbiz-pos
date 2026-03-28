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
import { Textarea } from '@/components/ui/textarea';
import type { Outlet } from '@/lib/api/outlets';

export const outletFormSchema = z.object({
  nama: z.string().min(1, 'Nama outlet wajib diisi'),
  kode: z
    .string()
    .min(3, 'Kode outlet minimal 3 karakter')
    .max(5, 'Kode outlet maksimal 5 karakter'),
  alamat: z.string().optional(),
  noHp: z.string().optional(),
});

export type OutletFormValues = z.infer<typeof outletFormSchema>;

interface CreateOutletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingOutlet?: Outlet | null;
  onSubmit: (values: OutletFormValues) => void;
  isPending: boolean;
  form: UseFormReturn<OutletFormValues>;
}

export function CreateOutletDialog({
  open,
  onOpenChange,
  editingOutlet,
  onSubmit,
  isPending,
  form,
}: CreateOutletDialogProps) {
  const isEditing = !!editingOutlet;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Outlet' : 'Tambah Outlet'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="kode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kode Outlet</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Masukkan kode outlet"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Outlet</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama outlet" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="alamat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Masukkan alamat (opsional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="noHp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No. HP</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nomor HP (opsional)" {...field} />
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
