import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { SubscriptionConfirmDialog } from '@/components/subscriptions/subscription-confirm-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type BillingCycle, subscriptionPlansApi } from '@/lib/api/subscriptions';
import { tenantsApi } from '@/lib/api/tenants';
import { signOut } from '@/lib/auth-client';
import { getUserScope } from '@/lib/permissions';

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

    const roleScope = await getUserScope();

    if (roleScope === 'global') {
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

function getBillingCycleShortLabel(cycle: string): string {
  switch (cycle) {
    case 'monthly':
      return 'mo';
    case 'quarterly':
      return 'qtr';
    case 'semi_annual':
      return '6mo';
    case 'yearly':
      return 'yr';
    default:
      return cycle;
  }
}

interface SelectedPlanState {
  id: string;
  name: string;
  cycle: BillingCycle;
  price: string;
}

function SubscriptionPage() {
  const { subscription } = Route.useRouteContext();
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlanState | null>(null);
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

        <div className="max-w-2xl mx-auto">
          {plans[0] &&
            (() => {
              const plan = plans[0];
              const billingCycles = plan.billingCycles || [];
              const sortedBillingCycles = [...billingCycles].sort((a, b) => {
                const order = { monthly: 1, quarterly: 2, semi_annual: 3, yearly: 4 };
                return (
                  (order[a.cycle as keyof typeof order] || 99) -
                  (order[b.cycle as keyof typeof order] || 99)
                );
              });
              const defaultCycle = sortedBillingCycles[0];

              return (
                <Card className="flex flex-col">
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>
                      {sortedBillingCycles.length} billing option
                      {sortedBillingCycles.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {sortedBillingCycles.map((bc) => (
                        <Button
                          key={bc.cycle}
                          type="button"
                          variant="outline"
                          className={`flex flex-col h-auto py-3 ${selectedPlan?.id === plan.id && selectedPlan?.cycle === bc.cycle ? 'border-blue-500 bg-blue-50' : ''}`}
                          onClick={() => {
                            setSelectedPlan({
                              id: plan.id,
                              name: plan.name,
                              cycle: bc.cycle,
                              price: bc.price,
                            });
                          }}
                        >
                          <span className="text-lg font-bold">
                            {formatCurrency(Number(bc.price))}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            /{getBillingCycleShortLabel(bc.cycle)}
                          </span>
                        </Button>
                      ))}
                    </div>

                    <Button
                      className="w-full mt-auto"
                      variant={plan.name.toLowerCase().includes('free') ? 'outline' : 'default'}
                      disabled={subscription?.status === 'active'}
                      onClick={() => {
                        const currentSelection =
                          selectedPlan?.id === plan.id ? selectedPlan : defaultCycle;
                        if (currentSelection) {
                          setSelectedPlan({
                            id: plan.id,
                            name: plan.name,
                            cycle: currentSelection.cycle,
                            price: currentSelection.price,
                          });
                        }
                        setDialogOpen(true);
                      }}
                    >
                      {subscription?.status === 'active' ? 'Current Plan' : 'Subscribe'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })()}
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
