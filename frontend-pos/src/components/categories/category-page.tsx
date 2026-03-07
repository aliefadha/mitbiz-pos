import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
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

export function CategoryPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: '',
      deskripsi: '',
      isActive: true,
    },
  });
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId;

  const { data, isLoading } = useQuery({
    queryKey: ['categories', tenantId],
    queryFn: () => categoriesApi.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCategoryDto) => categoriesApi.create(data),
    onSuccess: () => {
      setCreateModalOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to create category');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryDto }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      setCreateModalOpen(false);
      setEditingCategory(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to update category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to delete category');
    },
  });

  const handleCreate = () => {
    setEditingCategory(null);
    form.reset({
      nama: '',
      deskripsi: '',
      isActive: true,
    });
    setCreateModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.reset({
      nama: category.nama,
      deskripsi: category.deskripsi || '',
      isActive: category.isActive,
    });
    setCreateModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (
      confirm(
        'Apakah Anda yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan.'
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = form.handleSubmit((values) => {
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
  });

  const filteredCategories =
    data?.data?.filter(
      (category) =>
        category.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (category.deskripsi?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    ) ?? [];

  const totalCategories = filteredCategories.length;
  const totalPages = Math.ceil(totalCategories / pageSize);
  const displayedCategories = filteredCategories.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
  };

  return (
    <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-lg font-semibold m-0">Manajemen Kategori </h4>
            <p className="text-sm text-gray-500 m-0">Kelola kategori produk </p>
          </div>
          <div className="flex gap-2">
            <DialogTrigger asChild>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Kategori
              </Button>
            </DialogTrigger>
          </div>
        </div>

        <Card>
          <CardContent>
            <h4 className="text-base font-semibold mb-6">Daftar Kategori</h4>
            <div className="mb-6 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari kategori..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 w-full"
                />
              </div>
            </div>
            {isLoading ? (
              <div className="p-6 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader className="[&_tr]:border-b-0">
                  <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-0">
                    <TableHead className="text-gray-800 font-medium w-[80px] rounded-tl-lg rounded-bl-lg">
                      No
                    </TableHead>
                    <TableHead className="text-gray-800 font-medium">Nama</TableHead>
                    <TableHead className="text-gray-800 font-medium">Jumlah Produk</TableHead>
                    <TableHead className="text-gray-800 font-medium">Status</TableHead>
                    <TableHead className="text-gray-800 font-medium w-[120px] rounded-tr-lg rounded-br-lg">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedCategories.map((category, index) => (
                    <TableRow key={category.id} className="hover:bg-white">
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <button
                          onClick={() =>
                            navigate({
                              to: '/categories/$categoryId',
                              params: { categoryId: String(category.id) },
                            })
                          }
                          className="flex items-center gap-2 hover:underline text-left"
                        >
                          {category.nama}
                        </button>
                      </TableCell>
                      <TableCell>{category.productsCount || 0}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${getStatusColor(!!category.isActive)}`}
                        >
                          {category.isActive ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(category.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {totalPages > 0 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Menampilkan {(currentPage - 1) * pageSize + 1} -{' '}
                    {Math.min(currentPage * pageSize, totalCategories)} dari {totalCategories}{' '}
                    kategori
                  </span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(parseInt(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {(() => {
                      const pages: (number | string)[] = [];

                      if (totalPages <= 5) {
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        pages.push(1);

                        if (currentPage <= 3) {
                          pages.push(2, 3, '...');
                        } else if (currentPage >= totalPages - 2) {
                          pages.push('...', totalPages - 2, totalPages - 1);
                        } else {
                          pages.push('...', currentPage, '...');
                        }

                        pages.push(totalPages);
                      }

                      return pages.map((page, index) =>
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-2 text-sm text-gray-500">
                            ...
                          </span>
                        ) : (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(page as number)}
                            className="w-9"
                          >
                            {page}
                          </Button>
                        )
                      );
                    })()}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Kategori</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama kategori" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deskripsi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Masukkan deskripsi (opsional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {editingCategory && (
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Status Aktif</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending || !tenantId}
                >
                  {editingCategory ? 'Simpan' : 'Buat'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </div>
    </Dialog>
  );
}
