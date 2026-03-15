import { createFileRoute } from '@tanstack/react-router';
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

  const {
    userId,
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
    // Pre-fill the form with the selected cashier and open the dialog
    const firstOutlet = outletsData?.data?.[0];
    openForm.reset({
      outletId: firstOutlet?.id || '',
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
        onOpenShift={handleOpenShiftForCashier}
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
          onOpenChange={setCreateModalOpen}
          outlets={outletsData?.data ?? []}
          users={usersData?.users ?? []}
          currentUserId={userId}
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
