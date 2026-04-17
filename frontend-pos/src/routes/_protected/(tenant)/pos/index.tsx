import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Printer,
  Receipt,
  Search,
  ShoppingCart,
  Wallet,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { cashShiftsApi } from '@/lib/api/cash-shifts';
import { categoriesApi } from '@/lib/api/categories';
import { discountsApi } from '@/lib/api/discounts';
import { openBillsApi } from '@/lib/api/openbills';
import { type CreateOrderDto, type DiscountBreakdown, ordersApi } from '@/lib/api/orders';
import { paymentMethodsApi } from '@/lib/api/payment-methods';

import { type Product, productsApi } from '@/lib/api/products';
import { tenantsApi } from '@/lib/api/tenants';
import { checkPermissionWithScope } from '@/lib/permissions';
import { useSessionWithCache } from '@/lib/session-cache';
import { formatRupiah } from '@/lib/utils';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

interface CartItem {
  product: Product;
  quantity: number;
  hargaSatuan: string;
  jumlahDiskon: string;
  total: string;
}

function PosPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<{
    orderNumber: string;
    nomorAntrian: string;
    items: CartItem[];
    subtotal: number;
    jumlahPajak: number;
    discountBreakdown: DiscountBreakdown[];
    total: number;
    paymentMethod: string;
    amountPaid: number;
    change: number;
    notes: string;
    nama: string;
    tipe: 'dine_in' | 'take_away' | undefined;
  } | null>(null);
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [nomorAntrian, setNomorAntrian] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [orderType, setOrderType] = useState<'dine_in' | 'take_away' | undefined>(undefined);
  const [selectedDiscountIds, setSelectedDiscountIds] = useState<string[]>([]);
  const [closeShiftOpen, setCloseShiftOpen] = useState(false);
  const [jumlahTutup, setJumlahTutup] = useState<string>('');
  const [shiftNotes, setShiftNotes] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<'select' | 'checkout' | 'hold' | 'pay-openbill'>(
    'select'
  );
  const [openBillsDialogOpen, setOpenBillsDialogOpen] = useState(false);
  const [editingOpenBillId, setEditingOpenBillId] = useState<string | null>(null);
  const [openBillDetailDialogOpen, setOpenBillDetailDialogOpen] = useState(false);
  const [selectedOpenBillForDetail, setSelectedOpenBillForDetail] = useState<
    (typeof openBills)[0] | null
  >(null);
  const [holdNomorAntrianDialogOpen, setHoldNomorAntrianDialogOpen] = useState(false);
  const [holdNomorAntrian, setHoldNomorAntrian] = useState('');
  const pageSize = 12;

  const isMobile = useMediaQuery('(max-width: 767px)');

  const { data: session } = useSessionWithCache();
  const userId = session?.user?.id;

  const { data: userOpenShiftData, isLoading: userOpenShiftLoading } = useQuery({
    queryKey: ['cash-shifts', 'my-open', userId],
    queryFn: async () => {
      return cashShiftsApi.getMyOpen();
    },
    enabled: !!userId,
  });

  const tenantId = userOpenShiftData?.tenantId;
  const outletId = userOpenShiftData?.outletId;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', tenantId, outletId, searchQuery, categoryFilter, currentPage, pageSize],
    queryFn: () =>
      productsApi.getAll({
        tenantId,
        outletId,
        categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: searchQuery || undefined,
        isActive: true,
        page: currentPage,
        limit: pageSize,
      }),
    enabled: !!tenantId && !!outletId,
  });

  const { data: discountsData } = useQuery({
    queryKey: ['discounts', tenantId, outletId],
    queryFn: () =>
      discountsApi.getAll({
        tenantId,
        outletId: outletId,
        isActive: true,
      }),
    enabled: !!tenantId && !!outletId,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', tenantId],
    queryFn: () => categoriesApi.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  const { data: paymentMethodsData } = useQuery({
    queryKey: ['payment-methods', tenantId],
    queryFn: () => paymentMethodsApi.getAll({ tenantId, isActive: true }),
    enabled: !!tenantId,
  });

  const { data: tenantData } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => tenantsApi.getById(tenantId!),
    enabled: !!tenantId,
  });

  const { data: openBillsData } = useQuery({
    queryKey: ['openbills', outletId],
    queryFn: () => openBillsApi.getAll({ outletId, limit: 50 }),
    enabled: !!outletId,
  });

  const discounts = discountsData?.data ?? [];
  const paymentMethods = paymentMethodsData?.data ?? [];
  const openBills = openBillsData?.data ?? [];

  const closeShiftMutation = useMutation({
    mutationFn: async ({
      id,
      jumlahTutup,
      catatan,
    }: {
      id: string;
      jumlahTutup: string;
      catatan: string;
    }) => {
      return cashShiftsApi.update(id, {
        jumlahTutup,
        status: 'tutup',
        catatan: catatan || null,
      });
    },
    onSuccess: () => {
      setCloseShiftOpen(false);
      setJumlahTutup('');
      setShiftNotes('');
      queryClient.invalidateQueries({ queryKey: ['cash-shifts'] });
      toast.success('Shift berhasil ditutup');
    },
    onError: (error: Error) => {
      alert(error.message || 'Gagal menutup shift');
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: CreateOrderDto) => ordersApi.create(data),
    onSuccess: (response, _) => {
      const orderNumber = response.orderNumber;
      setLastOrder({
        orderNumber,
        nomorAntrian,
        items: [...cart],
        subtotal,
        jumlahPajak,
        discountBreakdown,
        total,
        paymentMethod:
          paymentMethods.find((pm) => pm.id === selectedPaymentMethodId)?.nama || 'Unknown',
        amountPaid: Number(amountPaid),
        change,
        notes,
        nama: customerName,
        tipe: orderType ?? undefined,
      });
      setCart([]);
      setCheckoutOpen(false);
      setSelectedPaymentMethodId(paymentMethods[0]?.id || '');
      setAmountPaid('');
      setNotes('');
      setNomorAntrian('');
      setCustomerName('');
      setSelectedDiscountIds([]);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSuccessOpen(true);
    },
    onError: (error: Error) => {
      alert(error.message || 'Gagal membuat pesanan');
    },
  });

  const holdBillMutation = useMutation({
    mutationFn: async (data: CreateOrderDto & { editingOpenBillId?: string | null }) => {
      if (data.editingOpenBillId) {
        return openBillsApi.replaceItems(data.editingOpenBillId, data.items!);
      }
      const createData = {
        tenantId: data.tenantId,
        outletId: data.outletId,
        notes: data.notes || null,
        nomorAntrian: data.nomorAntrian || null,
        items: data.items,
      };
      return openBillsApi.create(createData);
    },
    onSuccess: (_, variables) => {
      setCart([]);
      setCheckoutOpen(false);
      setCheckoutMode('select');
      setSelectedPaymentMethodId(paymentMethods[0]?.id || '');
      setAmountPaid('');
      setNotes('');
      setNomorAntrian('');
      setSelectedDiscountIds([]);
      setEditingOpenBillId(null);
      queryClient.invalidateQueries({ queryKey: ['openbills'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (variables.editingOpenBillId) {
        toast.success('Bill berhasil diperbarui');
      } else {
        toast.success('Bill berhasil ditahan');
      }
    },
    onError: (error: Error) => {
      alert(error.message || 'Gagal menahan bill');
    },
  });

  const cancelOpenBillMutation = useMutation({
    mutationFn: async (openBillId: string) => {
      return openBillsApi.cancel(openBillId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openbills'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Bill berhasil dibatalkan');
    },
    onError: (error: Error) => {
      alert(error.message || 'Gagal membatalkan bill');
    },
  });

  const closeOpenBillMutation = useMutation({
    mutationFn: async ({
      openBillId,
      paymentMethodId,
      subtotal,
      jumlahPajak,
      jumlahDiskon,
      diskonBreakdown,
      total,
      notes,
    }: {
      openBillId: string;
      paymentMethodId?: string | null;
      subtotal: string;
      jumlahPajak: string;
      jumlahDiskon: string;
      diskonBreakdown: DiscountBreakdown[];
      total: string;
      notes?: string | null;
    }) => {
      return openBillsApi.close(openBillId, {
        paymentMethodId,
        subtotal,
        jumlahPajak,
        jumlahDiskon,
        diskonBreakdown,
        total,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openbills'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: Error) => {
      alert(error.message || 'Gagal menutup bill');
    },
  });

  const products = productsData?.data ?? [];
  const categories = categoriesData?.data ?? [];

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

    const stockTrackingEnabled = cartItem.product.enableStockTracking !== false;
    const maxStock = stockTrackingEnabled ? (cartItem.product.stock ?? 0) : Infinity;
    const newQuantity = cartItem.quantity + delta;

    if (newQuantity < 1) return;
    if (cartItem.product.enableMinStock && stockTrackingEnabled && newQuantity > maxStock) return;

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

  const jumlahPajak = useMemo(() => {
    const taxRate = tenantData?.settings?.taxRate || 0;
    return Math.round((subtotal * taxRate) / 100);
  }, [subtotal, tenantData]);

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

  const total = subtotal + jumlahPajak - discountAmount;

  const amountPaidNum = Number(amountPaid) || 0;
  const change = amountPaidNum - total;

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const handleCheckout = () => {
    if (!tenantId) {
      alert('Anda belum memiliki tenant. Silakan hubungi admin.');
      return;
    }

    if (!outletId) {
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

    createOrderMutation.mutate({
      tenantId: tenantId,
      outletId: outletId,
      status: 'complete',
      subtotal: String(subtotal),
      jumlahPajak: String(jumlahPajak),
      jumlahDiskon: String(discountAmount),
      diskonBreakdown: discountBreakdown,
      paymentMethodId: selectedPaymentMethodId || null,
      total: String(total),
      notes: notes || null,
      nomorAntrian: nomorAntrian || null,
      completedAt: new Date().toISOString(),
      nama: customerName || null,
      ...(tenantData?.settings?.enableOrderTipe && orderType ? { tipe: orderType } : {}),
      bayar: amountPaid || '0',
      kembali: String(change > 0 ? change : 0),
      items: orderItems,
    });
  };

  const handleCloseOpenBill = () => {
    if (!tenantId) {
      alert('Anda belum memiliki tenant. Silakan hubungi admin.');
      return;
    }

    if (!outletId) {
      alert('Silakan pilih outlet terlebih dahulu');
      return;
    }

    if (cart.length === 0) {
      alert('Keranjang belanja kosong');
      return;
    }

    if (!editingOpenBillId) {
      alert('Bill tidak ditemukan');
      return;
    }

    const orderItems = cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      hargaSatuan: item.hargaSatuan,
      jumlahDiskon: item.jumlahDiskon,
      total: item.total,
    }));

    holdBillMutation.mutate(
      {
        tenantId: tenantId,
        outletId: outletId,
        subtotal: String(subtotal),
        jumlahPajak: String(jumlahPajak),
        jumlahDiskon: String(discountAmount),
        diskonBreakdown: discountBreakdown,
        paymentMethodId: selectedPaymentMethodId || null,
        total: String(total),
        notes: notes || null,
        nomorAntrian: nomorAntrian || null,
        items: orderItems,
        editingOpenBillId: editingOpenBillId,
      },
      {
        onSuccess: () => {
          closeOpenBillMutation.mutate(
            {
              openBillId: editingOpenBillId,
              paymentMethodId: selectedPaymentMethodId || null,
              subtotal: String(subtotal),
              jumlahPajak: String(jumlahPajak),
              jumlahDiskon: String(discountAmount),
              diskonBreakdown: discountBreakdown,
              total: String(total),
              notes: notes || null,
            },
            {
              onSuccess: (closedOrder) => {
                setLastOrder({
                  orderNumber: closedOrder.orderNumber,
                  nomorAntrian: closedOrder.nomorAntrian || '',
                  items: cart,
                  subtotal: Number(closedOrder.subtotal),
                  jumlahPajak: Number(closedOrder.jumlahPajak),
                  discountBreakdown: closedOrder.diskonBreakdown || [],
                  total: Number(closedOrder.total),
                  paymentMethod:
                    paymentMethods.find((pm) => pm.id === closedOrder.paymentMethodId)?.nama ||
                    'Unknown',
                  amountPaid: Number(closedOrder.total),
                  change: 0,
                  notes: closedOrder.notes || '',
                  nama: closedOrder.nama || '',
                  tipe: closedOrder.tipe || 'dine_in',
                });
                setCart([]);
                setCheckoutOpen(false);
                setSelectedPaymentMethodId(paymentMethods[0]?.id || '');
                setAmountPaid('');
                setNotes('');
                setNomorAntrian('');
                setCustomerName('');
                setSelectedDiscountIds([]);
                setEditingOpenBillId(null);
                setSuccessOpen(true);
              },
            }
          );
        },
      }
    );
  };

  const selectedOutletName = useMemo(() => {
    return userOpenShiftData?.outlet?.nama;
  }, [userOpenShiftData]);

  const CartContent = useCallback(
    ({ isSheet = false }: { isSheet?: boolean }) => (
      <>
        <div
          className={`flex-1 overflow-y-auto space-y-2 xl:space-y-3 ${isSheet ? 'p-4' : 'p-2 lg:p-3 xl:p-4'}`}
        >
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 py-6 xl:py-8">
              <ShoppingCart
                className={`mx-auto mb-2 opacity-30 ${isSheet ? 'h-12 w-12' : 'h-8 w-8 xl:h-12 xl:w-12'}`}
              />
              <p className={isSheet ? '' : 'text-xs xl:text-sm'}>Keranjang kosong</p>
              <p className={`text-gray-400 ${isSheet ? 'text-sm' : 'text-[10px] xl:text-sm'}`}>
                Klik produk untuk menambahkan
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className={`border rounded-lg ${isSheet ? 'p-3' : 'p-1.5 lg:p-2 xl:p-3'}`}
              >
                <div className="flex justify-between items-start mb-1 xl:mb-2">
                  <div className="flex-1 min-w-0">
                    <h5
                      className={`font-medium truncate ${isSheet ? 'text-sm' : 'text-[10px] lg:text-xs xl:text-sm'}`}
                    >
                      {item.product.nama}
                    </h5>
                    <p
                      className={`text-gray-500 ${isSheet ? 'text-xs' : 'text-[9px] lg:text-[10px] xl:text-xs'}`}
                    >
                      {formatRupiah(item.hargaSatuan)}/{item.product.unit}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`shrink-0 ${isSheet ? 'h-6 w-6' : 'h-5 w-5 xl:h-6 xl:w-6'}`}
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    <X className={isSheet ? 'h-3 w-3' : 'h-2.5 w-2.5 xl:h-3 xl:w-3'} />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5 xl:gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className={isSheet ? 'h-7 w-7' : 'h-5 w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7'}
                      disabled={item.quantity <= 1}
                      onClick={() => updateQuantity(item.product.id, -1)}
                    >
                      <Minus className={isSheet ? 'h-3 w-3' : 'h-2 w-2 xl:h-3 xl:w-3'} />
                    </Button>
                    <span
                      className={`text-center font-medium ${isSheet ? 'w-8 text-sm' : 'w-5 lg:w-6 xl:w-8 text-[10px] lg:text-xs xl:text-sm'}`}
                    >
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className={isSheet ? 'h-7 w-7' : 'h-5 w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7'}
                      disabled={
                        item.product.enableStockTracking !== false &&
                        item.product.enableMinStock &&
                        item.quantity >= (item.product.stock ?? 0)
                      }
                      onClick={() => updateQuantity(item.product.id, 1)}
                    >
                      <Plus className={isSheet ? 'h-3 w-3' : 'h-2 w-2 xl:h-3 xl:w-3'} />
                    </Button>
                  </div>
                  <span
                    className={`font-bold ${isSheet ? 'text-sm' : 'text-[10px] lg:text-xs xl:text-sm'}`}
                  >
                    {formatRupiah(item.total)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={`border-t space-y-2 xl:space-y-3 ${isSheet ? 'p-4' : 'p-2 lg:p-3 xl:p-4'}`}>
          <div
            className={`flex justify-between ${isSheet ? 'text-sm' : 'text-[10px] lg:text-xs xl:text-sm'}`}
          >
            <span className="text-gray-500">Subtotal</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>
          <div
            className={`flex justify-between font-bold border-t pt-1.5 xl:pt-2 ${isSheet ? 'text-lg' : 'text-xs lg:text-sm xl:text-lg'}`}
          >
            <span>Total</span>
            <span>{formatRupiah(total)}</span>
          </div>

          <Button
            className="w-full"
            size={isSheet ? 'lg' : 'sm'}
            onClick={() => {
              setSelectedPaymentMethodId(paymentMethods[0]?.id || '');
              setAmountPaid('');
              setNotes('');
              setNomorAntrian('');
              setCustomerName('');
              setCheckoutOpen(true);
              if (isSheet) setMobileCartOpen(false);
            }}
            disabled={cart.length === 0}
          >
            <Receipt className={isSheet ? 'mr-2 h-4 w-4' : 'mr-1 h-3 w-3 xl:mr-2 xl:h-4 xl:w-4'} />
            <span className={isSheet ? '' : 'text-xs xl:text-sm'}>Checkout</span>
          </Button>
        </div>
      </>
    ),
    [cart, subtotal, total, paymentMethods]
  );

  return (
    <div className="flex h-full gap-3 lg:gap-4">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex justify-between items-center">
            <div className="min-w-0">
              <h4 className="text-base lg:text-lg font-semibold m-0 truncate">Kasir</h4>
              <p className="text-xs lg:text-sm text-gray-500 m-0 truncate">
                {selectedOutletName || 'Pilih outlet'}
              </p>
            </div>
            <div className="flex gap-2 items-center shrink-0">
              {userOpenShiftData && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-2 lg:px-3 py-1.5 lg:py-2 flex items-center gap-1.5">
                  <span className="text-xs lg:text-sm text-green-800 whitespace-nowrap">
                    Shift Aktif
                  </span>
                </div>
              )}
              {userOpenShiftData && openBills.length > 0 && (
                <Button
                  variant="outline"
                  size={isMobile ? 'sm' : 'default'}
                  onClick={() => setOpenBillsDialogOpen(true)}
                >
                  <ShoppingCart className="h-4 w-4 mr-1 lg:mr-2" />
                  <span className="hidden sm:inline">Open Bill</span>
                  <span className="sm:hidden">Bill</span>
                  <span className="ml-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                    {openBills.length}
                  </span>
                </Button>
              )}
              {userOpenShiftData && (
                <Button
                  variant="outline"
                  size={isMobile ? 'sm' : 'default'}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setJumlahTutup('');
                    setShiftNotes('');
                    setCloseShiftOpen(true);
                  }}
                >
                  <X className="h-4 w-4 mr-1 lg:mr-2" />
                  <span className="hidden sm:inline">Tutup Shift</span>
                  <span className="sm:hidden">Tutup</span>
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari produk..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-32 sm:w-40 shrink-0">
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

        {userOpenShiftLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Memuat data...</p>
          </div>
        ) : !userOpenShiftData ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Shift kasir belum dibuka</p>
              <p className="text-sm text-gray-400">
                Silakan buka shift kasir terlebih dahulu di halaman Shift Kasir
              </p>
            </div>
          </div>
        ) : productsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 sm:h-36 lg:h-48" />
            ))}
          </div>
        ) : (
          <div className="relative flex-1 min-h-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4 overflow-y-auto flex-1 py-2">
              {products.map((product, index) => {
                const stockTrackingEnabled = product.enableStockTracking !== false;
                const stock = product.stock ?? 0;
                const isOutOfStock = stockTrackingEnabled && stock === 0;
                const isLowStock =
                  stockTrackingEnabled && stock > 0 && stock < product.minStockLevel;

                return (
                  <div
                    key={`${product.id}-${index}`}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={`relative border rounded-lg p-3 lg:p-4 cursor-pointer hover:shadow-md transition-all h-36 sm:h-40 lg:h-48 flex flex-col ${
                      isLowStock ? 'bg-red-50 border-red-200' : ''
                    } ${isOutOfStock ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed' : 'hover:border-primary'}`}
                  >
                    <div className="h-14 sm:h-16 lg:h-20 bg-gray-100 rounded-md mb-2 lg:mb-3 flex items-center justify-center">
                      <Receipt className="h-6 w-6 lg:h-8 lg:w-8 text-gray-400" />
                    </div>
                    <h5 className="font-medium text-xs lg:text-sm truncate">{product.nama}</h5>
                    <p className="text-[10px] lg:text-xs text-gray-500 truncate">{product.sku}</p>
                    <div className="flex justify-between items-end mt-auto">
                      <p className="font-bold text-xs lg:text-base text-primary truncate">
                        {formatRupiah(product.hargaJual)}
                      </p>
                      {!stockTrackingEnabled ? (
                        <></>
                      ) : isOutOfStock ? (
                        <p className="text-[10px] lg:text-xs font-medium text-gray-500 shrink-0">
                          Habis
                        </p>
                      ) : (
                        <span
                          className={`text-[10px] lg:text-xs font-bold shrink-0 ${
                            isLowStock ? 'text-red-500' : 'text-gray-600'
                          }`}
                        >
                          Stok: {stock}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {productsData?.meta && productsData.meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 sm:gap-2 py-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  {(() => {
                    const totalPages = productsData.meta.totalPages;
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
                        <span
                          key={`ellipsis-${index}`}
                          className="px-1.5 sm:px-2 text-xs sm:text-sm text-gray-500"
                        >
                          ...
                        </span>
                      ) : (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page as number)}
                          className="w-7 sm:w-9 text-xs sm:text-sm"
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
                  disabled={currentPage === productsData.meta.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="hidden md:flex w-40 lg:w-60 xl:w-80 border-l bg-white flex-col h-full">
        <div className="p-2 lg:p-3 xl:p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 xl:gap-2 min-w-0">
              <ShoppingCart className="h-3.5 w-3.5 lg:h-4 lg:w-4 xl:h-5 xl:w-5 shrink-0" />
              <h4 className="font-semibold m-0 text-[11px] lg:text-xs xl:text-base truncate">
                Keranjang
              </h4>
            </div>
            {cartItemCount > 0 && (
              <span className="bg-primary text-primary-foreground text-[9px] xl:text-xs font-bold rounded-full h-4 min-w-4 xl:h-5 xl:min-w-5 px-1 xl:px-1.5 flex items-center justify-center shrink-0">
                {cartItemCount}
              </span>
            )}
          </div>
        </div>
        <CartContent />
      </div>
      <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
        <SheetContent side="right" className="w-[85vw] sm:w-[400px] p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Keranjang
              {cartItemCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </SheetTitle>
          </SheetHeader>
          <CartContent isSheet />
        </SheetContent>
      </Sheet>
      {isMobile && (
        <button
          onClick={() => setMobileCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-primary text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95 cursor-pointer"
        >
          <ShoppingCart className="h-6 w-6" />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </button>
      )}
      <Dialog
        open={checkoutOpen}
        onOpenChange={(open) => {
          setCheckoutOpen(open);
          if (!open) {
            setEditingOpenBillId(null);
          }
        }}
      >
        <DialogContent className="w-[120vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {checkoutMode === 'select' && 'Checkout'}
              {checkoutMode === 'checkout' && 'Bayar Sekarang'}
              {checkoutMode === 'hold' && 'Open Bills'}
              {checkoutMode === 'pay-openbill' && 'Bayar Bill'}
            </DialogTitle>
          </DialogHeader>

          {checkoutMode === 'select' && (
            <div className="flex flex-col sm:flex-row gap-3 py-4">
              <Button
                size="lg"
                onClick={() => setCheckoutMode('checkout')}
                className="flex-1 h-auto py-6 text-lg"
              >
                Bayar Sekarang
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setCheckoutMode('hold')}
                className="flex-1 h-auto py-6 text-lg"
              >
                Open Bills
              </Button>
            </div>
          )}

          {checkoutMode === 'checkout' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="border rounded-lg p-3 md:p-4">
                  <h5 className="font-semibold mb-3 text-sm md:text-base">Ringkasan Pesanan</h5>
                  <div className="space-y-3 max-h-48 md:max-h-64 overflow-y-auto mb-4">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex justify-between text-sm">
                        <span className="text-gray-600 truncate mr-2">
                          {item.product.nama} x {item.quantity}
                        </span>
                        <span className="shrink-0">{formatRupiah(item.total)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 text-sm border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal</span>
                      <span>{formatRupiah(subtotal)}</span>
                    </div>
                    {jumlahPajak > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Pajak</span>
                        <span>{formatRupiah(jumlahPajak)}</span>
                      </div>
                    )}
                    {discountBreakdown.length > 0 &&
                      discountBreakdown.map((discount) => (
                        <div key={discount.discountId} className="flex justify-between">
                          <span className="text-gray-500 truncate mr-2">
                            {discount.nama} ({discount.rate}%)
                          </span>
                          <span className="shrink-0">-{formatRupiah(discount.amount)}</span>
                        </div>
                      ))}
                    <div className="flex justify-between font-bold text-base md:text-lg border-t pt-2">
                      <span>Total</span>
                      <span>{formatRupiah(total)}</span>
                    </div>
                    {paymentMethods
                      .find((pm) => pm.id === selectedPaymentMethodId)
                      ?.nama?.toLowerCase() === 'tunai' &&
                      amountPaid &&
                      change >= 0 && (
                        <div className="flex justify-between font-bold text-base md:text-lg text-green-600 bg-green-50 p-2 md:p-3 rounded-lg">
                          <span>Kembalian</span>
                          <span>{formatRupiah(change)}</span>
                        </div>
                      )}
                  </div>
                </div>

                <div className="space-y-4">
                  {discounts.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Diskon</label>
                      <div className="border rounded-lg p-3 space-y-2">
                        {discounts.map((discount) => (
                          <div
                            key={discount.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <label className="flex items-center gap-2 cursor-pointer min-w-0">
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
                                className="rounded border-gray-300 shrink-0"
                              />
                              <span className="text-gray-600 truncate">
                                {discount.nama} ({discount.rate}%)
                              </span>
                            </label>
                            <span className="shrink-0 ml-2">
                              -
                              {formatRupiah(
                                discountBreakdown.find((d) => d.discountId === discount.id)
                                  ?.amount || 0
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Metode Pembayaran</label>
                    <Select
                      value={selectedPaymentMethodId}
                      onValueChange={setSelectedPaymentMethodId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih metode pembayaran" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((pm) => (
                          <SelectItem key={pm.id} value={pm.id}>
                            {pm.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentMethods
                    .find((pm) => pm.id === selectedPaymentMethodId)
                    ?.nama?.toLowerCase() === 'tunai' && (
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
                      <div className="flex flex-wrap gap-2">
                        {[5000, 10000, 20000, 50000, 100000].map((amount) => (
                          <Button
                            key={amount}
                            variant="outline"
                            size="default"
                            onClick={() => setAmountPaid(String(amount))}
                            className="text-xs flex-1 basis-[calc(50%-0.25rem)] sm:basis-[calc(20%-0.4rem)]"
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nomor Antrian </label>
                    <Input
                      value={nomorAntrian}
                      onChange={(e) => setNomorAntrian(e.target.value)}
                      placeholder="Masukkan nomor antrian..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nama Pelanggan</label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Masukkan nama pelanggan..."
                    />
                  </div>

                  {tenantData?.settings?.enableOrderTipe && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tipe Pesanan</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="orderType"
                            value="dine_in"
                            checked={orderType === 'dine_in'}
                            onChange={() => setOrderType('dine_in')}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Makan di Tempat</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="orderType"
                            value="take_away"
                            checked={orderType === 'take_away'}
                            onChange={() => setOrderType('take_away')}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Bawa Pulang</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCheckoutMode('select');
                  }}
                  className="w-full sm:w-auto"
                >
                  Kembali
                </Button>
                <Button
                  onClick={() => {
                    if (editingOpenBillId) {
                      handleCloseOpenBill();
                    } else {
                      handleCheckout();
                    }
                  }}
                  className="w-full sm:w-auto"
                  disabled={
                    createOrderMutation.isPending ||
                    closeOpenBillMutation.isPending ||
                    (paymentMethods
                      .find((pm) => pm.id === selectedPaymentMethodId)
                      ?.nama?.toLowerCase() === 'tunai' &&
                      amountPaidNum < total)
                  }
                >
                  {createOrderMutation.isPending || closeOpenBillMutation.isPending
                    ? 'Memproses...'
                    : 'Simpan Pesanan'}
                </Button>
              </DialogFooter>
            </>
          )}

          {checkoutMode === 'hold' && (
            <>
              <div className="space-y-4">
                {editingOpenBillId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    <p>Mode edit: menambahkan item ke bill yang ada</p>
                    <Button
                      size="sm"
                      variant="link"
                      className="p-0 h-auto text-blue-600 underline"
                      onClick={() => {
                        setEditingOpenBillId(null);
                      }}
                    >
                      Batal edit
                    </Button>
                  </div>
                )}
                <Button
                  onClick={() => {
                    if (cart.length === 0) {
                      alert('Keranjang belanja kosong');
                      return;
                    }
                    if (editingOpenBillId) {
                      const orderItems = cart.map((item) => ({
                        productId: item.product.id,
                        quantity: item.quantity,
                        hargaSatuan: item.hargaSatuan,
                        jumlahDiskon: item.jumlahDiskon,
                        total: item.total,
                      }));
                      holdBillMutation.mutate({
                        tenantId: tenantId!,
                        outletId: outletId!,
                        subtotal: String(subtotal),
                        jumlahPajak: String(jumlahPajak),
                        jumlahDiskon: String(discountAmount),
                        diskonBreakdown: discountBreakdown,
                        paymentMethodId: selectedPaymentMethodId || null,
                        total: String(total),
                        notes: notes || null,
                        nomorAntrian: null,
                        items: orderItems,
                        editingOpenBillId: editingOpenBillId,
                      });
                    } else {
                      setHoldNomorAntrian('');
                      setHoldNomorAntrianDialogOpen(true);
                    }
                  }}
                  disabled={holdBillMutation.isPending}
                  className="w-full"
                >
                  {holdBillMutation.isPending
                    ? 'Memproses...'
                    : editingOpenBillId
                      ? 'Simpan Perubahan'
                      : '+ Tambah Bill Baru'}
                </Button>

                {openBills.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Belum ada bill yang ditahan</p>
                    <p className="text-sm">Open bill untuk melanjutkan nanti</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 md:max-h-96 overflow-y-auto">
                    {openBills.map((openBill) => (
                      <div
                        key={openBill.id}
                        className="border rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm">
                              {openBill.orderNumber}
                            </span>
                            <span className="text-xs text-gray-500">
                              {openBill.orderItems?.length || 0} items
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {openBill.notes || openBill.nomorAntrian || '-'}
                          </div>
                          <div className="font-bold text-primary">
                            {formatRupiah(Number(openBill.total))}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              if (openBill.orderItems && openBill.orderItems.length > 0) {
                                const cartItems: CartItem[] = openBill.orderItems.map((item) => ({
                                  product: item.product as Product,
                                  quantity: item.quantity,
                                  hargaSatuan: item.hargaSatuan,
                                  jumlahDiskon: item.jumlahDiskon,
                                  total: item.total,
                                }));
                                setCart((prevCart) => {
                                  const mergedCart = [...prevCart];
                                  for (const newItem of cartItems) {
                                    const existingIndex = mergedCart.findIndex(
                                      (item) => item.product.id === newItem.product.id
                                    );
                                    if (existingIndex >= 0) {
                                      mergedCart[existingIndex] = {
                                        ...mergedCart[existingIndex],
                                        quantity:
                                          mergedCart[existingIndex].quantity + newItem.quantity,
                                        total: String(
                                          Number(mergedCart[existingIndex].hargaSatuan) *
                                            (mergedCart[existingIndex].quantity + newItem.quantity)
                                        ),
                                      };
                                    } else {
                                      mergedCart.push(newItem);
                                    }
                                  }
                                  return mergedCart;
                                });
                                setEditingOpenBillId(openBill.id);
                                setCheckoutOpen(false);
                                toast.success('Item ditambahkan ke keranjang');
                              } else {
                                alert('Bill ini tidak memiliki item');
                              }
                            }}
                          >
                            Tambah Item
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCheckoutMode('select');
                  }}
                  className="w-full"
                >
                  Kembali
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={holdNomorAntrianDialogOpen} onOpenChange={setHoldNomorAntrianDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[400px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Bill Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nomor Antrian</label>
              <Input
                value={holdNomorAntrian}
                onChange={(e) => setHoldNomorAntrian(e.target.value)}
                placeholder="Masukkan nomor antrian..."
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setHoldNomorAntrianDialogOpen(false);
                setHoldNomorAntrian('');
              }}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                if (!holdNomorAntrian.trim()) {
                  alert('Nomor antrian harus diisi');
                  return;
                }
                const orderItems = cart.map((item) => ({
                  productId: item.product.id,
                  quantity: item.quantity,
                  hargaSatuan: item.hargaSatuan,
                  jumlahDiskon: item.jumlahDiskon,
                  total: item.total,
                }));
                holdBillMutation.mutate({
                  tenantId: tenantId!,
                  outletId: outletId!,
                  subtotal: String(subtotal),
                  jumlahPajak: String(jumlahPajak),
                  jumlahDiskon: String(discountAmount),
                  diskonBreakdown: discountBreakdown,
                  paymentMethodId: selectedPaymentMethodId || null,
                  total: String(total),
                  notes: notes || null,
                  nomorAntrian: holdNomorAntrian,
                  items: orderItems,
                });
                setHoldNomorAntrianDialogOpen(false);
                setHoldNomorAntrian('');
              }}
              disabled={holdBillMutation.isPending || !holdNomorAntrian.trim()}
              className="w-full sm:w-auto"
            >
              {holdBillMutation.isPending ? 'Memproses...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={closeShiftOpen} onOpenChange={setCloseShiftOpen}>
        <DialogContent className="w-[95vw] max-w-[400px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tutup Shift Kasir</DialogTitle>
          </DialogHeader>
          {userOpenShiftData && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Jumlah Buka:</span>
                  <span className="font-medium">{formatRupiah(userOpenShiftData.jumlahBuka)}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Jumlah Tutup (Kas di akhir)</label>
                  <CurrencyInput placeholder="0" value={jumlahTutup} onChange={setJumlahTutup} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Catatan</label>
                  <Input
                    placeholder="Masukkan catatan"
                    value={shiftNotes}
                    onChange={(e) => setShiftNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  disabled={closeShiftMutation.isPending || !jumlahTutup}
                  onClick={() => {
                    if (userOpenShiftData) {
                      closeShiftMutation.mutate({
                        id: userOpenShiftData.id,
                        jumlahTutup,
                        catatan: shiftNotes,
                      });
                    }
                  }}
                >
                  {closeShiftMutation.isPending ? 'Menutup...' : 'Tutup Shift'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="w-[95vw] max-w-md overflow-y-auto">
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
            {lastOrder?.nomorAntrian && (
              <p className="text-sm text-gray-500">
                No. Antrian: <span className="font-mono font-bold">{lastOrder.nomorAntrian}</span>
              </p>
            )}
            {lastOrder?.nama && (
              <p className="text-sm text-gray-500">
                Pelanggan: <span className="font-mono font-bold">{lastOrder.nama}</span>
              </p>
            )}
            {lastOrder?.tipe && (
              <p className="text-sm text-gray-500">
                Tipe:{' '}
                <span className="font-mono font-bold">
                  {lastOrder.tipe === 'dine_in' ? 'Makan di Tempat' : 'Bawa Pulang'}
                </span>
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
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
            <h2 className="font-bold text-lg">Toko</h2>
            <p className="text-xs">{selectedOutletName || ''}</p>
            <p className="text-xs">No. {lastOrder.orderNumber}</p>
            {lastOrder.nomorAntrian && (
              <p className="text-xs">No. Antrian: {lastOrder.nomorAntrian}</p>
            )}
            {lastOrder.nama && <p className="text-xs">Pelanggan: {lastOrder.nama}</p>}
            <p className="text-xs">
              Tipe: {lastOrder.tipe === 'dine_in' ? 'Makan di Tempat' : 'Bawa Pulang'}
            </p>
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
            {lastOrder.jumlahPajak > 0 && (
              <div className="flex justify-between">
                <span>Pajak</span>
                <span>{formatRupiah(lastOrder.jumlahPajak)}</span>
              </div>
            )}
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
      <Dialog open={openBillsDialogOpen} onOpenChange={setOpenBillsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Open Bill</DialogTitle>
          </DialogHeader>
          {openBills.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Belum ada bill yang ditahan</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {openBills.map((openBill) => (
                <div
                  key={openBill.id}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">{openBill.orderNumber}</span>
                      <span className="text-xs text-gray-500">
                        {openBill.orderItems?.length || 0} items
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {openBill.notes || openBill.nomorAntrian || '-'}
                    </div>
                    <div className="font-bold text-primary mt-1">
                      {formatRupiah(Number(openBill.total))}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(openBill.createdAt).toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedOpenBillForDetail(openBill);
                        setOpenBillDetailDialogOpen(true);
                      }}
                    >
                      Detail
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenBillsDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={openBillDetailDialogOpen} onOpenChange={setOpenBillDetailDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Bill</DialogTitle>
          </DialogHeader>
          {selectedOpenBillForDetail && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Order Number:</span>
                  <span className="font-mono font-medium">
                    {selectedOpenBillForDetail.orderNumber}
                  </span>
                </div>
                {selectedOpenBillForDetail.nomorAntrian && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Nomor Antrian:</span>
                    <span className="font-medium">{selectedOpenBillForDetail.nomorAntrian}</span>
                  </div>
                )}
                {selectedOpenBillForDetail.notes && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Catatan:</span>
                    <span className="font-medium">{selectedOpenBillForDetail.notes}</span>
                  </div>
                )}
              </div>
              <div className="border rounded-lg divide-y">
                {selectedOpenBillForDetail.orderItems &&
                selectedOpenBillForDetail.orderItems.length > 0 ? (
                  selectedOpenBillForDetail.orderItems.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {(item.product as Product)?.nama || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.quantity} x {formatRupiah(item.hargaSatuan)}
                        </p>
                      </div>
                      <span className="font-medium text-sm">{formatRupiah(item.total)}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-gray-500 text-sm">Tidak ada item</div>
                )}
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-3">
                <span>Total</span>
                <span className="text-primary">
                  {formatRupiah(Number(selectedOpenBillForDetail.total))}
                </span>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenBillDetailDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Tutup
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedOpenBillForDetail && confirm('Batalkan bill ini?')) {
                  cancelOpenBillMutation.mutate(selectedOpenBillForDetail.id);
                  setOpenBillDetailDialogOpen(false);
                  setOpenBillsDialogOpen(false);
                }
              }}
              disabled={cancelOpenBillMutation.isPending}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                if (selectedOpenBillForDetail) {
                  const openBillId = selectedOpenBillForDetail.id;
                  const orderItems = selectedOpenBillForDetail.orderItems;
                  const cartItems: CartItem[] =
                    orderItems && orderItems.length > 0
                      ? orderItems.map((item) => ({
                          product: item.product as Product,
                          quantity: item.quantity,
                          hargaSatuan: item.hargaSatuan,
                          jumlahDiskon: item.jumlahDiskon,
                          total: item.total,
                        }))
                      : [];
                  setCart(cartItems);
                  setEditingOpenBillId(openBillId);
                  setOpenBillDetailDialogOpen(false);
                  setOpenBillsDialogOpen(false);
                  setNomorAntrian(selectedOpenBillForDetail.nomorAntrian || '');
                  setNotes(selectedOpenBillForDetail.notes || '');
                  setCheckoutMode('checkout');
                  setCheckoutOpen(true);
                }
              }}
              className="w-full sm:w-auto"
            >
              Bayar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const Route = createFileRoute('/_protected/(tenant)/pos/')({
  component: PosPage,
  beforeLoad: async () => {
    await checkPermissionWithScope('orders', 'create', 'tenant');
  },
});
