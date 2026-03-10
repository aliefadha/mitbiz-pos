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

const editStockFormSchema = z.object({
  quantity: z.number(),
});

type EditStockFormValues = z.infer<typeof editStockFormSchema>;

interface EditStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  onSubmit: (values: EditStockFormValues) => void;
  isPending: boolean;
  form: ReturnType<typeof useForm<EditStockFormValues>>;
}

export function EditStockDialog({
  open,
  onOpenChange,
  productName,
  onSubmit,
  isPending,
  form,
}: EditStockDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Stock — {productName}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
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

export { editStockFormSchema };
export type { EditStockFormValues };
