import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, Building2, Edit2, Loader2, Plus, Settings, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { DeletePlanDialog } from '@/components/subscriptions/dialogs/delete-plan-dialog';
import {
  EditPlanDialog,
  type SubscriptionPlanFormValues,
  subscriptionPlanFormSchema,
} from '@/components/subscriptions/dialogs/edit-plan-dialog';
import { SetTenantSubscriptionDialog } from '@/components/subscriptions/dialogs/set-tenant-subscription-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  type BillingCycle,
  type SubscriptionHistory,
  type SubscriptionHistoryAction,
  subscriptionPlansApi,
  type TenantSubscription,
} from '@/lib/api/subscriptions';
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
      return 'Month';
    case 'quarterly':
      return 'Quarter';
    case 'semi_annual':
      return '6 Month';
    case 'yearly':
      return 'Year';
    default:
      return cycle;
  }
}

function formatBillingCycleLabel(cycle: string | undefined): string {
  if (!cycle) return '-';
  const labels: Record<string, string> = {
    monthly: 'Bulanan',
    quarterly: '3 Bulanan',
    semi_annual: '6 Bulanan',
    yearly: 'Tahunan',
  };
  return labels[cycle] || cycle;
}

export function SubscriptionPlanDetailPage() {
  const { planId } = useParams({ from: '/_protected/(global)/subscriptions/$planId' as any });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [setSubscriptionTenant, setSetSubscriptionTenant] = useState<{
    id: string;
    nama: string;
    slug: string;
    subscriptionId?: string | null;
    subscriptionStatus?: string;
  } | null>(null);
  const [tenantSelectorOpen, setTenantSelectorOpen] = useState(false);

  const [historyPage, setHistoryPage] = useState(1);
  const [historyAction, setHistoryAction] = useState<SubscriptionHistoryAction | undefined>();
  const [historyTenantId, setHistoryTenantId] = useState<string | undefined>();
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<string | null>(null);

  const { data: allTenantsData, isLoading: allTenantsLoading } = useQuery({
    queryKey: ['tenants-all'],
    queryFn: () => tenantsApi.getAll({ isActive: true }),
  });

  const form = useForm<SubscriptionPlanFormValues>({
    resolver: zodResolver(subscriptionPlanFormSchema),
    defaultValues: {
      name: '',
      billingCycles: [{ cycle: 'monthly' as BillingCycle, price: '0' }],
      isActive: true,
    },
  });

  const {
    data: plan,
    isLoading: planLoading,
    isError,
  } = useQuery({
    queryKey: ['subscription-plan', planId],
    queryFn: () => subscriptionPlansApi.getById(planId),
  });

  useEffect(() => {
    if (plan) {
      const billingCycles = plan.billingCycles?.map((bc) => ({
        cycle: bc.cycle,
        price: bc.price,
      })) || [{ cycle: 'monthly' as BillingCycle, price: '0' }];

      form.reset({
        name: plan.name,
        billingCycles,
        isActive: plan.isActive,
      });
    }
  }, [plan, form]);

  const { data: planSubscriptionsData, isLoading: planSubscriptionsLoading } = useQuery({
    queryKey: ['subscription-plan-subscriptions', planId],
    queryFn: () => subscriptionPlansApi.getPlanSubscriptions(planId),
  });

  const { data: tenantsWithActiveSubscriptions } = useQuery({
    queryKey: ['tenants-with-active-subscriptions'],
    queryFn: () => subscriptionPlansApi.getTenantsWithActiveSubscriptions(),
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['subscription-plan-history', planId, historyPage, historyAction, historyTenantId],
    queryFn: () =>
      subscriptionPlansApi.getPlanHistory(planId, {
        page: historyPage,
        limit: 10,
        action: historyAction,
        tenantId: historyTenantId,
      }),
  });

  const updatePlanMutation = useMutation({
    mutationFn: async (data: SubscriptionPlanFormValues) => {
      const { billingCycles, ...planData } = data;
      await subscriptionPlansApi.update(planId, { ...planData, billingCycles });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plan', planId] });
      setEditDialogOpen(false);
      toast.success('Plan updated successfully');
    },
    onError: () => {
      toast.error('Failed to update plan');
    },
  });

  const handleEditSubmit = (values: SubscriptionPlanFormValues) => {
    updatePlanMutation.mutate(values);
  };

  const deletePlanMutation = useMutation({
    mutationFn: () => subscriptionPlansApi.delete(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Plan deleted successfully');
      navigate({ to: '/subscriptions' });
    },
    onError: () => {
      toast.error('Failed to delete plan');
    },
  });

  if (planLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div className="space-y-6">
        <Button
          variant="link"
          onClick={() => navigate({ to: '/subscriptions' })}
          className="pl-0 text-gray-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Paket Langganan
        </Button>
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <p className="text-lg font-medium">Paket tidak ditemukan</p>
          <p className="text-sm mt-1">Data paket yang Anda cari tidak tersedia</p>
        </div>
      </div>
    );
  }

  const sortedBillingCycles = [...(plan.billingCycles || [])].sort((a, b) => {
    const order = { monthly: 1, quarterly: 2, semi_annual: 3, yearly: 4 };
    return (
      (order[a.cycle as keyof typeof order] || 99) - (order[b.cycle as keyof typeof order] || 99)
    );
  });

  return (
    <div className="space-y-6">
      <Button
        variant="link"
        onClick={() => navigate({ to: '/subscriptions' })}
        className="pl-0 text-gray-500"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Paket Langganan
      </Button>

      <EditPlanDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEditSubmit}
        isPending={updatePlanMutation.isPending}
        form={form}
      />

      <SetTenantSubscriptionDialog
        open={!!setSubscriptionTenant}
        onOpenChange={(open) => !open && setSetSubscriptionTenant(null)}
        planId={planId}
        planName={plan.name}
        billingCycles={sortedBillingCycles}
        tenantName={setSubscriptionTenant?.nama || ''}
        tenantSlug={setSubscriptionTenant?.slug || ''}
        existingSubscriptionId={setSubscriptionTenant?.subscriptionId}
        existingSubscriptionStatus={setSubscriptionTenant?.subscriptionStatus}
      />

      <Dialog open={tenantSelectorOpen} onOpenChange={setTenantSelectorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Tenant</DialogTitle>
            <DialogDescription>Choose a tenant to assign this subscription plan.</DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {allTenantsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              (() => {
                const subscribedTenantIds = new Set(
                  tenantsWithActiveSubscriptions?.map((t) => t.tenant.id) || []
                );
                const availableTenants =
                  allTenantsData?.filter((tenant) => !subscribedTenantIds.has(tenant.id)) || [];
                return availableTenants.length > 0 ? (
                  availableTenants.map((tenant) => (
                    <button
                      key={tenant.id}
                      onClick={() => {
                        setSetSubscriptionTenant({
                          id: tenant.id,
                          nama: tenant.nama,
                          slug: tenant.slug,
                          subscriptionId: null,
                          subscriptionStatus: undefined,
                        });
                        setTenantSelectorOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{tenant.nama}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          Slug: {tenant.slug}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No tenants available</p>
                  </div>
                );
              })()
            )}
          </div>
        </DialogContent>
      </Dialog>

      <DeletePlanDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        plan={plan}
        onConfirm={() => deletePlanMutation.mutate()}
        isPending={deletePlanMutation.isPending}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                {plan.isActive ? (
                  <Badge className="bg-blue-500 text-white">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditDialogOpen(true)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm text-gray-500 mb-3">Billing Cycles</p>
              <Tabs
                value={selectedBillingCycle || sortedBillingCycles[0]?.cycle}
                onValueChange={setSelectedBillingCycle}
                className="w-full"
              >
                <TabsList variant="line" className="mb-4">
                  {sortedBillingCycles.map((bc) => (
                    <TabsTrigger key={bc.cycle} value={bc.cycle} className="capitalize">
                      {getBillingCycleLabel(bc.cycle)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {sortedBillingCycles.map((bc) => (
                  <TabsContent key={bc.cycle} value={bc.cycle} className="mt-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-blue-600">
                        {formatCurrency(bc.price)}
                      </span>
                      <span className="text-sm text-gray-400">
                        / {getBillingCycleLabel(bc.cycle).toLowerCase()}
                      </span>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-400">
                Created: {new Date(plan.createdAt).toLocaleDateString('id-ID')}
              </p>
              <p className="text-xs text-gray-400">
                Updated: {new Date(plan.updatedAt).toLocaleDateString('id-ID')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Separator />
        <Tabs defaultValue="tenants" className="w-full">
          <TabsList variant="line">
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="tenants" className="mt-4">
            <div className="flex justify-end mb-4">
              <Button size="sm" variant="outline" onClick={() => setTenantSelectorOpen(true)}>
                {allTenantsLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Set Subscription
              </Button>
            </div>
            {planSubscriptionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : planSubscriptionsData && planSubscriptionsData.length > 0 ? (
              <div className="space-y-2">
                {planSubscriptionsData
                  .filter((item) => item.subscription.status === 'active')
                  .map((item: TenantSubscription) => (
                    <div
                      key={item.subscription.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-medium text-sm">{item.tenant.nama}</p>
                          <p className="text-xs text-gray-500">Slug: {item.tenant.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right space-y-0.5 mr-2">
                          <p
                            className={`text-xs font-medium px-2 py-1 rounded-full inline-block ${
                              item.subscription.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : item.subscription.status === 'expired'
                                  ? 'bg-red-100 text-red-700'
                                  : item.subscription.status === 'cancelled'
                                    ? 'bg-gray-100 text-gray-700'
                                    : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {item.subscription.status.charAt(0).toUpperCase() +
                              item.subscription.status.slice(1)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Expires:{' '}
                            {new Date(item.subscription.expiresAt).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setSetSubscriptionTenant({
                              ...item.tenant,
                              subscriptionId: item.subscription.id,
                              subscriptionStatus: item.subscription.status,
                            })
                          }
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No tenants using this plan</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="flex items-center justify-between mb-4 gap-4">
              <div className="flex items-center gap-2">
                <Select
                  value={historyTenantId || 'all'}
                  onValueChange={(value) => {
                    setHistoryTenantId(value === 'all' ? undefined : value);
                    setHistoryPage(1);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tenants</SelectItem>
                    {planSubscriptionsData?.map((item) => (
                      <SelectItem key={item.tenant.id} value={item.tenant.id}>
                        {item.tenant.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={historyAction || 'all'}
                  onValueChange={(value) => {
                    setHistoryAction(
                      value === 'all' ? undefined : (value as SubscriptionHistoryAction)
                    );
                    setHistoryPage(1);
                  }}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="subscribed">Subscribed</SelectItem>
                    <SelectItem value="renewed">Renewed</SelectItem>
                    <SelectItem value="changed">Changed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {historyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : historyData?.data && historyData.data.length > 0 ? (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                          Tenant
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                          Aksi
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                          Paket
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                          Billing Cycle
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                          Jumlah
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                          Periode
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                          Tanggal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {historyData.data.map((item: SubscriptionHistory) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium">{item.tenantName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs font-medium px-2 py-1 rounded-full ${
                                item.action === 'subscribed'
                                  ? 'bg-green-100 text-green-700'
                                  : item.action === 'renewed'
                                    ? 'bg-blue-100 text-blue-700'
                                    : item.action === 'changed'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {item.action.charAt(0).toUpperCase() + item.action.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">{item.planName}</td>
                          <td className="px-4 py-3 text-sm">
                            {formatBillingCycleLabel(item.billingCycle)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {item.amountPaid ? formatCurrency(item.amountPaid) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {new Date(item.periodStart).toLocaleDateString('id-ID')} -{' '}
                            {new Date(item.periodEnd).toLocaleDateString('id-ID')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {historyData.meta.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500">
                      Page {historyData.meta.page} of {historyData.meta.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                        disabled={historyPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setHistoryPage((p) => p + 1)}
                        disabled={historyPage >= historyData.meta.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">No subscription history found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
