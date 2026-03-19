import { Check } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import type { ProFeature } from '@/lib/api/subscriptions';

export const subscriptionPlanFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  billingCycle: z.enum(['monthly', 'quarterly', 'yearly']),
  price: z.string().min(1, 'Price is required'),
  isActive: z.boolean(),
  proFeatureIds: z.array(z.string()).optional(),
});

export type SubscriptionPlanFormValues = z.infer<typeof subscriptionPlanFormSchema>;

interface EditPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SubscriptionPlanFormValues) => void;
  isPending: boolean;
  form: UseFormReturn<SubscriptionPlanFormValues>;
  allProFeatures?: ProFeature[];
  isLoadingProFeatures?: boolean;
}

export function EditPlanDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  form,
  allProFeatures,
  isLoadingProFeatures,
}: EditPlanDialogProps) {
  const proFeatureIds = form.watch('proFeatureIds') || [];

  const toggleProFeature = (featureId: string) => {
    const current = form.getValues('proFeatureIds') || [];
    if (current.includes(featureId)) {
      form.setValue(
        'proFeatureIds',
        current.filter((id: string) => id !== featureId)
      );
    } else {
      form.setValue('proFeatureIds', [...current, featureId]);
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
            <FormField
              control={form.control}
              name="billingCycle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing Cycle</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select billing cycle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (IDR)</FormLabel>
                  <FormControl>
                    <CurrencyInput value={field.value} onChange={field.onChange} placeholder="0" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="mb-3 block">Pro Features</FormLabel>
              {isLoadingProFeatures ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : allProFeatures && allProFeatures.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allProFeatures.map((feature) => (
                    <div
                      key={feature.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        proFeatureIds.includes(feature.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleProFeature(feature.id)}
                    >
                      <div className="space-y-0.5">
                        <p className="font-medium text-sm">{feature.name}</p>
                        {feature.description && (
                          <p className="text-xs text-gray-500">{feature.description}</p>
                        )}
                      </div>
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center ${
                          proFeatureIds.includes(feature.id)
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {proFeatureIds.includes(feature.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No pro features available</p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {proFeatureIds.length} feature{proFeatureIds.length !== 1 ? 's' : ''} selected
              </p>
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
