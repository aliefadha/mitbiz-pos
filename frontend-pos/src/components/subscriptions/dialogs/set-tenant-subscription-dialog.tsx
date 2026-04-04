import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BillingCyclePrice } from '@/lib/api/subscriptions';
import { subscriptionPlansApi } from '@/lib/api/subscriptions';
import { tenantsApi } from '@/lib/api/tenants';

function formatCurrency(amount: string | number): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(numAmount)
    .replace('IDR', 'Rp')
    .trim();
}

function getBillingCycleLabel(cycle: string): string {
  switch (cycle) {
    case 'monthly':
      return 'Monthly';
    case 'quarterly':
      return 'Quarterly';
    case 'semi_annual':
      return '6 Monthly';
    case 'yearly':
      return 'Yearly';
    default:
      return cycle;
  }
}

interface SetTenantSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  planName: string;
  billingCycles: BillingCyclePrice[];
  tenantName: string;
  tenantSlug: string;
  existingSubscriptionId?: string | null;
  existingSubscriptionStatus?: string;
  onSuccess?: () => void;
}

export function SetTenantSubscriptionDialog({
  open,
  onOpenChange,
  planId,
  planName,
  billingCycles,
  tenantName,
  tenantSlug,
  existingSubscriptionId,
  existingSubscriptionStatus,
  onSuccess,
}: SetTenantSubscriptionDialogProps) {
  const queryClient = useQueryClient();
  const isSubscribed = !!existingSubscriptionId;
  const isCancelledOrExpired =
    existingSubscriptionStatus === 'cancelled' || existingSubscriptionStatus === 'expired';

  const [selectedBillingCycle, setSelectedBillingCycle] = useState<string>(
    billingCycles[0]?.cycle || 'monthly'
  );

  const selectedCycleData = billingCycles.find((bc) => bc.cycle === selectedBillingCycle);

  const createSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return tenantsApi.createSubscription(tenantSlug, {
        planId,
        billingCycle: selectedBillingCycle as BillingCyclePrice['cycle'],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plan-subscriptions', planId] });
      queryClient.invalidateQueries({ queryKey: ['tenants-with-active-subscriptions'] });
      toast.success('Subscription created successfully');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create subscription');
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!existingSubscriptionId) throw new Error('No subscription ID');
      return subscriptionPlansApi.cancelSubscription(existingSubscriptionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plan-subscriptions', planId] });
      queryClient.invalidateQueries({ queryKey: ['subscription-plan-history', planId] });
      queryClient.invalidateQueries({ queryKey: ['tenants-with-active-subscriptions'] });
      toast.success('Subscription cancelled successfully');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to cancel subscription');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isSubscribed ? 'Manage Subscription' : 'Set Subscription for Tenant'}
          </DialogTitle>
          <DialogDescription>
            {isSubscribed ? (
              <>
                <strong>{tenantName}</strong> currently has this subscription. You can remove it to
                change to a different plan.
              </>
            ) : (
              <>
                Create a new subscription for <strong>{tenantName}</strong> using this plan.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-muted rounded-lg">
          <p className="font-medium">{planName}</p>
          {!isSubscribed && billingCycles.length > 0 && (
            <div className="mt-2">
              <Select value={selectedBillingCycle} onValueChange={setSelectedBillingCycle}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select billing cycle" />
                </SelectTrigger>
                <SelectContent>
                  {billingCycles.map((bc) => (
                    <SelectItem key={bc.cycle} value={bc.cycle}>
                      {getBillingCycleLabel(bc.cycle)} - {formatCurrency(bc.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCycleData && (
                <p className="text-sm text-muted-foreground mt-1">
                  {formatCurrency(selectedCycleData.price)} /{' '}
                  {getBillingCycleLabel(selectedBillingCycle)}
                </p>
              )}
            </div>
          )}
          {isSubscribed && selectedCycleData && (
            <p className="text-sm text-muted-foreground">
              {formatCurrency(selectedCycleData.price)} /{' '}
              {getBillingCycleLabel(selectedCycleData.cycle)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <span className="text-sm font-medium text-blue-600">
              {tenantName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{tenantName}</p>
            <p className="text-xs text-muted-foreground truncate">Slug: {tenantSlug}</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {isSubscribed ? (
            <>
              {isCancelledOrExpired ? (
                <p className="text-sm text-muted-foreground text-center py-2 w-full">
                  This subscription was cancelled
                </p>
              ) : (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => cancelSubscriptionMutation.mutate()}
                  disabled={cancelSubscriptionMutation.isPending}
                >
                  {cancelSubscriptionMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Subscription
                </Button>
              )}
            </>
          ) : (
            <Button
              type="button"
              onClick={() => createSubscriptionMutation.mutate()}
              disabled={createSubscriptionMutation.isPending}
            >
              {createSubscriptionMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Subscription
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
