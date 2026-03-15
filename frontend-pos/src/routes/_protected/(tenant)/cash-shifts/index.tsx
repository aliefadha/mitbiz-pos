import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { AvailableCashiers } from '@/components/cash-shifts/available-cashiers';
import { CashShiftList } from '@/components/cash-shifts/cash-shift-list';
import { CashShiftStats } from '@/components/cash-shifts/cash-shift-stats';
import { CloseShiftDialog, OpenShiftDialog } from '@/components/cash-shifts/dialogs';
import { useCashShiftsPage } from '@/components/cash-shifts/hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/use-auth';

export function CashShiftPage() {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('cashShifts', 'create');
  const canUpdate = hasPermission('cashShifts', 'update');

  const [selectedCashier, setSelectedCashier] = useState<{
    id: string;
    name: string;
    outletId?: string | null;
  } | null>(null);

  const {
    userOutletId,
    searchQuery,
    setSearchQuery,
    currentPage,
    pageSize,
    totalFiltered,
    createModalOpen,
    setCreateModalOpen,
    closeModalOpen,
    setCloseModalOpen,
    selectedShift,
    openForm,
    closeForm,
    outletsData,
    usersData,
    isLoading,
    userOpenShiftLoading,
    displayedShifts,
    totalShifts,
    openShifts,
    totalPages,
    total,
    allOpenShifts,
    createMutation,
    closeMutation,
    handleOpenShift,
    handleCloseShift,
    handleSelectShiftForClose,
    handlePageChange,
    handlePageSizeChange,
  } = useCashShiftsPage();

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-40" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const handleOpenShiftForCashier = (cashierId: string) => {
    const cashier = usersData?.users?.find((u) => u.id === cashierId);
    if (!cashier) return;

    setSelectedCashier({
      id: cashier.id,
      name: cashier.name,
      outletId: cashier.outletId,
    });

    openForm.reset({
      outletId: cashier.outletId || '',
      cashierId: cashierId,
      jumlahBuka: '0',
      catatan: '',
    });
    setCreateModalOpen(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h4 className="text-xl font-bold text-gray-900 m-0">Manajemen Shift Kasir</h4>
        <p className="text-sm text-gray-500 m-0 mt-1">Kelola shift kasir di cabang Anda</p>
      </div>

      {/* Stats Cards */}
      <CashShiftStats totalShifts={totalShifts} openShifts={openShifts} />

      {/* Available Cashiers */}
      <AvailableCashiers
        users={usersData?.users ?? []}
        openShifts={allOpenShifts}
        isLoading={userOpenShiftLoading}
        canCreate={canCreate}
        canUpdate={canUpdate}
        onOpenShift={handleOpenShiftForCashier}
        onCloseShift={handleSelectShiftForClose}
      />

      {/* Shift History Table */}
      <CashShiftList
        displayedShifts={displayedShifts}
        isLoading={isLoading}
        canRead={true}
        currentPage={currentPage}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        userOutletId={userOutletId}
      />

      {totalPages > 0 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Menampilkan {displayedShifts.length} dari {totalFiltered} shift
          </p>
        </div>
      )}

      {canCreate && (
        <OpenShiftDialog
          open={createModalOpen}
          onOpenChange={(open) => {
            setCreateModalOpen(open);
            if (!open) setSelectedCashier(null);
          }}
          outlets={outletsData?.data ?? []}
          cashierName={selectedCashier?.name ?? ''}
          cashierOutletId={selectedCashier?.outletId}
          onSubmit={handleOpenShift}
          isPending={createMutation.isPending}
          form={openForm}
        />
      )}

      {canUpdate && (
        <CloseShiftDialog
          open={closeModalOpen}
          onOpenChange={setCloseModalOpen}
          shift={selectedShift}
          onSubmit={handleCloseShift}
          isPending={closeMutation.isPending}
          form={closeForm}
        />
      )}
    </div>
  );
}

export const Route = createFileRoute('/_protected/(tenant)/cash-shifts/')({
  component: CashShiftPage,
});
