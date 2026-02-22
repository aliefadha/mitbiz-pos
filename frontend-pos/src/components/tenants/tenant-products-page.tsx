import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  productsApi,
  type Product,
  type CreateProductDto,
  type UpdateProductDto,
  type AdjustStockDto,
} from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { tenantsApi } from "@/lib/api/tenants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Pencil, Trash2, ArrowRightLeft } from "lucide-react";

function formatRupiah(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

const formSchema = z.object({
  sku: z.string().min(1, "SKU wajib diisi"),
  barcode: z.string().optional(),
  nama: z.string().min(1, "Nama produk wajib diisi"),
  deskripsi: z.string().optional(),
  categoryId: z.string().optional(),
  tipe: z.string().optional(),
  hargaBeli: z.string().optional(),
  hargaJual: z.string().optional(),
  stockQuantity: z.string().optional(),
  minStockLevel: z.string().optional(),
  unit: z.string().optional(),
  isActive: z.boolean().optional(),
});

export function TenantProductsPage() {
  const { slug } = useParams({ from: "/_protected/tenants/$slug/products/" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sku: "",
      barcode: "",
      nama: "",
      deskripsi: "",
      categoryId: undefined,
      tipe: "barang",
      hargaBeli: "0",
      hargaJual: "0",
      stockQuantity: "0",
      minStockLevel: "0",
      unit: "pcs",
      isActive: true,
    },
  });

  const stockForm = useForm<{ quantity: number; reason: string }>({
    defaultValues: {
      quantity: 0,
      reason: "",
    },
  });

  const { data: tenant } = useQuery({
    queryKey: ["tenant", slug],
    queryFn: () => tenantsApi.getBySlug(slug),
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", tenant?.id],
    queryFn: () => productsApi.getAll({ tenantId: tenant!.id }),
    enabled: !!tenant?.id,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories", tenant?.id],
    queryFn: () => categoriesApi.getAll({ tenantId: tenant!.id }),
    enabled: !!tenant?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProductDto) => productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", tenant?.id] });
      setIsModalOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductDto }) =>
      productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", tenant?.id] });
      setIsModalOpen(false);
      setEditingProduct(null);
      form.reset();
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => {
      const product = products?.data?.find((p) => p.id === id);
      return productsApi.update(id, { isActive: !product?.isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", tenant?.id] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdjustStockDto }) =>
      productsApi.adjustStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", tenant?.id] });
      setIsStockModalOpen(false);
      setAdjustingProduct(null);
      stockForm.reset();
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", tenant?.id] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const handleCreate = () => {
    setEditingProduct(null);
    form.reset({
      sku: "",
      barcode: "",
      nama: "",
      deskripsi: "",
      categoryId: undefined,
      tipe: "barang",
      hargaBeli: "0",
      hargaJual: "0",
      stockQuantity: "0",
      minStockLevel: "0",
      unit: "pcs",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      sku: product.sku,
      barcode: product.barcode || "",
      nama: product.nama,
      deskripsi: product.deskripsi || "",
      categoryId: product.categoryId?.toString() || undefined,
      tipe: product.tipe,
      hargaBeli: product.hargaBeli || "0",
      hargaJual: product.hargaJual || "0",
      stockQuantity: product.stockQuantity?.toString() || "0",
      minStockLevel: product.minStockLevel?.toString() || "0",
      unit: product.unit,
      isActive: product.isActive,
    });
    setIsModalOpen(true);
  };

  const handleAdjustStock = (product: Product) => {
    setAdjustingProduct(product);
    stockForm.reset({ quantity: 0, reason: "" });
    setIsStockModalOpen(true);
  };

  const handleToggleStatus = (id: string) => {
    toggleStatusMutation.mutate({ id });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleModalOk = () => {
    form.handleSubmit((values) => {
      const data = {
        ...values,
        hargaBeli: values.hargaBeli || "0",
        hargaJual: values.hargaJual || "0",
        categoryId: values.categoryId ? values.categoryId : undefined,
        stockQuantity: values.stockQuantity ? Number(values.stockQuantity) : 0,
        minStockLevel: values.minStockLevel ? Number(values.minStockLevel) : 0,
        tenantId: tenant?.id,
      };
      
      if (editingProduct) {
        updateMutation.mutate({ id: editingProduct.id, data: data as UpdateProductDto });
      } else {
        createMutation.mutate(data as CreateProductDto);
      }
    })();
  };

  const handleStockModalOk = () => {
    stockForm.handleSubmit((values) => {
      if (adjustingProduct) {
        adjustStockMutation.mutate({
          id: adjustingProduct.id,
          data: values,
        });
      }
    })();
  };

  const filteredProducts = products?.data?.filter(
    (prod) =>
      prod.nama.toLowerCase().includes(searchText.toLowerCase()) ||
      prod.sku.toLowerCase().includes(searchText.toLowerCase()) ||
      prod.barcode?.toLowerCase().includes(searchText.toLowerCase()),
  );

  const categoryOptions = categories?.data?.map((cat) => ({
    label: cat.nama,
    value: cat.id.toString(),
  }));

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
      <Button
        variant="link"
        onClick={() => navigate({ to: "/tenants/$slug", params: { slug } })}
        className="mb-4 pl-0"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to {tenant?.nama || "Tenant"}
      </Button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="text-lg font-semibold m-0">Products</h4>
          <p className="text-sm text-gray-500 m-0">Manage products for {tenant?.nama}</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search by name, SKU, barcode..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="max-w-[300px]"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryOptions?.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
              <TableHead className="w-[100px]">SKU</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead className="w-[120px]">Kategori</TableHead>
              <TableHead className="w-[80px]">Tipe</TableHead>
              <TableHead className="w-[130px]">Harga Beli</TableHead>
              <TableHead className="w-[130px]">Harga Jual</TableHead>
              <TableHead className="w-[90px]">Stok</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[160px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts?.map((product, index) => {
              const isLow = (product.stockQuantity || 0) <= (product.minStockLevel || 0);
              return (
                <TableRow key={product.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell><code className="bg-gray-100 px-2 py-1 rounded text-sm">{product.sku}</code></TableCell>
                  <TableCell className="font-medium">{product.nama}</TableCell>
                  <TableCell>{product.category?.nama || "-"}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${getTypeColor(product.tipe)}`}>
                      {product.tipe}
                    </span>
                  </TableCell>
                  <TableCell>{formatRupiah(product.hargaBeli || "0")}</TableCell>
                  <TableCell>{formatRupiah(product.hargaJual)}</TableCell>
                  <TableCell>
                    <span className={isLow ? "text-red-600" : "text-green-600"}>
                      {product.stockQuantity} {product.unit}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(product.id)}
                      className={product.isActive ? "text-green-600" : "text-red-500"}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleAdjustStock(product)}>
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., PRD-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 1234567890123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deskripsi"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Product description (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions?.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="barang">Barang (Physical)</SelectItem>
                        <SelectItem value="jasa">Jasa (Service)</SelectItem>
                        <SelectItem value="digital">Digital</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hargaBeli"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Price (Harga Beli)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hargaJual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling Price (Harga Jual)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stockQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Stock</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minStockLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Stock Level</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="pcs, kg, L" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleModalOk} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingProduct ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isStockModalOpen} onOpenChange={setIsStockModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock - {adjustingProduct?.nama || ""}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">
              Current Stock: <strong>{adjustingProduct?.stockQuantity} {adjustingProduct?.unit}</strong>
            </p>
            <Form {...stockForm}>
              <FormField
                control={stockForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity Adjustment</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <p className="text-xs text-gray-500 mt-1">Use positive numbers to add stock, negative to reduce</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={stockForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Stock count correction, Damaged goods, New shipment received" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleStockModalOk} disabled={adjustStockMutation.isPending}>
              Adjust
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
