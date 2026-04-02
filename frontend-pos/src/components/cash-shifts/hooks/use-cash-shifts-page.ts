import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  type CashShift,
  type CreateCashShiftDto,
  cashShiftsApi,
  type UpdateCashShiftDto,
} from '@/lib/api/cash-shifts';
import { outletsApi } from '@/lib/api/outlets';
import { useSessionWithCache } from '@/lib/session-cache';

export const openShiftSchema = z.object({
  outletId: z.string().min(1, 'Outlet wajib dipilih'),
  cashierId: z.string().optional(),
  jumlahBuka: z.string().optional(),
  catatan: z.string().optional(),
});

export const closeShiftSchema = z.object({
  jumlahTutup: z.string().min(1, 'Jumlah tutup wajib diisi'),
  catatan: z.string().optional(),
});

export type OpenShiftFormValues = z.infer<typeof openShiftSchema>;
export type CloseShiftFormValues = z.infer<typeof closeShiftSchema>;

export function useCashShiftsPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSessionWithCache();
  const tenantId = session?.user?.tenantId;
  const userId = session?.user?.id;
  const userOutletId = session?.user?.outletId;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<CashShift | null>(null);

  const openForm = useForm<OpenShiftFormValues>({
    resolver: zodResolver(openShiftSchema),
    defaultValues: {
      outletId: '',
      cashierId: undefined,
      jumlahBuka: '0',
      catatan: '',
    },
  });

  const closeForm = useForm<CloseShiftFormValues>({
    resolver: zodResolver(closeShiftSchema),
    defaultValues: {
      jumlahTutup: '0',
      catatan: '',
    },
  });

  const { data: outletsData } = useQuery({
    queryKey: ['outlets', tenantId],
    queryFn: () => outletsApi.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  const { data: usersData } = useQuery({
    queryKey: ['cashiers', tenantId],
    queryFn: async () => {
      const users = await cashShiftsApi.getCashiers();
      return { users, total: users.length };
    },
    enabled: !!tenantId,
  });

  const { data: cashiersShiftStatus, isLoading: openShiftsLoading } = useQuery({
    queryKey: ['cashiers-status', tenantId],
    queryFn: async () => {
      if (!usersData?.users?.length) return [];
      return cashShiftsApi.getCashiersStatus(usersData.users.map((u) => u.id));
    },
    enabled: !!tenantId && !!usersData?.users?.length,
  });

  const allOpenShifts = useMemo(() => {
    if (!cashiersShiftStatus) return [];
    return cashiersShiftStatus.map(
      (status): CashShift => ({
        id: status.id,
        tenantId: '',
        cashierId: status.cashierId,
        outletId: status.outletId,
        jumlahBuka: status.jumlahBuka,
        jumlahTutup: '0',
        jumlahExpected: '0',
        selisih: '0',
        status: status.status,
        openedAt: status.openedAt,
        closedAt: null,
        catatan: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        outlet: {
          id: status.outletId,
          nama: status.outletName || '',
          alamat: null,
          isActive: true,
        },
      })
    );
  }, [cashiersShiftStatus]);
  const userOpenShiftData = useMemo(
    () => allOpenShifts.find((shift) => shift.cashierId === userId) || null,
    [allOpenShifts, userId]
  );
  const userOpenShiftLoading = openShiftsLoading;

  const { data: cashShiftsData, isLoading: cashShiftsLoading } = useQuery({
    queryKey: ['cash-shifts', tenantId, statusFilter, searchQuery, currentPage, pageSize],
    queryFn: () =>
      cashShiftsApi.getAll({
        tenantId,
        status: statusFilter !== 'all' ? (statusFilter as 'buka' | 'tutup') : undefined,
        search: searchQuery || undefined,
        page: currentPage,
        limit: pageSize,
      }),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCashShiftDto) => cashShiftsApi.create(data),
    onSuccess: () => {
      toast.success('Shift berhasil dibuka');
      setCreateModalOpen(false);
      openForm.reset();
      queryClient.invalidateQueries({ queryKey: ['cash-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['cashiers-status', tenantId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membuka shift');
    },
  });

  const closeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCashShiftDto }) =>
      cashShiftsApi.update(id, data),
    onSuccess: () => {
      toast.success('Shift berhasil ditutup');
      setCloseModalOpen(false);
      setSelectedShift(null);
      closeForm.reset();
      queryClient.invalidateQueries({ queryKey: ['cash-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['cashiers-status', tenantId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menutup shift');
    },
  });

  const displayedShifts = useMemo(() => cashShiftsData?.data ?? [], [cashShiftsData]);

  const totalShifts = cashShiftsData?.meta?.total ?? 0;
  const totalPages = cashShiftsData?.meta?.totalPages ?? 0;
  const totalFiltered = totalShifts;

  // For stats, we count from the current page data (approximate) or use meta
  const openShifts = useMemo(
    () => displayedShifts.filter((s) => s.status === 'buka').length,
    [displayedShifts]
  );
  const closedShifts = useMemo(
    () => displayedShifts.filter((s) => s.status === 'tutup').length,
    [displayedShifts]
  );

  const handleOpenShift = (values: OpenShiftFormValues) => {
    if (!tenantId || !values.outletId) {
      toast.error('Silakan pilih outlet terlebih dahulu');
      return;
    }
    createMutation.mutate({
      tenantId: tenantId,
      outletId: values.outletId,
      cashierId: values.cashierId ?? userId ?? undefined,
      jumlahBuka: values.jumlahBuka || '0',
      status: 'buka',
      catatan: values.catatan || null,
    });
  };

  const handleCloseShift = (values: CloseShiftFormValues) => {
    if (!selectedShift) return;
    closeMutation.mutate({
      id: selectedShift.id,
      data: {
        jumlahTutup: values.jumlahTutup,
        status: 'tutup',
        catatan: values.catatan || null,
      },
    });
  };

  const handleOpen = () => {
    openForm.reset({ outletId: '', cashierId: userId || undefined, jumlahBuka: '0', catatan: '' });
    setCreateModalOpen(true);
  };

  const handleClose = () => {
    if (userOpenShiftData) {
      setSelectedShift(userOpenShiftData);
      closeForm.reset({ jumlahTutup: '', catatan: '' });
      setCloseModalOpen(true);
    }
  };

  const handleSelectShiftForClose = (shift: CashShift) => {
    setSelectedShift(shift);
    closeForm.reset({ jumlahTutup: '', catatan: '' });
    setCloseModalOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  return {
    tenantId,
    userId,
    userOutletId,

    searchQuery,
    setSearchQuery: handleSearchChange,
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
    setSelectedShift,

    openForm,
    closeForm,
    outletsData,
    usersData,

    isLoading: cashShiftsLoading,
    userOpenShiftLoading,
    displayedShifts,
    totalShifts,
    openShifts,
    closedShifts,
    totalPages,
    total: totalFiltered,
    userOpenShiftData,
    allOpenShifts,
    cashiersShiftStatus,

    createMutation,
    closeMutation,

    handleOpenShift,
    handleCloseShift,
    handleOpen,
    handleClose,
    handleSelectShiftForClose,
    handlePageChange,
    handlePageSizeChange,
  };
}
