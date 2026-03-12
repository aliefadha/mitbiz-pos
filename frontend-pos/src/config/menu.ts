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
  {
    group: 'Dashboard',
    items: [
      {
        key: '/dashboard',
        icon: LayoutDashboard,
        label: 'Dashboard',
        permissions: [{ resource: 'dashboard', actions: ['read'] }],
      },
      {
        key: '/laporan',
        icon: FileText,
        label: 'Laporan',
        permissions: [{ resource: 'report', actions: ['read'] }],
      },
      {
        key: '/cash-shifts',
        icon: Clock4,
        label: 'Shift Kasir',
        permissions: [{ resource: 'cashShifts', actions: ['read'] }],
      },
    ],
  },
  {
    group: 'Master Data',
    items: [
      {
        key: '/tenants',
        icon: Users,
        label: 'Tenant',
        permissions: [{ resource: 'tenants', actions: ['read'] }],
        scope: 'global',
      },
      {
        key: '/outlets',
        icon: Store,
        label: 'Outlet',
        permissions: [{ resource: 'outlets', actions: ['read'] }],
      },
      {
        key: '/users',
        icon: Users,
        label: 'Pengguna',
        permissions: [{ resource: 'users', actions: ['read', 'create', 'list'] }],
      },
      {
        key: '/categories',
        icon: Folder,
        label: 'Kategori',
        permissions: [{ resource: 'categories', actions: ['read'] }],
      },
      {
        key: '/products',
        icon: Package,
        label: 'Produk',
        permissions: [{ resource: 'products', actions: ['read'] }],
      },
      {
        key: '/discounts',
        icon: Percent,
        label: 'Diskon',
        permissions: [{ resource: 'discounts', actions: ['read'] }],
      },
      {
        key: '/payment-methods',
        icon: CreditCard,
        label: 'Metode Pembayaran',
        permissions: [{ resource: 'paymentMethods', actions: ['read'] }],
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
      },
      {
        key: '/stock-adjustment',
        icon: ChartBar,
        label: 'Penyesuaian Stok',
        permissions: [
          { resource: 'stockAdjustments', actions: ['read'] },
          { resource: 'products', actions: ['read'] },
        ],
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
        permissions: [{ resource: 'settings', actions: ['read'] }],
      },
      {
        key: '/orders',
        icon: History,
        label: 'Riwayat Transaksi',
        permissions: [{ resource: 'orders', actions: ['read'] }],
      },
    ],
  },
];
