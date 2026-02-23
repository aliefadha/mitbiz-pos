import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { productsApi, type UpdateProductDto } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { stocksApi } from "@/lib/api/stocks";
import { stockAdjustmentsApi } from "@/lib/api/stock-adjustments";
import { useSession } from "@/lib/auth-client";
import { outletsApi } from "@/lib/api/outlets";
import { useTenant } from "@/contexts/tenant-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Edit2, ShoppingCart, History, Plus, Package } from "lucide-react";
import { toast } from "sonner";

function formatRupiah(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

const editFormSchema = z.object({
  sku: z.string(),
  barcode: z.string().optional(),
  nama: z.string(),
  deskripsi: z.string().optional(),
  categoryId: z.string().optional(),
  tipe: z.enum(["barang", "jasa", "digital"]),
  hargaBeli: z.string(),
  hargaJual: z.string(),
  minStockLevel: z.number(),
  unit: z.string(),
  isActive: z.boolean(),
});

export function ProductDetailPage() {
  const { productId } = useParams({ from: "/_protected/products/$productId" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedTenant, selectedOutlet } = useTenant();
  const { data: session } = useSession();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createStockModalOpen, setCreateStockModalOpen] = useState(false);
  const [createStockOutletId, setCreateStockOutletId] = useState("");
  const [createStockQuantity, setCreateStockQuantity] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState("");

  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      sku: "",
      barcode: "",
      nama: "",
      deskripsi: "",
      categoryId: "",
      tipe: "barang",
      hargaBeli: "0",
      hargaJual: "0",
      minStockLevel: 0,
      unit: "pcs",
      isActive: true,
    },
  });

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productsApi.getById(productId),
    enabled: !!productId,
  });

  const { data: stocksData, isLoading: stocksLoading } = useQuery({
    queryKey: ["stocks", productId, selectedOutlet?.id],
    queryFn: () => stocksApi.getAll({ productId: productId, outletId: selectedOutlet?.id }),
    enabled: !!productId,
  });

  const { data: adjustmentsData, isLoading: adjustmentsLoading } = useQuery({
    queryKey: ["stock-adjustments", productId, selectedOutlet?.id],
    queryFn: () => stockAdjustmentsApi.getAll({ productId: productId, outletId: selectedOutlet?.id }),
    enabled: !!productId,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories", product?.tenantId],
    queryFn: () => categoriesApi.getAll({ tenantId: product!.tenantId }),
    enabled: !!product?.tenantId,
  });

  const { data: outletsData } = useQuery({
    queryKey: ["outlets", product?.tenantId],
    queryFn: () => outletsApi.getAll({ tenantId: product!.tenantId }),
    enabled: !!product?.tenantId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductDto }) => productsApi.update(id, data),
    onSuccess: () => {
      setEditModalOpen(false);
      editForm.reset();
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
    onError: (error: Error) => { toast.error(error.message); },
  });

  const createStockMutation = useMutation({
    mutationFn: (data: { productId: string; outletId: string; quantity: number }) => stocksApi.create(data),
    onSuccess: () => {
      setCreateStockModalOpen(false);
      setCreateStockOutletId("");
      setCreateStockQuantity(0);
      queryClient.invalidateQueries({ queryKey: ["stocks", productId, selectedOutlet?.id] });
    },
    onError: (error: Error) => { toast.error(error.message); },
  });

  const adjustStockMutation = useMutation({
    mutationFn: (data: { productId: string; outletId: string; quantity: number; alasan: string; adjustedBy: string }) => stockAdjustmentsApi.create(data),
    onSuccess: () => {
      setCreateStockModalOpen(false);
      setCreateStockQuantity(0);
      setAdjustmentReason("");
      queryClient.invalidateQueries({ queryKey: ["stocks", productId, selectedOutlet?.id] });
      queryClient.invalidateQueries({ queryKey: ["stock-adjustments", productId] });
      toast.success("Stok berhasil disesuaikan");
    },
    onError: (error: Error) => { toast.error(error.message); },
  });

  const isLoading = productLoading || stocksLoading || adjustmentsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  if (!product || (selectedTenant && product.tenantId !== selectedTenant.id)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Produk tidak ditemukan</p>
        <Button variant="link" onClick={() => navigate({ to: "/products" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      </div>
    );
  }

  const stocks = stocksData?.data || [];
  const adjustments = adjustmentsData?.data || [];
  const categories = categoriesData?.data || [];
  const outlets = outletsData?.data || [];

  const handleEdit = () => {
    editForm.reset({
      sku: product.sku,
      barcode: product.barcode || "",
      nama: product.nama,
      deskripsi: product.deskripsi || "",
      categoryId: product.categoryId?.toString() || "",
      tipe: product.tipe,
      hargaBeli: product.hargaBeli || "0",
      hargaJual: product.hargaJual || "0",
      minStockLevel: product.minStockLevel || 0,
      unit: product.unit,
      isActive: product.isActive,
    });
    setEditModalOpen(true);
  };


  const getStockColor = (quantity: number) => {
    if (quantity <= 0) return "bg-red-100 text-red-700";
    if (quantity <= product.minStockLevel) return "bg-orange-100 text-orange-700";
    return "bg-green-100 text-green-700";
  };

  const getTypeColor = (tipe: string) => {
    switch (tipe) {
      case "barang": return "bg-blue-100 text-blue-700";
      case "jasa": return "bg-purple-100 text-purple-700";
      case "digital": return "bg-cyan-100 text-cyan-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div>
      <Button variant="link" onClick={() => navigate({ to: "/products" })} className="mb-4 pl-0">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Produk
      </Button>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Detail Produk</CardTitle>
          <Button variant="outline" onClick={handleEdit}>
            <Edit2 className="mr-2 h-4 w-4" />
            Ubah
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">SKU:</span> <code className="bg-gray-100 px-2 py-1 rounded">{product.sku}</code></div>
            <div><span className="text-gray-500">Barcode:</span> {product.barcode || "-"}</div>
            <div><span className="text-gray-500">Nama:</span> {product.nama}</div>
            <div><span className="text-gray-500">Tipe:</span> <span className={`px-2 py-1 rounded text-xs capitalize ${getTypeColor(product.tipe)}`}>{product.tipe}</span></div>
            <div><span className="text-gray-500">Kategori:</span> {product.category?.nama || "-"}</div>
            <div><span className="text-gray-500">Satuan:</span> {product.unit || "-"}</div>
            <div><span className="text-gray-500">Harga Beli:</span> {product.hargaBeli ? formatRupiah(product.hargaBeli) : "-"}</div>
            <div><span className="text-gray-500">Harga Jual:</span> {formatRupiah(product.hargaJual)}</div>
            <div><span className="text-gray-500">Minimum Stok:</span> {product.minStockLevel}</div>
            <div><span className="text-gray-500">Status:</span> <span className={`px-2 py-1 rounded text-xs ${product.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{product.isActive ? "Aktif" : "Nonaktif"}</span></div>
            <div className="col-span-2"><span className="text-gray-500">Deskripsi:</span> {product.deskripsi || "-"}</div>
            <div><span className="text-gray-500">Dibuat:</span> {new Date(product.createdAt).toLocaleString("id-ID")}</div>
            <div><span className="text-gray-500">Diupdate:</span> {new Date(product.updatedAt).toLocaleString("id-ID")}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ringkasan Stok</CardTitle>
          {selectedOutlet && (
            stocks.length > 0 ? (
              <Button size="sm" onClick={() => setCreateStockModalOpen(true)}>
                <Package className="h-4 w-4 mr-2" />
                Sesuaikan Stok
              </Button>
            ) : (
              <Button size="sm" onClick={() => setCreateStockModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Stok
              </Button>
            )
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Jumlah Stok</p>
              <p className="text-2xl font-bold">
                {selectedOutlet
                  ? stocks.find(s => s.outletId === selectedOutlet.id)?.quantity ?? 0
                  : stocks.reduce((sum, s) => sum + s.quantity, 0)}
              </p>
              <p className="text-xs text-gray-400">{product.unit}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Minimum Stok</p>
              <p className="text-2xl font-bold">{product.minStockLevel}</p>
              <p className="text-xs text-gray-400">{product.unit}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {selectedOutlet ? (
            <>
              <h3 className="text-lg font-semibold mb-4">Riwayat Stok</h3>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Outlet</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Alasan</TableHead>
                  <TableHead>Oleh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adj) => (
                  <TableRow key={adj.id}>
                    <TableCell>{new Date(adj.createdAt).toLocaleString("id-ID")}</TableCell>
                    <TableCell>{adj.outlet ? `${adj.outlet.nama} (${adj.outlet.kode})` : "-"}</TableCell>
                    <TableCell><span className={adj.quantity >= 0 ? "text-green-600" : "text-red-600"}>{adj.quantity > 0 ? `+${adj.quantity}` : adj.quantity}</span></TableCell>
                    <TableCell>{adj.alasan || "-"}</TableCell>
                    <TableCell>{adj.user?.name || adj.user?.email || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </>
          ) : (
            <Tabs defaultValue="stocks">
              <TabsList>
                <TabsTrigger value="stocks" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Stok ({stocks.length})
                </TabsTrigger>
                <TabsTrigger value="adjustments" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Riwayat ({adjustments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stocks">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Outlet</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Terakhir Diupdate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stocks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                          Stok belum ada. Klik "Tambah Stok" untuk membuat.
                        </TableCell>
                      </TableRow>
                    ) : (
                      stocks.map((stock) => (
                        <TableRow key={stock.id}>
                          <TableCell>{stock.outlet ? `${stock.outlet.nama} (${stock.outlet.kode})` : "-"}</TableCell>
                          <TableCell><span className={`px-2 py-1 rounded ${getStockColor(stock.quantity)}`}>{stock.quantity}</span></TableCell>
                          <TableCell>{new Date(stock.updatedAt).toLocaleString("id-ID")}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="adjustments">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Outlet</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Alasan</TableHead>
                      <TableHead>Oleh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustments.map((adj) => (
                      <TableRow key={adj.id}>
                        <TableCell>{new Date(adj.createdAt).toLocaleString("id-ID")}</TableCell>
                        <TableCell>{adj.outlet ? `${adj.outlet.nama} (${adj.outlet.kode})` : "-"}</TableCell>
                        <TableCell><span className={adj.quantity >= 0 ? "text-green-600" : "text-red-600"}>{adj.quantity > 0 ? `+${adj.quantity}` : adj.quantity}</span></TableCell>
                        <TableCell>{adj.alasan || "-"}</TableCell>
                        <TableCell>{adj.user?.name || adj.user?.email || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader><DialogTitle>Edit Produk</DialogTitle></DialogHeader>
          <Form {...editForm}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <FormField control={editForm.control} name="sku" render={({ field }) => (<FormItem><FormLabel>SKU</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={editForm.control} name="barcode" render={({ field }) => (<FormItem><FormLabel>Barcode</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={editForm.control} name="nama" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Nama</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={editForm.control} name="categoryId" render={({ field }) => (
                <FormItem><FormLabel>Kategori</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {categories.map((cat) => <SelectItem key={cat.id} value={cat.id.toString()}>{cat.nama}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage /></FormItem>
              )} />
              <FormField control={editForm.control} name="tipe" render={({ field }) => (
                <FormItem><FormLabel>Tipe</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih tipe" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="barang">Barang</SelectItem>
                      <SelectItem value="jasa">Jasa</SelectItem>
                      <SelectItem value="digital">Digital</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage /></FormItem>
              )} />
              <FormField control={editForm.control} name="hargaBeli" render={({ field }) => (<FormItem><FormLabel>Harga Beli</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={editForm.control} name="hargaJual" render={({ field }) => (<FormItem><FormLabel>Harga Jual</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={editForm.control} name="minStockLevel" render={({ field }) => (<FormItem><FormLabel>Minimum Stok</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={editForm.control} name="unit" render={({ field }) => (<FormItem><FormLabel>Satuan</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={editForm.control} name="isActive" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <FormLabel>Status</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>
            <DialogFooter><Button type="button" onClick={editForm.handleSubmit((v) => updateMutation.mutate({ id: productId, data: { ...v, hargaBeli: v.hargaBeli || "0", hargaJual: v.hargaJual || "0", categoryId: v.categoryId ? v.categoryId : undefined } as UpdateProductDto }))} disabled={updateMutation.isPending}>Simpan</Button></DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={createStockModalOpen} onOpenChange={setCreateStockModalOpen}>
        <DialogContent className="max-[400px]">
          <DialogHeader><DialogTitle>{stocks.length > 0 ? "Sesuaikan Stok" : "Tambah Stok"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            {stocks.length === 0 && (
              <div>
                <label className="text-sm font-medium">Outlet</label>
                <Select value={createStockOutletId} onValueChange={setCreateStockOutletId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih outlet" />
                  </SelectTrigger>
                  <SelectContent>
                    {outlets.map((outlet) => (
                      <SelectItem key={outlet.id} value={outlet.id.toString()}>
                        {outlet.nama} ({outlet.kode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">
                {stocks.length > 0 ? "Jumlah Penyesuaian (negatif untuk mengurangi)" : "Jumlah"}
              </label>
              <Input
                type="number"
                value={createStockQuantity}
                onChange={(e) => setCreateStockQuantity(Number(e.target.value))}
                className="mt-1"
                placeholder={stocks.length > 0 ? "Contoh: 10 atau -5" : "Contoh: 100"}
              />
              {stocks.length > 0 && createStockQuantity !== 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Stok akan berubah dari{" "}
                  <span className="font-medium">
                    {stocks.length > 0
                      ? stocks.find(s => selectedOutlet ? s.outletId === selectedOutlet.id : true)?.quantity ?? 0
                      : 0}
                  </span>{" "}
                  menjadi{" "}
                  <span className="font-medium text-green-600">
                    {(stocks.find(s => selectedOutlet ? s.outletId === selectedOutlet.id : true)?.quantity ?? 0) + createStockQuantity}
                  </span>
                </p>
              )}
            </div>
            {stocks.length > 0 && (
              <div>
                <label className="text-sm font-medium">Alasan</label>
                <Input
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="mt-1"
                  placeholder="Contoh: Koreksi stok, barang rusak, dll"
                required
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              disabled={
                (stocks.length === 0 && (!createStockOutletId || createStockQuantity <= 0 || createStockMutation.isPending)) ||
                (stocks.length > 0 && (createStockQuantity === 0 || !adjustmentReason.trim() || !session?.user || adjustStockMutation.isPending))
              }
              onClick={() => {
                if (stocks.length === 0) {
                  createStockMutation.mutate({ productId, outletId: createStockOutletId, quantity: createStockQuantity });
                } else {
                  const outletId = selectedOutlet?.id || stocks[0]?.outletId;
                  if (outletId && session?.user) {
                    adjustStockMutation.mutate({
                      productId,
                      outletId,
                      quantity: createStockQuantity,
                      alasan: adjustmentReason,
                      adjustedBy: session.user.id
                    });
                  }
                }
              }}
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
