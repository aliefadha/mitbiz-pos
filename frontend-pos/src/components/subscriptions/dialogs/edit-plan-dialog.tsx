import { Plus, X } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
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
import { Switch } from '@/components/ui/switch';
import type { BillingCycle } from '@/lib/api/subscriptions';

const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: 'Monthly (1 bulan)' },
  { value: 'quarterly', label: 'Quarterly (3 bulan)' },
  { value: 'semi_annual', label: 'Semi Annual (6 bulan)' },
  { value: 'yearly', label: 'Yearly (12 bulan)' },
];

export const subscriptionPlanFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  billingCycles: z
    .array(
      z.object({
        cycle: z.enum(['monthly', 'quarterly', 'semi_annual', 'yearly']),
        price: z.string().min(1, 'Price is required'),
      })
    )
    .min(1, 'At least one billing cycle is required'),
  isActive: z.boolean(),
});

export type SubscriptionPlanFormValues = z.infer<typeof subscriptionPlanFormSchema>;

interface EditPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SubscriptionPlanFormValues) => void;
  isPending: boolean;
  form: UseFormReturn<SubscriptionPlanFormValues>;
}

export function EditPlanDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  form,
}: EditPlanDialogProps) {
  const billingCycles = form.watch('billingCycles') || [];

  const addBillingCycle = () => {
    const current = form.getValues('billingCycles') || [];
    const usedCycles = current.map((bc) => bc.cycle);
    const availableCycle = BILLING_CYCLES.find((bc) => !usedCycles.includes(bc.value));
    if (availableCycle) {
      form.setValue('billingCycles', [...current, { cycle: availableCycle.value, price: '0' }]);
    }
  };

  const removeBillingCycle = (index: number) => {
    const current = form.getValues('billingCycles') || [];
    if (current.length > 1) {
      form.setValue(
        'billingCycles',
        current.filter((_, i) => i !== index)
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Plan</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter plan name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base">Billing Cycles</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBillingCycle}
                  disabled={billingCycles.length >= BILLING_CYCLES.length}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Cycle
                </Button>
              </div>

              <div className="space-y-3">
                {billingCycles.map((_, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name={`billingCycles.${index}.cycle`}
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={billingCycles.length <= 1}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select billing cycle" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {BILLING_CYCLES.map((cycle) => (
                                  <SelectItem
                                    key={cycle.value}
                                    value={cycle.value}
                                    disabled={billingCycles.some(
                                      (b, i) => i !== index && b.cycle === cycle.value
                                    )}
                                  >
                                    {cycle.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name={`billingCycles.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <CurrencyInput
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Price"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBillingCycle(index)}
                      disabled={billingCycles.length <= 1}
                      className="mt-1 text-gray-500 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
