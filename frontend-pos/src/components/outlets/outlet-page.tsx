import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { outletsApi, type Outlet } from "@/lib/api/outlets";
import { useTenant } from "@/contexts/tenant-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
import { Link } from "@tanstack/react-router";
import { Plus, Pencil, Trash2, Store } from "lucide-react";

const formSchema = z.object({
  nama: z.string().min(1, "Nama outlet wajib diisi"),
  kode: z.string().min(1, "Kode outlet wajib diisi"),
  alamat: z.string().optional(),
  noHp: z.string().optional(),
  isActive: z.boolean().optional(),
});

export function OutletPage() {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: "",
      kode: "",
      alamat: "",
      noHp: "",
      isActive: true,
    },
  });

  const {
    selectedTenant,
  } = useTenant();

  const effectiveTenantId = selectedTenant?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["outlets", effectiveTenantId],
    queryFn: () => outletsApi.getAll({ tenantId: effectiveTenantId }),
    enabled: !!effectiveTenantId,
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      tenantId: string;
      nama: string;
      kode: string;
      alamat?: string;
      noHp?: string;
      isActive?: boolean;
    }) => outletsApi.create(data),
    onSuccess: () => {
      setCreateModalOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["outlets"] });
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to create outlet");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof formSchema> }) =>
      outletsApi.update(id, data),
    onSuccess: () => {
      setCreateModalOpen(false);
      setEditingOutlet(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["outlets"] });
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to update outlet");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => outletsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outlets"] });
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to delete outlet");
    },
  });

  const handleCreate = () => {
    setEditingOutlet(null);
    form.reset({
      nama: "",
      kode: "",
      alamat: "",
      noHp: "",
      isActive: true,
    });
    setCreateModalOpen(true);
  };

  const handleEdit = (outlet: Outlet) => {
    setEditingOutlet(outlet);
    form.reset({
      nama: outlet.nama,
      kode: outlet.kode,
      alamat: outlet.alamat || "",
      noHp: outlet.noHp || "",
      isActive: outlet.isActive,
    });
    setCreateModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus outlet ini? Tindakan ini tidak dapat dibatalkan.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = form.handleSubmit((values) => {
    if (editingOutlet) {
      updateMutation.mutate({
        id: editingOutlet.id,
        data: values,
      });
    } else {
      createMutation.mutate({
        ...values,
        tenantId: effectiveTenantId!,
      });
    }
  });

  const displayedOutlets = data?.data ?? [];

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
            <h4 className="text-lg font-semibold m-0">Outlet</h4>
            <p className="text-sm text-gray-500 m-0">
              Kelola semua outlet dalam sistem
            </p>
          </div>
          <div className="flex gap-2">
            <DialogTrigger asChild>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Outlet
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
        ) : displayedOutlets.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Store className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Belum ada outlet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">No</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead>No. HP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedOutlets.map((outlet, index) => (
                <TableRow key={outlet.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {outlet.kode}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      to="/outlets/$outletId"
                      params={{ outletId: outlet.id }}
                      className="hover:underline font-medium"
                    >
                      {outlet.nama}
                    </Link>
                  </TableCell>
                  <TableCell>{outlet.alamat || "-"}</TableCell>
                  <TableCell>{outlet.noHp || "-"}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getStatusColor(!!outlet.isActive)}`}
                    >
                      {outlet.isActive ? "Aktif" : "Tidak Aktif"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(outlet)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(outlet.id)}>
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
              {editingOutlet ? "Edit Outlet" : "Tambah Outlet"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="kode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode Outlet</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan kode outlet" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Outlet</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama outlet" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="alamat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Masukkan alamat (opsional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="noHp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. HP</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nomor HP (opsional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {editingOutlet && (
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
                  {editingOutlet ? "Simpan" : "Buat"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </div>
    </Dialog>
  );
}
