import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { outletsApi } from "@/lib/api/outlets";
import { stocksApi, type Stock } from "@/lib/api/stocks";
import { productsApi, type Product } from "@/lib/api/products";
import { stockAdjustmentsApi, type StockAdjustment } from "@/lib/api/stock-adjustments";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Pencil, Trash2, Search, Package, History, Edit2, ArrowRightLeft } from "lucide-react";

interface ProductStockRow {
  product: Product;
  stock: Stock | null;
}

const editFormSchema = z.object({
  quantity: z.number(),
});

const adjustFormSchema = z.object({
  quantity: z.number(),
  alasan: z.string().optional(),
});

export function OutletDetailPage() {
  const { slug, outletId } = useParams({
    from: "/_protected/tenants/$slug/outlets/$outletId",
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [searchText, setSearchText] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ProductStockRow | null>(null);
  const [adjustingRow, setAdjustingRow] = useState<ProductStockRow | null>(null);

  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: { quantity: 0 },
  });

  const adjustForm = useForm<z.infer<typeof adjustFormSchema>>({
    resolver: zodResolver(adjustFormSchema),
    defaultValues: { quantity: 0, alasan: "" },
  });

  const outletIdNum = Number(outletId);

  const { data: outlet, isLoading: outletLoading } = useQuery({
    queryKey: ["outlet", outletIdNum],
    queryFn: () => outletsApi.getById(outletIdNum),
  });

  const { data: stocksData, isLoading: stocksLoading } = useQuery({
    queryKey: ["stocks", { outletId: outletIdNum }],
    queryFn: () => stocksApi.getAll({ outletId: outletIdNum }),
    enabled: !!outletIdNum,
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products", outlet?.tenantId],
    queryFn: () => productsApi.getAll({ tenantId: outlet!.tenantId }),
    enabled: !!outlet?.tenantId,
  });

  const { data: adjustmentsData, isLoading: adjustmentsLoading } = useQuery({
    queryKey: ["stock-adjustments", { outletId: outletIdNum }],
    queryFn: () => stockAdjustmentsApi.getAll({ outletId: outletIdNum }),
    enabled: !!outletIdNum,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["stocks", { outletId: outletIdNum }] });
    queryClient.invalidateQueries({ queryKey: ["stock-adjustments", { outletId: outletIdNum }] });
  };

  const createStockMutation = useMutation({
    mutationFn: (data: { productId: number; outletId: number; quantity: number }) => stocksApi.create(data),
    onSuccess: () => { invalidateAll(); },
    onError: (error: Error) => { alert(error.message); },
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ stockId, quantity }: { stockId: number; quantity: number }) => stocksApi.update(stockId, { quantity }),
    onSuccess: () => { invalidateAll(); setIsEditModalOpen(false); setEditingRow(null); editForm.reset(); },
    onError: (error: Error) => { alert(error.message); },
  });

  const deleteStockMutation = useMutation({
    mutationFn: (stockId: number) => stocksApi.delete(stockId),
    onSuccess: () => { invalidateAll(); },
    onError: (error: Error) => { alert(error.message); },
  });

  const createAdjustmentMutation = useMutation({
    mutationFn: (data: { productId: number; outletId: number; quantity: number; alasan?: string; adjustedBy: string }) => stockAdjustmentsApi.create(data),
    onSuccess: () => { invalidateAll(); setIsAdjustModalOpen(false); setAdjustingRow(null); adjustForm.reset(); },
    onError: (error: Error) => { alert(error.message); },
  });

  const stocks = stocksData?.data || [];
  const products = productsData?.data || [];
  const adjustments = adjustmentsData?.data || [];

  const stockByProductId = new Map<number, Stock>();
  stocks.forEach((s: Stock) => stockByProductId.set(s.productId, s));

  const productMap = new Map<number, Product>();
  products.forEach((p: Product) => productMap.set(p.id, p));

  const rows: ProductStockRow[] = products.map((product: Product) => ({
    product,
    stock: stockByProductId.get(product.id) || null,
  }));

  const filteredRows = rows.filter((row) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return row.product.nama.toLowerCase().includes(search) || row.product.sku.toLowerCase().includes(search);
  });

  const handleAddStock = (productId: number) => {
    createStockMutation.mutate({ productId, outletId: outletIdNum, quantity: 0 });
  };

  const handleEditStock = (row: ProductStockRow) => {
    setEditingRow(row);
    editForm.reset({ quantity: row.stock?.quantity || 0 });
    setIsEditModalOpen(true);
  };

  const handleDeleteStock = (stockId: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus stock ini?")) {
      deleteStockMutation.mutate(stockId);
    }
  };

  const handleAdjustStock = (row: ProductStockRow) => {
    setAdjustingRow(row);
    adjustForm.reset({ quantity: 0, alasan: "" });
    setIsAdjustModalOpen(true);
  };

  if (outletLoading) {
    return (
      <div className="flex justify-center py-24">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  if (!outlet) {
    return <div>Outlet not found</div>;
  }

  const totalWithStock = rows.filter((r) => r.stock !== null).length;

  return (
    <div>
      <Button variant="link" onClick={() => navigate({ to: `/tenants/${slug}/outlets` })} className="mb-4 pl-0">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Outlets
      </Button>

      <Card className="mb-6">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5" />
            <h3 className="text-lg font-semibold">{outlet.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs ${outlet.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {outlet.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><span className="text-gray-500">Kode:</span> <code className="bg-gray-100 px-2 py-1 rounded">{outlet.kode}</code></div>
            <div><span className="text-gray-500">Alamat:</span> {outlet.alamat || "-"}</div>
            <div><span className="text-gray-500">No. HP:</span> {outlet.noHp || "-"}</div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Daftar Produk & Stock
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Riwayat Adjustment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <div className="mb-4 text-sm text-gray-500">
            {totalWithStock} dari {products.length} produk memiliki stock di outlet ini
          </div>
          <div className="mb-4">
            <Input placeholder="Cari produk..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="max-w-[300px]" />
          </div>

          {stocksLoading || productsLoading ? (
            <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">No.</TableHead>
                  <TableHead className="w-[120px]">SKU</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead className="w-[140px]">Harga Jual</TableHead>
                  <TableHead className="w-[150px]">Stock</TableHead>
                  <TableHead className="w-[180px]">Terakhir Diperbarui</TableHead>
                  <TableHead className="w-[140px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row, index) => (
                  <TableRow key={row.product.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell><code className="bg-gray-100 px-2 py-1 rounded text-sm">{row.product.sku}</code></TableCell>
                    <TableCell>
                      <div className="font-medium">{row.product.nama}</div>
                      {row.product.category && <div className="text-xs text-gray-500">{row.product.category.nama}</div>}
                    </TableCell>
                    <TableCell>{Number(row.product.hargaJual).toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })}</TableCell>
                    <TableCell>
                      {!row.stock ? (
                        <Button variant="outline" size="sm" onClick={() => handleAddStock(row.product.id)}>
                          <Plus className="mr-1 h-3 w-3" /> Tambah
                        </Button>
                      ) : (
                        <span className={row.stock.quantity > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                          {row.stock.quantity}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {row.stock?.updatedAt ? new Date(row.stock.updatedAt).toLocaleString("id-ID") : "-"}
                    </TableCell>
                    <TableCell>
                      {!row.stock ? null : (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleAdjustStock(row)}>
                            <ArrowRightLeft className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditStock(row)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteStock(row.stock!.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="adjustments">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">No.</TableHead>
                <TableHead className="w-[180px]">Tanggal</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead className="w-[120px]">Quantity</TableHead>
                <TableHead>Alasan</TableHead>
                <TableHead className="w-[160px]">Oleh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adjustments.map((adj, index) => (
                <TableRow key={adj.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="text-gray-500">{new Date(adj.createdAt).toLocaleString("id-ID")}</TableCell>
                  <TableCell>
                    <div className="font-medium">{adj.product?.nama || `Product #${adj.productId}`}</div>
                    <div className="text-xs text-gray-500">{adj.product?.sku}</div>
                  </TableCell>
                  <TableCell>
                    <span className={adj.quantity > 0 ? "text-green-600" : adj.quantity < 0 ? "text-red-600" : ""}>
                      {adj.quantity > 0 ? `+${adj.quantity}` : adj.quantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-500">{adj.alasan || "-"}</TableCell>
                  <TableCell className="text-gray-500">{adj.user?.name || adj.user?.email || adj.adjustedBy || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Stock — {editingRow?.product.nama || ""}</DialogTitle></DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((v) => { if (editingRow?.stock) updateStockMutation.mutate({ stockId: editingRow.stock.id, quantity: v.quantity }); })} className="space-y-4">
              <FormField control={editForm.control} name="quantity" render={({ field }) => (
                <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter><Button type="submit" disabled={updateStockMutation.isPending}>Simpan</Button></DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAdjustModalOpen} onOpenChange={setIsAdjustModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust Stock — {adjustingRow?.product.nama || ""}</DialogTitle></DialogHeader>
          <div className="mb-4 text-sm text-gray-500">Stock saat ini: <strong>{adjustingRow?.stock?.quantity ?? 0}</strong></div>
          <Form {...adjustForm}>
            <form onSubmit={adjustForm.handleSubmit((v) => { if (adjustingRow) createAdjustmentMutation.mutate({ productId: adjustingRow.product.id, outletId: outletIdNum, quantity: v.quantity, alasan: v.alasan, adjustedBy: userId! }); })} className="space-y-4">
              <FormField control={adjustForm.control} name="quantity" render={({ field }) => (
                <FormItem><FormLabel>Jumlah Adjustment</FormLabel><FormControl><Input type="number" placeholder="Contoh: 10 atau -5" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl><p className="text-xs text-gray-500">Gunakan angka positif untuk menambah, negatif untuk mengurangi</p><FormMessage /></FormItem>
              )} />
              <FormField control={adjustForm.control} name="alasan" render={({ field }) => (
                <FormItem><FormLabel>Alasan</FormLabel><FormControl><Input placeholder="Contoh: Restock dari supplier" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter><Button type="submit" disabled={createAdjustmentMutation.isPending}>Simpan</Button></DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
