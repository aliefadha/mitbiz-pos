import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  Minus,
  Plus,
  Printer,
  Receipt,
  Search,
  ShoppingCart,
  Store,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useTenant } from '@/contexts/tenant-context';
import { discountsApi } from '@/lib/api/discounts';
import {
  type CreateOrderDto,
  type DiscountBreakdown,
  ordersApi,
  type TaxBreakdown,
} from '@/lib/api/orders';
import { type PaymentMethod, paymentMethodsApi } from '@/lib/api/payment-methods';
import { type Product, productsApi } from '@/lib/api/products';
import { taxesApi } from '@/lib/api/taxes';
import { formatRupiah } from '@/lib/utils';

interface CartItem {
  product: Product;
  quantity: number;
  hargaSatuan: string;
  jumlahDiskon: string;
  total: string;
}

const generateOrderNumber = (tenantSlug: string, outletKode: string) => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${tenantSlug}-${outletKode}-${timestamp}-${random}`;
};

export function PosPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<{
    orderNumber: string;
    items: CartItem[];
    subtotal: number;
    taxBreakdown: TaxBreakdown[];
    discountBreakdown: DiscountBreakdown[];
    total: number;
    paymentMethod: string;
    amountPaid: number;
    change: number;
    notes: string;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedTaxIds, setSelectedTaxIds] = useState<string[]>([]);
  const [selectedDiscountIds, setSelectedDiscountIds] = useState<string[]>([]);

  const { selectedTenant, selectedOutlet, isLoading: tenantLoading } = useTenant();
  const effectiveTenantId = selectedTenant?.id;
  const effectiveOutletId = selectedOutlet?.id;

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', effectiveTenantId, effectiveOutletId, searchQuery, categoryFilter],
    queryFn: () =>
      productsApi.getAll({
        tenantId: effectiveTenantId,
        outletId: effectiveOutletId,
        search: searchQuery || undefined,
        isActive: true,
      }),
    enabled: !!effectiveTenantId,
  });

  const { data: paymentMethodsData, isLoading: paymentMethodsLoading } = useQuery({
    queryKey: ['payment-methods', effectiveTenantId],
    queryFn: () =>
      paymentMethodsApi.getAll({
        tenantId: effectiveTenantId,
        isActive: true,
      }),
    enabled: !!effectiveTenantId,
  });

  const { data: taxesData } = useQuery({
    queryKey: ['taxes', effectiveTenantId, effectiveOutletId],
    queryFn: () => taxesApi.getActiveForOutlet(effectiveTenantId!, effectiveOutletId!),
    enabled: !!effectiveTenantId && !!effectiveOutletId,
  });

  const { data: discountsData } = useQuery({
    queryKey: ['discounts', effectiveTenantId, effectiveOutletId],
    queryFn: () => discountsApi.getActiveForOutlet(effectiveTenantId!, effectiveOutletId!),
    enabled: !!effectiveTenantId && !!effectiveOutletId,
  });

  const taxes = taxesData?.data ?? [];
  const discounts = discountsData?.data ?? [];

  const createOrderMutation = useMutation({
    mutationFn: (data: CreateOrderDto) => ordersApi.create(data),
    onSuccess: (_, variables) => {
      const orderNumber = variables.orderNumber;
      setLastOrder({
        orderNumber,
        items: [...cart],
        subtotal,
        taxBreakdown,
        discountBreakdown,
        total,
        paymentMethod,
        amountPaid: Number(amountPaid),
        change,
        notes,
      });
      setCart([]);
      setCheckoutOpen(false);
      setPaymentMethod('cash');
      setAmountPaid('');
      setNotes('');
      setSelectedTaxIds([]);
      setSelectedDiscountIds([]);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSuccessOpen(true);
    },
    onError: (error: Error) => {
      alert(error.message || 'Gagal membuat pesanan');
    },
  });

  const products = productsData?.data ?? [];
  const categories = useMemo(() => {
    const cats = new Map<string, string>();
    products.forEach((p) => {
      if (p.category?.nama) {
        cats.set(p.category.id, p.category.nama);
      }
    });
    return Array.from(cats.entries()).map(([id, nama]) => ({ id, nama }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.categoryId !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [products, categoryFilter]);

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: String(Number(item.hargaSatuan) * (item.quantity + 1)),
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          hargaSatuan: product.hargaJual,
          jumlahDiskon: '0',
          total: product.hargaJual,
        },
      ]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    const cartItem = cart.find((item) => item.product.id === productId);
    if (!cartItem) return;

    const maxStock = cartItem.product.stock ?? 0;
    const newQuantity = cartItem.quantity + delta;

    if (newQuantity < 1 || newQuantity > maxStock) return;

    setCart(
      cart
        .map((item) => {
          if (item.product.id === productId) {
            return {
              ...item,
              quantity: newQuantity,
              total: String(Number(item.hargaSatuan) * newQuantity),
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.total), 0);
  }, [cart]);

  const taxBreakdown = useMemo<TaxBreakdown[]>(() => {
    return selectedTaxIds
      .map((taxId) => {
        const tax = taxes.find((t) => t.id === taxId);
        if (!tax) return null;
        const amount = Math.round((subtotal * Number(tax.rate)) / 100);
        return {
          taxId: tax.id,
          nama: tax.nama,
          rate: tax.rate,
          amount,
        };
      })
      .filter(Boolean) as TaxBreakdown[];
  }, [subtotal, selectedTaxIds, taxes]);

  const taxAmount = useMemo(() => {
    return taxBreakdown.reduce((sum, tax) => sum + tax.amount, 0);
  }, [taxBreakdown]);

  const discountBreakdown = useMemo<DiscountBreakdown[]>(() => {
    return selectedDiscountIds
      .map((discountId) => {
        const discount = discounts.find((d) => d.id === discountId);
        if (!discount) return null;
        const amount = Math.round((subtotal * Number(discount.rate)) / 100);
        return {
          discountId: discount.id,
          nama: discount.nama,
          rate: discount.rate,
          amount,
        };
      })
      .filter(Boolean) as DiscountBreakdown[];
  }, [subtotal, selectedDiscountIds, discounts]);

  const discountAmount = useMemo(() => {
    return discountBreakdown.reduce((sum, discount) => sum + discount.amount, 0);
  }, [discountBreakdown]);

  const total = subtotal + taxAmount - discountAmount;

  const amountPaidNum = Number(amountPaid) || 0;
  const change = amountPaidNum - total;

  const handleCheckout = () => {
    if (!effectiveTenantId) {
      alert('Anda belum memiliki tenant. Silakan hubungi admin.');
      return;
    }

    if (!effectiveOutletId) {
      alert('Silakan pilih outlet terlebih dahulu');
      return;
    }

    if (cart.length === 0) {
      alert('Keranjang belanja kosong');
      return;
    }

    const orderItems = cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      hargaSatuan: item.hargaSatuan,
      jumlahDiskon: item.jumlahDiskon,
      total: item.total,
    }));

    const selectedPaymentMethod = paymentMethodsData?.data?.find(
      (pm) => pm.nama.toLowerCase().replace(/\s+/g, '_') === paymentMethod
    );

    createOrderMutation.mutate({
      tenantId: effectiveTenantId,
      outletId: effectiveOutletId,
      orderNumber: generateOrderNumber(
        selectedTenant?.slug || 'UNKNOWN',
        selectedOutlet?.kode || 'OUT'
      ),
      status: 'complete',
      subtotal: String(subtotal),
      jumlahPajak: String(taxAmount),
      pajakBreakdown: taxBreakdown,
      jumlahDiskon: String(discountAmount),
      diskonBreakdown: discountBreakdown,
      paymentMethodId: selectedPaymentMethod?.id || null,
      total: String(total),
      notes: notes || null,
      completedAt: new Date().toISOString(),
      items: orderItems,
    });
  };

  return (
    <div className="flex h-full gap-4">
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-lg font-semibold m-0">Kasir</h4>
            <p className="text-sm text-gray-500 m-0">{selectedOutlet?.nama || 'Pilih outlet'}</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {tenantLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Memuat data...</p>
          </div>
        ) : !effectiveTenantId ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Anda belum memiliki tenant</p>
              <p className="text-sm text-gray-400">
                Silakan hubungi admin untuk informasi lebih lanjut
              </p>
            </div>
          </div>
        ) : !effectiveOutletId ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Store className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Silakan pilih outlet</p>
              <p className="text-sm text-gray-400">Pilih outlet dari dropdown di header</p>
            </div>
          </div>
        ) : productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto flex-1 py-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => (product.stock ?? 0) > 0 && addToCart(product)}
                className={`relative border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all h-48 flex flex-col ${
                  (product.stock ?? 0) < product.minStockLevel ? 'bg-red-50 border-red-200' : ''
                } ${(product.stock ?? 0) === 0 ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed' : 'hover:border-primary'}`}
              >
                <div
                  className={`absolute -top-3 -right-3 flex items-center justify-center h-8 min-w-8 px-2 rounded-full text-xs font-bold shadow-sm border-2 border-white ${
                    (product.stock ?? 0) === 0
                      ? 'bg-gray-400 text-white'
                      : (product.stock ?? 0) < product.minStockLevel
                        ? 'bg-red-500 text-white'
                        : 'bg-primary text-primary-foreground'
                  }`}
                >
                  {product.stock ?? 0}
                </div>
                <div className="h-20 bg-gray-100 rounded-md mb-3 flex items-center justify-center">
                  <Receipt className="h-8 w-8 text-gray-400" />
                </div>
                <h5 className="font-medium text-sm truncate">{product.nama}</h5>
                <p className="text-xs text-gray-500">{product.sku}</p>
                <div className="flex justify-between items-end mt-auto">
                  <p className="font-bold text-primary">{formatRupiah(product.hargaJual)}</p>
                  {(product.stock ?? 0) === 0 && (
                    <p className="text-xs font-medium text-gray-500">Habis</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-96 border-l bg-white flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <h4 className="font-semibold m-0">Keranjang</h4>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Keranjang belanja kosong</p>
              <p className="text-sm">Klik produk untuk menambahkan</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{item.product.nama}</h5>
                    <p className="text-xs text-gray-500">
                      {formatRupiah(item.hargaSatuan)} / {item.product.unit}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={item.quantity <= 1}
                      onClick={() => updateQuantity(item.product.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={item.quantity >= (item.product.stock ?? 0)}
                      onClick={() => updateQuantity(item.product.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="font-bold text-sm">{formatRupiah(item.total)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total</span>
            <span>{formatRupiah(total)}</span>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              if (taxes.length > 0) {
                setSelectedTaxIds(taxes.map((t) => t.id));
              }
              setCheckoutOpen(true);
            }}
            disabled={cart.length === 0}
          >
            <Receipt className="mr-2 h-4 w-4" />
            Checkout
          </Button>
        </div>
      </div>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="w-full min-w-4xl">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <h5 className="font-semibold mb-3">Ringkasan Pesanan</h5>
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.product.nama} x {item.quantity}
                    </span>
                    <span>{formatRupiah(item.total)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                {taxBreakdown.length > 0 &&
                  taxBreakdown.map((tax) => (
                    <div key={tax.taxId} className="flex justify-between">
                      <span className="text-gray-500">
                        {tax.nama} ({tax.rate}%)
                      </span>
                      <span>{formatRupiah(tax.amount)}</span>
                    </div>
                  ))}
                {discountBreakdown.length > 0 &&
                  discountBreakdown.map((discount) => (
                    <div key={discount.discountId} className="flex justify-between">
                      <span className="text-gray-500">
                        {discount.nama} ({discount.rate}%)
                      </span>
                      <span>-{formatRupiah(discount.amount)}</span>
                    </div>
                  ))}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>{formatRupiah(total)}</span>
                </div>
                {paymentMethod === 'cash' && amountPaid && change >= 0 && (
                  <div className="flex justify-between font-bold text-lg text-green-600 bg-green-50 p-3 rounded-lg">
                    <span>Kembalian</span>
                    <span>{formatRupiah(change)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {taxes.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pajak</label>
                  <div className="border rounded-lg p-3 space-y-2">
                    {taxes.map((tax) => (
                      <div key={tax.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {tax.nama} ({tax.rate}%)
                        </span>
                        <span>
                          {formatRupiah(taxBreakdown.find((t) => t.taxId === tax.id)?.amount || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {discounts.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Diskon</label>
                  <div className="border rounded-lg p-3 space-y-2">
                    {discounts.map((discount) => (
                      <div key={discount.id} className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedDiscountIds.includes(discount.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDiscountIds([...selectedDiscountIds, discount.id]);
                              } else {
                                setSelectedDiscountIds(
                                  selectedDiscountIds.filter((id) => id !== discount.id)
                                );
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-gray-600">
                            {discount.nama} ({discount.rate}%)
                          </span>
                        </label>
                        <span>
                          -
                          {formatRupiah(
                            discountBreakdown.find((d) => d.discountId === discount.id)?.amount || 0
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Metode Pembayaran</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethodsLoading ? (
                      <div className="p-2 text-sm text-gray-500">Memuat...</div>
                    ) : paymentMethodsData?.data && paymentMethodsData.data.length > 0 ? (
                      paymentMethodsData.data.map((pm: PaymentMethod) => (
                        <SelectItem key={pm.id} value={pm.nama.toLowerCase().replace(/\s+/g, '_')}>
                          {pm.nama}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="cash">Tunai</SelectItem>
                        <SelectItem value="qris">QRIS</SelectItem>
                        <SelectItem value="card">Kartu</SelectItem>
                        <SelectItem value="bank_transfer">Transfer Bank</SelectItem>
                        <SelectItem value="e_wallet">E-Wallet</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod === 'cash' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Jumlah Bayar</label>
                  <Input
                    type="text"
                    value={amountPaid ? Number(amountPaid).toLocaleString('id-ID') : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '');
                      setAmountPaid(value);
                    }}
                    placeholder="0"
                    className="text-lg"
                  />
                  <div className="grid grid-cols-5 gap-2">
                    {[5000, 10000, 20000, 50000, 100000].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="lg"
                        onClick={() => setAmountPaid(String(amount))}
                        className="text-xs"
                      >
                        {formatRupiah(amount)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Catatan (Opsional)</label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tambahkan catatan..."
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={
                createOrderMutation.isPending || (paymentMethod === 'cash' && amountPaidNum < total)
              }
            >
              {createOrderMutation.isPending ? 'Memproses...' : 'Simpan Pesanan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Pesanan Berhasil!</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-gray-600">Pesanan telah berhasil dibuat.</p>
            {lastOrder && (
              <p className="text-sm text-gray-500 mt-2">
                No. Pesanan: <span className="font-mono font-bold">{lastOrder.orderNumber}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (lastOrder) {
                  toast.success('Struk sedang dicetak...');
                }
              }}
              className="flex-1"
            >
              <Printer className="mr-2 h-4 w-4" />
              Cetak Struk
            </Button>
            <Button onClick={() => setSuccessOpen(false)} className="flex-1">
              Buat Pesanan Baru
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {lastOrder && (
        <div className="hidden print:block p-4 text-sm" id="receipt">
          <div className="text-center mb-4">
            <h2 className="font-bold text-lg">{selectedTenant?.nama || 'Toko'}</h2>
            <p className="text-xs">{selectedOutlet?.nama || ''}</p>
            <p className="text-xs">No. {lastOrder.orderNumber}</p>
            <p className="text-xs">{new Date().toLocaleString('id-ID')}</p>
          </div>
          <div className="border-t border-b border-dashed py-2 mb-2">
            {lastOrder.items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-xs">
                <span>
                  {item.product.nama} x {item.quantity}
                </span>
                <span>{formatRupiah(item.total)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatRupiah(lastOrder.subtotal)}</span>
            </div>
            {lastOrder.taxBreakdown.map((tax) => (
              <div key={tax.taxId} className="flex justify-between">
                <span>
                  {tax.nama} ({tax.rate}%)
                </span>
                <span>{formatRupiah(tax.amount)}</span>
              </div>
            ))}
            {lastOrder.discountBreakdown.map((discount) => (
              <div key={discount.discountId} className="flex justify-between">
                <span>
                  {discount.nama} ({discount.rate}%)
                </span>
                <span>-{formatRupiah(discount.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-base border-t border-dashed pt-1">
              <span>Total</span>
              <span>{formatRupiah(lastOrder.total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Bayar ({lastOrder.paymentMethod})</span>
              <span>{formatRupiah(lastOrder.amountPaid)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kembalian</span>
              <span>{formatRupiah(lastOrder.change)}</span>
            </div>
          </div>
          {lastOrder.notes && (
            <div className="mt-2 text-xs">
              <p>Catatan: {lastOrder.notes}</p>
            </div>
          )}
          <div className="text-center mt-4 text-xs">
            <p>Terima kasih atas kunjungan Anda</p>
          </div>
        </div>
      )}
    </div>
  );
}
