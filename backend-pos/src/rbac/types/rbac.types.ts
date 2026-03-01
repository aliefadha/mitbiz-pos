export enum ScopeType {
  GLOBAL = 'global',
  TENANT = 'tenant',
}

export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  REFUND = 'refund',
  EXPORT = 'export',
}

export const RESOURCES = [
  'users',
  'user',
  'products',
  'categories',
  'transaction',
  'outlets',
  'tenants',
  'stocks',
  'stockAdjustments',
  'orders',
  'orderItems',
  'report',
  'settings',
  'taxes',
  'discounts',
  'paymentMethods',
  'cashShifts',
  'dashboard',
  'sales',
] as const;

export type Resource = (typeof RESOURCES)[number];

export interface Permission {
  resource: Resource | string;
  actions: Action[];
}

export interface RoleWithPermissions {
  id: string;
  name: string;
  scope: ScopeType;
  tenantId: string | null;
  permissions: Permission[];
}

export interface UserSession {
  id: string;
  email: string;
  roleId: string | null;
  outletId: string | null;
  isSubscribed: boolean;
}

export const CONTROLLER_TO_RESOURCE: Record<string, string> = {
  'stock-adjustments': 'stockAdjustments',
  'order-items': 'orderItems',
  'payment-methods': 'paymentMethods',
  'cash-shifts': 'cashShifts',
  users: 'users',
  user: 'user',
};

export const METHOD_TO_ACTION: Record<string, Action> = {
  GET: Action.READ,
  POST: Action.CREATE,
  PATCH: Action.UPDATE,
  PUT: Action.UPDATE,
  DELETE: Action.DELETE,
};
