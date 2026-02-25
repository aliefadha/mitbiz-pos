import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { paymentMethodsApi, type PaymentMethod, type CreatePaymentMethodDto, type UpdatePaymentMethodDto } from "@/lib/api/payment-methods";
import { useSession } from "@/lib/auth-client";
import { useTenant } from "@/contexts/tenant-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2 } from "lucide-react";

const formSchema = z.object({
  nama: z.string().min(1, "Nama metode pembayaran wajib diisi"),
  isActive: z.boolean().optional(),
});

export function PaymentMethodPage() {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: "",
      isActive: true,
    },
  });
  const { data: session } = useSession();
  // @ts-ignore - role is added by custom session client
  const userRole = (session?.user?.role as string) || "cashier";
  const {
    selectedTenant: contextSelectedTenant,
  } = useTenant();

  const effectiveTenantId = contextSelectedTenant?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["payment-methods", effectiveTenantId],
    queryFn: () => paymentMethodsApi.getAll({ tenantId: effectiveTenantId }),
    enabled: !!effectiveTenantId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePaymentMethodDto) => paymentMethodsApi.create(data),
    onSuccess: () => {
      setCreateModalOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to create payment method");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePaymentMethodDto }) =>
      paymentMethodsApi.update(id, data),
    onSuccess: () => {
      setCreateModalOpen(false);
      setEditingPaymentMethod(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to update payment method");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: paymentMethodsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to delete payment method");
    },
  });

  const handleCreate = () => {
    setEditingPaymentMethod(null);
    form.reset({
      nama: "",
      isActive: true,
    });
    setCreateModalOpen(true);
  };

  const handleEdit = (paymentMethod: PaymentMethod) => {
    setEditingPaymentMethod(paymentMethod);
    form.reset({
      nama: paymentMethod.nama,
      isActive: paymentMethod.isActive,
    });
    setCreateModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus metode pembayaran ini? Tindakan ini tidak dapat dibatalkan.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = form.handleSubmit((values) => {
    if (editingPaymentMethod) {
      updateMutation.mutate({
        id: editingPaymentMethod.id,
        data: values,
      });
    } else {
      createMutation.mutate({
        ...values,
        tenantId: effectiveTenantId!,
      } as CreatePaymentMethodDto);
    }
  });

  const displayedPaymentMethods = data?.data ?? [];

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-700"
      : "bg-gray-100 text-gray-700";
  };

  return (
    <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-lg font-semibold m-0">Metode Pembayaran</h4>
            <p className="text-sm text-gray-500 m-0">
              Kelola semua metode pembayaran dalam sistem
            </p>
          </div>
          <div className="flex gap-2">
            <DialogTrigger asChild>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Metode Pembayaran
              </Button>
            </DialogTrigger>
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
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedPaymentMethods.map((paymentMethod, index) => (
                <TableRow key={paymentMethod.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell >
                    {paymentMethod.nama}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getStatusColor(!!paymentMethod.isActive)}`}
                    >
                      {paymentMethod.isActive ? "Aktif" : "Tidak Aktif"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(paymentMethod)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(paymentMethod.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPaymentMethod ? "Edit Metode Pembayaran" : "Tambah Metode Pembayaran"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Metode Pembayaran</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama metode pembayaran" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {editingPaymentMethod && (
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Status Aktif
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending || !effectiveTenantId}
                >
                  {editingPaymentMethod ? "Simpan" : "Buat"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </div>
    </Dialog>
  );
}
