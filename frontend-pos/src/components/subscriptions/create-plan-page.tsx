import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Check, Loader2, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  type SubscriptionPlanFormValues,
  subscriptionPlanFormSchema,
} from '@/components/subscriptions/dialogs/edit-plan-dialog';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { type CreatePlanDto, subscriptionPlansApi } from '@/lib/api/subscriptions';

export function CreatePlanPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<SubscriptionPlanFormValues>({
    resolver: zodResolver(subscriptionPlanFormSchema),
    defaultValues: {
      name: '',
      billingCycle: 'monthly',
      price: '0',
      isActive: true,
      proFeatureIds: [],
    },
  });

  const { data: proFeaturesData, isLoading: proFeaturesLoading } = useQuery({
    queryKey: ['pro-features'],
    queryFn: () => subscriptionPlansApi.getAllProFeatures(),
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
    const { proFeatureIds, ...planData } = values;
    createMutation.mutate({
      ...planData,
      proFeatureIds: proFeatureIds || [],
    });
  });

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

              <div>
                <FormLabel className="mb-3 block">Pro Features</FormLabel>
                {proFeaturesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : proFeaturesData && proFeaturesData.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {proFeaturesData.map((feature) => (
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
