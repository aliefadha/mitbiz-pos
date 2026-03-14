import { createFileRoute } from '@tanstack/react-router';
import { Plus, Search, X } from 'lucide-react';
import { CashShiftList } from '@/components/cash-shifts/cash-shift-list';
import { CashShiftStats } from '@/components/cash-shifts/cash-shift-stats';
import { CloseShiftDialog, OpenShiftDialog } from '@/components/cash-shifts/dialogs';
import { useCashShiftsPage } from '@/components/cash-shifts/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
    statusFilter,
    setStatusFilter,
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
    closedShifts,
    totalPages,
    total,
    userOpenShiftData,
    createMutation,
    closeMutation,
    handleOpenShift,
    handleCloseShift,
    handleOpen,
    handleClose,
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
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="text-lg font-semibold m-0">Shift Kasir</h4>
          <p className="text-sm text-gray-500 m-0">Kelola shift kasir</p>
        </div>
        {!userOpenShiftLoading && canCreate && (
          <>
            {userOpenShiftData && canUpdate ? (
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={handleClose}
              >
                <X className="h-4 w-4 mr-2" />
                Tutup Shift
              </Button>
            ) : (
              <Button onClick={handleOpen}>
                <Plus className="h-4 w-4 mr-2" />
                Buka Shift
              </Button>
            )}
          </>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari shift..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="buka">Buka</SelectItem>
            <SelectItem value="tutup">Tutup</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CashShiftStats
        totalShifts={totalShifts}
        openShifts={openShifts}
        closedShifts={closedShifts}
      />

      <CashShiftList
        displayedShifts={displayedShifts}
        isLoading={isLoading}
        canUpdate={canUpdate}
        canRead={true}
        currentPage={currentPage}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onCloseShift={handleSelectShiftForClose}
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
