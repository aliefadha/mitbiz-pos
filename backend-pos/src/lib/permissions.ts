import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements as defaultAdminStatement } from 'better-auth/plugins/admin/access';

const statement = {
  product: ['create', 'read', 'update', 'delete'],
  category: ['create', 'read', 'update', 'delete'],
  transaction: ['create', 'read', 'update', 'delete', 'refund'],
  outlet: ['create', 'read', 'update', 'delete'],
  tenant: ['create', 'read', 'update', 'delete'],
  report: ['read', 'export'],
  settings: ['read', 'update'],
} as const;

export const ac = createAccessControl(statement);

export const adminRole = ac.newRole({
  ...defaultAdminStatement,
  product: ['create', 'read', 'update', 'delete'],
  category: ['create', 'read', 'update', 'delete'],
  transaction: ['create', 'read', 'update', 'delete', 'refund'],
  outlet: ['create', 'read', 'update', 'delete'],
  report: ['read', 'export'],
  settings: ['read', 'update'],
  tenant: ['create', 'read', 'update', 'delete'],
});

export const ownerRole = ac.newRole({
  product: ['create', 'read', 'update', 'delete'],
  category: ['create', 'read', 'update', 'delete'],
  transaction: ['create', 'read', 'update', 'delete', 'refund'],
  outlet: ['create', 'read', 'update', 'delete'],
  report: ['read', 'export'],
  settings: ['read', 'update'],
  tenant: ['read', 'update'],
});

export const cashierRole = ac.newRole({
  product: ['read'],
  category: ['read'],
  transaction: ['create', 'read', 'refund'],
  outlet: ['read'],
  report: ['read'],
  settings: ['read'],
  tenant: ['read'],
});
