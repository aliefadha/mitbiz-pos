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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { Category } from '@/lib/api/categories';

export const categoryFormSchema = z.object({
  nama: z.string().min(1, 'Nama kategori wajib diisi'),
  deskripsi: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory?: Category | null;
  onSubmit: (values: CategoryFormValues) => void;
  isPending: boolean;
  form: UseFormReturn<CategoryFormValues>;
}

export function CreateCategoryDialog({
  open,
  onOpenChange,
  editingCategory,
  onSubmit,
  isPending,
  form,
}: CreateCategoryDialogProps) {
  const isEditing = !!editingCategory;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Kategori</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama kategori" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deskripsi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Masukkan deskripsi (opsional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isEditing && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Status Aktif</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
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
