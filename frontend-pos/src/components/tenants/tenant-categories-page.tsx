import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { tenantsApi } from '@/lib/api/tenants';

const formSchema = z.object({
  nama: z.string().min(1, 'Nama kategori wajib diisi'),
  deskripsi: z.string().optional(),
});

export function TenantCategoriesPage() {
  const { slug } = useParams({ from: '/_protected/tenants/$slug/categories/' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchText, setSearchText] = useState('');
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: '',
      deskripsi: '',
    },
  });

  const { data: tenant } = useQuery({
    queryKey: ['tenant', slug],
    queryFn: () => tenantsApi.getBySlug(slug),
  });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', tenant?.id],
    queryFn: () => categoriesApi.getAll({ tenantId: tenant!.id }),
    enabled: !!tenant?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCategoryDto) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', tenant?.id] });
      setIsModalOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryDto }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', tenant?.id] });
      setIsModalOpen(false);
      setEditingCategory(null);
      form.reset();
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: categoriesApi.toggleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', tenant?.id] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', tenant?.id] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const handleCreate = () => {
    setEditingCategory(null);
    form.reset();
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.reset({
      nama: category.nama,
      deskripsi: category.deskripsi || '',
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = (category: Category) => {
    toggleStatusMutation.mutate(category.id);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleModalOk = () => {
    form.handleSubmit((values) => {
      if (editingCategory) {
        updateMutation.mutate({
          id: editingCategory.id,
          data: values,
        });
      } else {
        createMutation.mutate({
          ...values,
          tenantId: tenant!.id,
        } as CreateCategoryDto);
      }
    })();
  };

  const filteredCategories = categories?.data?.filter(
    (cat: Category) =>
      cat.nama.toLowerCase().includes(searchText.toLowerCase()) ||
      cat.deskripsi?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <Button
        variant="link"
        onClick={() => navigate({ to: '/tenants/$slug', params: { slug } })}
        className="mb-4 pl-0"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to {tenant?.nama || 'Tenant'}
      </Button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="text-lg font-semibold m-0">Categories</h4>
          <p className="text-sm text-gray-500 m-0">Manage categories for {tenant?.nama}</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search categories..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="max-w-[300px]"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">No.</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Jumlah Produk</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories?.map((category, index) => (
              <TableRow key={category.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium">{category.nama}</TableCell>
                <TableCell>{category.deskripsi || '-'}</TableCell>
                <TableCell>{category.productsCount || 0}</TableCell>
                <TableCell>
                  <Switch
                    checked={category.isActive}
                    onCheckedChange={() => handleToggleStatus(category)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleModalOk();
              }}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input placeholder="Category name" {...field} />
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
                      <Textarea placeholder="Category description (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingCategory ? 'Save' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
