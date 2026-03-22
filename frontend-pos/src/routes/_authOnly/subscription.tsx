import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Check, LogOut } from 'lucide-react';
import { useState } from 'react';
import { SubscriptionConfirmDialog } from '@/components/subscriptions/subscription-confirm-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { subscriptionPlansApi } from '@/lib/api/subscriptions';
import { tenantsApi } from '@/lib/api/tenants';
import { signOut } from '@/lib/auth-client';

function formatCurrency(amount: string | number): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(numAmount)
    .replace('IDR', 'Rp');
}

export const Route = createFileRoute('/_authOnly/subscription')({
  component: SubscriptionPage,
  beforeLoad: async ({ context }) => {
    const { user } = context.session;

    if (user.roleScope === 'global') {
      throw redirect({ to: '/admin' });
    }

    const tenantId = user.tenantId;
    if (!tenantId) {
      throw redirect({ to: '/onboarding/create-tenant' });
    }

    const tenant = await tenantsApi.getById(tenantId);
    const { subscription } = await tenantsApi.getSubscription(tenant.slug);

    if (subscription && subscription.status === 'active') {
      throw redirect({ to: '/cash-shifts' });
    }

    return { subscription };
  },
});

function SubscriptionPage() {
  const { subscription } = Route.useRouteContext();
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    name: string;
    price: string;
    billingCycle: string;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: plansData, isLoading: isPlansLoading } = useQuery({
    queryKey: ['subscription-plans', 'active'],
    queryFn: () => subscriptionPlansApi.getAll({ isActive: true }),
  });

  const plans = plansData?.data ?? [];

  const getStatusMessage = () => {
    if (!subscription) {
      return 'You do not have an active subscription. Choose a plan to continue.';
    }
    switch (subscription.status) {
      case 'expired':
        return 'Your subscription has expired. Please choose a plan to continue.';
      case 'cancelled':
        return 'Your subscription has been cancelled. Choose a plan to continue.';
      case 'suspended':
        return 'Your subscription has been suspended. Please contact support.';
      default:
        return 'Your subscription is active.';
    }
  };

  const formatBillingCycle = (cycle: string) => {
    switch (cycle) {
      case 'monthly':
        return 'Monthly';
      case 'quarterly':
        return 'Quarterly';
      case 'yearly':
        return 'Yearly';
      default:
        return cycle;
    }
  };

  if (isPlansLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold mb-2">Subscription</h1>
            <p
              className={`text-lg ${subscription?.status === 'active' ? 'text-green-600' : 'text-muted-foreground'}`}
            >
              {getStatusMessage()}
            </p>
            {subscription && subscription.status === 'active' && (
              <p className="text-sm text-muted-foreground mt-2">
                Expires on{' '}
                {new Date(subscription.expiresAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await signOut();
              window.location.href = '/login';
            }}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {subscription && subscription.status !== 'active' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 text-center">
            <p className="text-amber-800">
              Please subscribe to a plan to continue using the service.
            </p>
          </div>
        )}

        {subscription && subscription.status === 'active' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 text-center">
            <p className="text-green-800">
              Your subscription is active and valid until{' '}
              {new Date(subscription.expiresAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{formatBillingCycle(plan.billingCycle)}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="text-3xl font-bold mb-4">
                  {formatCurrency(Number(plan.price))}
                  <span className="text-sm font-normal text-muted-foreground">
                    /
                    {plan.billingCycle === 'monthly'
                      ? 'mo'
                      : plan.billingCycle === 'quarterly'
                        ? 'qtr'
                        : 'yr'}
                  </span>
                </div>

                <div className="flex-1 space-y-2 mb-6">
                  {plan.planProFeatures?.map((feature) => (
                    <div key={feature.id} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span className="text-sm">{feature.proFeature.name}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full"
                  variant={plan.name.toLowerCase().includes('basic') ? 'outline' : 'default'}
                  disabled={subscription?.status === 'active'}
                  onClick={() => {
                    setSelectedPlan({
                      id: plan.id,
                      name: plan.name,
                      price: plan.price,
                      billingCycle: plan.billingCycle,
                    });
                    setDialogOpen(true);
                  }}
                >
                  {subscription?.status === 'active' ? 'Current Plan' : 'Subscribe'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedPlan && (
          <SubscriptionConfirmDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            plan={selectedPlan}
          />
        )}
      </div>
    </div>
  );
}
