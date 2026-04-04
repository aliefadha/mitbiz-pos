import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Loader2, Plus, Save, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyInput } from '@/components/ui/currency-input';
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  type BillingCycle,
  type CreatePlanDto,
  subscriptionPlansApi,
} from '@/lib/api/subscriptions';

const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: 'Monthly (1 bulan)' },
  { value: 'quarterly', label: 'Quarterly (3 bulan)' },
  { value: 'semi_annual', label: 'Semi Annual (6 bulan)' },
  { value: 'yearly', label: 'Yearly (12 bulan)' },
];

const createPlanFormSchema = z.object({
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

export type CreatePlanFormValues = z.infer<typeof createPlanFormSchema>;

export function CreatePlanPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<CreatePlanFormValues>({
    resolver: zodResolver(createPlanFormSchema),
    defaultValues: {
      name: '',
      billingCycles: [{ cycle: 'monthly', price: '0' }],
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePlanDto) => subscriptionPlansApi.create(data),
    onSuccess: () => {
      toast.success('Plan created successfully');
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      navigate({ to: '/subscriptions' });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create plan');
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    createMutation.mutate({
      name: values.name,
      billingCycles: values.billingCycles,
      isActive: values.isActive,
    });
  });

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
    <div className="max-w-2xl">
      <Button
        variant="link"
        onClick={() => navigate({ to: '/subscriptions' })}
        className="mb-4 pl-0 text-gray-500"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Paket Langganan
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create New Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-6">
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

              <Separator />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <p className="text-sm text-gray-500">
                        Set whether this plan is available for subscription
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: '/subscriptions' })}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Plan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
