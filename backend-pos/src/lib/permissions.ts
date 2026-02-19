import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements as defaultAdminStatement } from 'better-auth/plugins/admin/access';

const statement = {
  users: ['create', 'read', 'update', 'delete'],
  products: ['create', 'read', 'update', 'delete'],
  categories: ['create', 'read', 'update', 'delete'],
  transaction: ['create', 'read', 'update', 'delete', 'refund'],
  outlets: ['create', 'read', 'update', 'delete'],
  tenants: ['create', 'read', 'update', 'delete'],
  stocks: ['create', 'read', 'update', 'delete'],
  stockAdjustments: ['create', 'read', 'update', 'delete'],
  report: ['read', 'export'],
  settings: ['read', 'update'],
} as const;

export const ac = createAccessControl(statement);

export const adminRole = ac.newRole({
  ...defaultAdminStatement,
  users: ['create', 'read', 'update', 'delete'],
  products: ['create', 'read', 'update', 'delete'],
  categories: ['create', 'read', 'update', 'delete'],
  transaction: ['create', 'read', 'update', 'delete', 'refund'],
  outlets: ['create', 'read', 'update', 'delete'],
  report: ['read', 'export'],
  settings: ['read', 'update'],
  tenants: ['create', 'read', 'update', 'delete'],
  stocks: ['create', 'read', 'update', 'delete'],
  stockAdjustments: ['create', 'read', 'update', 'delete'],
});

export const ownerRole = ac.newRole({
  users: ['create', 'read'],
  products: ['create', 'read', 'update', 'delete'],
  categories: ['create', 'read', 'update', 'delete'],
  transaction: ['create', 'read', 'update', 'delete', 'refund'],
  outlets: ['create', 'read', 'update', 'delete'],
  report: ['read', 'export'],
  settings: ['read', 'update'],
  tenants: ['create', 'read', 'update'],
  stocks: ['create', 'read', 'update', 'delete'],
  stockAdjustments: ['create', 'read', 'update', 'delete'],
});

export const cashierRole = ac.newRole({
  products: ['read'],
  categories: ['read'],
  transaction: ['create', 'read', 'refund'],
  outlets: ['read'],
  report: ['read'],
  settings: ['read'],
  tenants: ['read'],
  stocks: ['read'],
  stockAdjustments: ['read'],
});
