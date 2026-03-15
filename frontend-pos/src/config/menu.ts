import {
  ChartBar,
  Clock4,
  CreditCard,
  FileText,
  Folder,
  History,
  LayoutDashboard,
  Package,
  Package2,
  Percent,
  Settings,
  Store,
  Users,
} from 'lucide-react';
import type { UserScope } from '@/lib/permissions';

export interface MenuItem {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  permissions: { resource: string; actions: string[] }[];
  scope?: UserScope;
}

export interface MenuGroup {
  group: string;
  items: MenuItem[];
}

export const menuConfig: MenuGroup[] = [
  // ============ TENANT SCOPE ============
  {
    group: 'Dashboard',
    items: [
      {
        key: '/dashboard',
        icon: LayoutDashboard,
        label: 'Dashboard',
        permissions: [{ resource: 'dashboard', actions: ['read'] }],
        scope: 'tenant',
      },
      {
        key: '/laporan',
        icon: FileText,
        label: 'Laporan',
        permissions: [{ resource: 'report', actions: ['read'] }],
        scope: 'tenant',
      },
      {
        key: '/cash-shifts',
        icon: Clock4,
        label: 'Shift Kasir',
        permissions: [{ resource: 'cashShifts', actions: ['read'] }],
        scope: 'tenant',
      },
    ],
  },
  // ============ GLOBAL SCOPE ============
  {
    group: 'Dashboard',
    items: [
      {
        key: '/admin',
        icon: LayoutDashboard,
        label: 'Dashboard',
        permissions: [{ resource: 'dashboard', actions: ['read'] }],
        scope: 'global',
      },
      {
        key: '/all-users',
        icon: Users,
        label: 'Manajemen User',
        permissions: [{ resource: 'users', actions: ['read', 'create', 'list'] }],
        scope: 'global',
      },
      {
        key: '/subscriptions',
        icon: CreditCard,
        label: 'Paket Langganan',
        permissions: [{ resource: 'users', actions: ['read', 'create', 'list'] }],
        scope: 'global',
      },
      {
        key: '/reports',
        icon: History,
        label: 'Laporan',
        permissions: [{ resource: 'users', actions: ['read', 'create', 'list'] }],
        scope: 'global',
      },
      {
        key: '/setting',
        icon: Settings,
        label: 'Pengaturan',
        permissions: [{ resource: 'users', actions: ['read', 'create', 'list'] }],
        scope: 'global',
      },
    ],
  },
  {
    group: 'Master Data',
    items: [
      {
        key: '/outlets',
        icon: Store,
        label: 'Outlet',
        permissions: [{ resource: 'outlets', actions: ['read'] }],
        scope: 'tenant',
      },
      {
        key: '/users',
        icon: Users,
        label: 'Pengguna',
        permissions: [{ resource: 'users', actions: ['read', 'create', 'list'] }],
        scope: 'tenant',
      },
      {
        key: '/categories',
        icon: Folder,
        label: 'Kategori',
        permissions: [{ resource: 'categories', actions: ['read'] }],
        scope: 'tenant',
      },
      {
        key: '/products',
        icon: Package,
        label: 'Produk',
        permissions: [{ resource: 'products', actions: ['read'] }],
        scope: 'tenant',
      },
      {
        key: '/discounts',
        icon: Percent,
        label: 'Diskon',
        permissions: [{ resource: 'discounts', actions: ['read'] }],
        scope: 'tenant',
      },
      {
        key: '/payment-methods',
        icon: CreditCard,
        label: 'Metode Pembayaran',
        permissions: [{ resource: 'paymentMethods', actions: ['read'] }],
        scope: 'tenant',
      },
    ],
  },
  {
    group: 'Inventory',
    items: [
      {
        key: '/stocks',
        icon: Package2,
        label: 'Stok',
        permissions: [
          { resource: 'stocks', actions: ['read'] },
          { resource: 'products', actions: ['read'] },
        ],
        scope: 'tenant',
      },
      {
        key: '/stock-adjustment',
        icon: ChartBar,
        label: 'Penyesuaian Stok',
        permissions: [
          { resource: 'stockAdjustments', actions: ['read'] },
          { resource: 'products', actions: ['read'] },
        ],
        scope: 'tenant',
      },
    ],
  },
  {
    group: 'Pengaturan',
    items: [
      {
        key: '/settings',
        icon: Settings,
        label: 'Pengaturan',
        permissions: [{ resource: 'tenant', actions: ['read'] }],
        scope: 'tenant',
      },
      {
        key: '/orders',
        icon: History,
        label: 'Riwayat Transaksi',
        permissions: [{ resource: 'orders', actions: ['read'] }],
        scope: 'tenant',
      },
    ],
  },
];
