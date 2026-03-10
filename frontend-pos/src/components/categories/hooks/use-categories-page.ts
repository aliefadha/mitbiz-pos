import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  type Category,
  type CreateCategoryDto,
  categoriesApi,
  type UpdateCategoryDto,
} from '@/lib/api/categories';
import { useSession } from '@/lib/auth-client';

const formSchema = z.object({
  nama: z.string().min(1, 'Nama kategori wajib diisi'),
  deskripsi: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CategoryFormValues = z.infer<typeof formSchema>;

export function useCategoriesPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId;

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: '',
      deskripsi: '',
      isActive: true,
    },
  });

  const resetFormForCreate = () => {
    form.reset({
      nama: '',
      deskripsi: '',
      isActive: true,
    });
  };

  const resetFormForEdit = (category: Category) => {
    form.reset({
      nama: category.nama,
      deskripsi: category.deskripsi || '',
      isActive: category.isActive,
    });
  };

  const { data, isLoading } = useQuery({
    queryKey: ['categories', tenantId],
    queryFn: () => categoriesApi.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCategoryDto) => categoriesApi.create(data),
    onSuccess: () => {
      toast.success('Kategori berhasil dibuat');
      setCreateModalOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membuat kategori');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryDto }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      toast.success('Kategori berhasil diupdate');
      setCreateModalOpen(false);
      setEditingCategory(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengupdate kategori');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      toast.success('Kategori berhasil dihapus');
      setDeleteModalOpen(false);
      setDeletingCategory(null);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menghapus kategori');
    },
  });

  const allCategories = useMemo(() => data?.data ?? [], [data]);
  const totalCategories = data?.data?.length ?? 0;
  const categoryAktif = useMemo(() => data?.data?.filter((c) => c.isActive).length ?? 0, [data]);
  const categoryNonaktif = useMemo(
    () => data?.data?.filter((c) => !c.isActive).length ?? 0,
    [data]
  );

  const filteredCategories = useMemo(
    () =>
      allCategories.filter(
        (category) =>
          category.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (category.deskripsi?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      ),
    [allCategories, searchQuery]
  );

  const totalFiltered = filteredCategories.length;
  const totalPages = Math.ceil(totalFiltered / pageSize);
  const displayedCategories = filteredCategories.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleCreate = () => {
    setEditingCategory(null);
    resetFormForCreate();
    setCreateModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    resetFormForEdit(category);
    setCreateModalOpen(true);
  };

  const handleDelete = (category: Category) => {
    setDeletingCategory(category);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (deletingCategory) {
      deleteMutation.mutate(deletingCategory.id);
    }
  };

  const onSubmit = (values: CategoryFormValues) => {
    if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory.id,
        data: values,
      });
    } else {
      createMutation.mutate({
        ...values,
        tenantId: tenantId!,
      } as CreateCategoryDto);
    }
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
    searchQuery,
    createModalOpen,
    setCreateModalOpen,
    editingCategory,
    deleteModalOpen,
    setDeleteModalOpen,
    deletingCategory,
    currentPage,
    pageSize,
    tenantId,

    form,
    onSubmit,

    isLoading,
    displayedCategories,
    totalCategories,
    categoryAktif,
    categoryNonaktif,
    totalPages,
    total: totalFiltered,

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
  };
}
