import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { CheckCircle2, Package, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DeletePlanDialog } from '@/components/subscriptions/dialogs/delete-plan-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { type SubscriptionPlan, subscriptionPlansApi } from '@/lib/api/subscriptions';

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
    case 'yearly':
      return 'Year';
    default:
      return cycle;
  }
}

export function SubscriptionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<SubscriptionPlan | null>(null);

  const { data: plansData, isLoading } = useQuery({
    queryKey: [
      'subscription-plans',
      { billingCycle: selectedBillingCycle, isActive: selectedStatus },
    ],
    queryFn: async () => {
      const params: any = {};
      if (selectedBillingCycle !== 'all') {
        params.billingCycle = selectedBillingCycle;
      }
      if (selectedStatus !== 'all') {
        params.isActive = selectedStatus === 'aktif';
      }
      return subscriptionPlansApi.getAll(params);
    },
  });

  const filteredPlans = useMemo(() => {
    if (!plansData?.data) return [];

    let plans = plansData.data;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      plans = plans.filter((p) => p.name.toLowerCase().includes(query));
    }

    return plans;
  }, [plansData, searchQuery]);

  const deletePlanMutation = useMutation({
    mutationFn: () => subscriptionPlansApi.delete(deletingPlan!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      setDeleteDialogOpen(false);
      setDeletingPlan(null);
      toast.success('Plan deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete plan');
    },
  });

  const handleDelete = (plan: SubscriptionPlan) => {
    setDeletingPlan(plan);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen Langganan</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola paket langganan </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari paket..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={selectedBillingCycle} onValueChange={setSelectedBillingCycle}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Semua Durasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Durasi</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Semua" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="aktif">Aktif</SelectItem>
            <SelectItem value="nonaktif">Nonaktif</SelectItem>
          </SelectContent>
        </Select>

        <Button
          className="gap-2 whitespace-nowrap"
          onClick={() => navigate({ to: '/subscriptions/new' })}
        >
          <Plus className="h-4 w-4" />
          Tambah Paket
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="py-5">
              <CardContent className="space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPlans.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center text-gray-400">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium text-gray-500">Tidak ada paket ditemukan</p>
            <p className="text-sm">Coba ubah filter atau tambah paket baru</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onClick={() =>
                navigate({ to: '/subscriptions/$planId', params: { planId: plan.id } })
              }
              onDelete={() => handleDelete(plan)}
            />
          ))}
        </div>
      )}
      <DeletePlanDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        plan={deletingPlan}
        onConfirm={() => deletePlanMutation.mutate()}
        isPending={deletePlanMutation.isPending}
      />
    </div>
  );
}

function PlanCard({
  plan,
  onClick,
  onDelete,
}: {
  plan: SubscriptionPlan;
  onClick?: () => void;
  onDelete?: () => void;
}) {
  return (
    <Card
      className="flex flex-col justify-between py-5 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
          </div>
          {plan.isActive && (
            <Badge className="bg-blue-500 text-white hover:bg-blue-600 text-xs font-medium px-2.5 py-0.5 shrink-0">
              Aktif
            </Badge>
          )}
        </div>

        <div>
          <span className="text-2xl font-bold text-blue-500">{formatCurrency(plan.price)}</span>
          <span className="text-sm text-gray-400 ml-1">
            /{getBillingCycleLabel(plan.billingCycle)}
          </span>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Pro Features:</p>
          <ul className="space-y-1.5">
            {plan.planProFeatures && plan.planProFeatures.length > 0 ? (
              plan.planProFeatures.slice(0, 3).map((pf) => (
                <li key={pf.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                  {pf.proFeature.name}
                </li>
              ))
            ) : (
              <li className="text-sm text-gray-400 italic">No pro features linked</li>
            )}
            {plan.planProFeatures && plan.planProFeatures.length > 3 && (
              <li className="text-sm text-gray-500 italic">
                +{plan.planProFeatures.length - 3} more
              </li>
            )}
          </ul>
        </div>
      </CardContent>

      <div className="px-6">
        <div className="border-t border-gray-200 my-2" />
      </div>

      <div className="px-6 flex items-center gap-2">
        <Button variant="outline" className="flex-1 gap-2 text-gray-700">
          Detail
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="text-red-500 hover:text-red-700 hover:bg-red-50 hover:border-red-200 shrink-0"
          title="Hapus paket"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
