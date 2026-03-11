import { createFileRoute, redirect } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import {
  CreatePaymentMethodDialog,
  DeletePaymentMethodDialog,
} from '@/components/payment-methods/dialogs';
import { usePaymentMethodsPage } from '@/components/payment-methods/hooks/use-payment-methods-page';
import { PaymentMethodList } from '@/components/payment-methods/payment-method-list';
import { PaymentMethodStats } from '@/components/payment-methods/payment-method-stats';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/use-auth';
import { checkPermission } from '@/lib/permissions';

export function PaymentMethodPage() {
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission('paymentMethods', 'create');
  const canUpdate = hasPermission('paymentMethods', 'update');
  const canDelete = hasPermission('paymentMethods', 'delete');

  const {
    searchQuery,
    createModalOpen,
    setCreateModalOpen,
    editingPaymentMethod,
    deleteModalOpen,
    setDeleteModalOpen,
    deletingPaymentMethod,
    currentPage,
    pageSize,
    form,
    onSubmit,
    isLoading,
    displayedPaymentMethods,
    totalPaymentMethods,
    paymentMethodAktif,
    paymentMethodNonaktif,
    totalPages,
    total,
    createMutation,
    updateMutation,
    deleteMutation,
    handleCreate,
    handleEdit,
    handleDelete,
    confirmDelete,
    handlePageChange,
    handlePageSizeChange,
    handleSearchChange,
  } = usePaymentMethodsPage();

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="text-lg font-semibold m-0">Manajemen Metode Pembayaran</h4>
          <p className="text-sm text-gray-500 m-0">Kelola metode pembayaran yang tersedia</p>
        </div>
        {canCreate && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Metode Pembayaran
          </Button>
        )}
      </div>

      <PaymentMethodStats
        totalPaymentMethods={totalPaymentMethods}
        paymentMethodAktif={paymentMethodAktif}
        paymentMethodNonaktif={paymentMethodNonaktif}
      />

      <PaymentMethodList
        displayedPaymentMethods={displayedPaymentMethods}
        isLoading={isLoading}
        canUpdate={canUpdate}
        canDelete={canDelete}
        currentPage={currentPage}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CreatePaymentMethodDialog
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        editingPaymentMethod={editingPaymentMethod}
        onSubmit={onSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
        form={form}
      />

      <DeletePaymentMethodDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        paymentMethod={deletingPaymentMethod}
        onConfirm={confirmDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}

export const Route = createFileRoute('/_protected/payment-methods/')({
  component: PaymentMethodPage,
  beforeLoad: async () => {
    const { allowed } = await checkPermission('paymentMethods', 'read');
    if (!allowed) {
      throw redirect({ to: '/403' });
    }
  },
});
