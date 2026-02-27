import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { categoriesApi } from '@/lib/api/categories';
import { productsApi } from '@/lib/api/products';
import { tenantsApi } from '@/lib/api/tenants';

export function NewProductPage() {
  const { slug } = useParams({ from: '/_protected/tenants/$slug/products/new' });
  const navigate = useNavigate();

  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ['tenant', slug],
    queryFn: () => tenantsApi.getBySlug(slug),
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', tenant?.id],
    queryFn: () => categoriesApi.getAll({ tenantId: tenant!.id }),
    enabled: !!tenant?.id,
  });

  const createProductMutation = useMutation({
    mutationFn: (data: {
      tenantId: string;
      sku: string;
      barcode?: string;
      nama: string;
      deskripsi?: string;
      categoryId?: string;
      tipe?: 'barang' | 'jasa' | 'digital';
      hargaBeli?: string;
      hargaJual: string;
      minStockLevel?: number;
      unit?: string;
      isActive?: boolean;
    }) => productsApi.create(data),
    onSuccess: () => {
      toast.success('Produk berhasil dibuat');
      navigate({ to: '/tenants/$slug/products', params: { slug } });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membuat produk');
    },
  });

  const categories = categoriesData?.data || [];

  if (tenantLoading || categoriesLoading) {
    return (
      <div className="flex justify-center p-10">
        <Skeleton className="h-10 w-full max-w-md" />
      </div>
    );
  }

  if (!tenant) {
    return <div>Tenant tidak ditemukan</div>;
  }

  return (
    <div>
      <Button
        variant="link"
        onClick={() => navigate({ to: '/tenants/$slug', params: { slug } })}
        className="mb-4 pl-0"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Tenant
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Tambah Produk Baru</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createProductMutation.mutate({
                tenantId: tenant.id,
                sku: formData.get('sku') as string,
                nama: formData.get('nama') as string,
                barcode: (formData.get('barcode') as string) || undefined,
                deskripsi: (formData.get('deskripsi') as string) || undefined,
                categoryId: (formData.get('categoryId') as string) || undefined,
                tipe: formData.get('tipe') as 'barang' | 'jasa' | 'digital',
                unit: (formData.get('unit') as string) || undefined,
                hargaJual: formData.get('hargaJual') as string,
                hargaBeli: (formData.get('hargaBeli') as string) || undefined,
                minStockLevel: formData.get('minStockLevel')
                  ? Number(formData.get('minStockLevel'))
                  : 0,
                isActive: true,
              });
            }}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input id="sku" name="sku" placeholder="Contoh: PROD-001" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nama">Nama Produk *</Label>
                <Input id="nama" name="nama" placeholder="Contoh: Produk A" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input id="barcode" name="barcode" placeholder="Contoh: 1234567890123" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Kategori</Label>
                <Select name="categoryId">
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipe">Tipe Produk *</Label>
                <Select name="tipe" defaultValue="barang">
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe produk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="barang">Barang</SelectItem>
                    <SelectItem value="jasa">Jasa</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Satuan</Label>
                <Input
                  id="unit"
                  name="unit"
                  placeholder="Contoh: pcs, kg, liter"
                  defaultValue="pcs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hargaJual">Harga Jual *</Label>
                <Input
                  id="hargaJual"
                  name="hargaJual"
                  type="number"
                  placeholder="Contoh: 100000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hargaBeli">Harga Beli</Label>
                <Input id="hargaBeli" name="hargaBeli" type="number" placeholder="Contoh: 50000" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStockLevel">Minimum Stok</Label>
                <Input
                  id="minStockLevel"
                  name="minStockLevel"
                  type="number"
                  min="0"
                  defaultValue="0"
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="deskripsi">Deskripsi</Label>
              <textarea
                id="deskripsi"
                name="deskripsi"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={3}
                placeholder="Masukkan deskripsi produk"
              />
            </div>

            <div className="mt-6 flex gap-4">
              <Button type="submit" disabled={createProductMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {createProductMutation.isPending ? 'Menyimpan...' : 'Simpan Produk'}
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => navigate({ to: '/tenants/$slug', params: { slug } })}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
