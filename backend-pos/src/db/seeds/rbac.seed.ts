import { db } from '@/db';
import { resources, rolePermissions, roles } from '@/db/schema';
import { Action, ScopeType } from '@/rbac/types/rbac.types';

const GLOBAL_ADMIN_ROLE_ID = '00000000-0000-0000-0000-000000000001';
const GLOBAL_OWNER_ROLE_ID = '00000000-0000-0000-0000-000000000002';
const GLOBAL_CASHIER_ROLE_ID = '00000000-0000-0000-0000-000000000003';
const TEMPLATE_OWNER_ROLE_ID = '00000000-0000-0000-0000-000000000010';
const TEMPLATE_CASHIER_ROLE_ID = '00000000-0000-0000-0000-000000000011';

const defaultRoles = [
  {
    id: GLOBAL_ADMIN_ROLE_ID,
    name: 'admin',
    scope: ScopeType.GLOBAL,
    description: 'Full system access',
    isDefault: false,
    isActive: true,
  },
  {
    id: GLOBAL_OWNER_ROLE_ID,
    name: 'owner',
    scope: ScopeType.GLOBAL,
    description: 'Tenant owner with full access to their organization',
    isDefault: true,
    isActive: true,
  },
  {
    id: GLOBAL_CASHIER_ROLE_ID,
    name: 'cashier',
    scope: ScopeType.GLOBAL,
    description: 'Cashier with limited access',
    isDefault: false,
    isActive: true,
  },
  {
    id: TEMPLATE_OWNER_ROLE_ID,
    name: 'owner',
    scope: ScopeType.TENANT,
    description: 'Tenant owner with full access to their organization',
    isDefault: true,
    isActive: true,
  },
  {
    id: TEMPLATE_CASHIER_ROLE_ID,
    name: 'cashier',
    scope: ScopeType.TENANT,
    description: 'Cashier with limited access',
    isDefault: false,
    isActive: true,
  },
];

const adminPermissions = [
  {
    resource: 'dashboard',
    actions: [Action.CREATE, Action.READ, Action.LIST, Action.UPDATE, Action.DELETE],
  },
  {
    resource: 'users',
    actions: [Action.CREATE, Action.READ, Action.LIST, Action.UPDATE, Action.DELETE],
  },
  {
    resource: 'user',
    actions: [Action.CREATE, Action.READ, Action.LIST, Action.UPDATE, Action.DELETE],
  },
  { resource: 'products', actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE] },
  { resource: 'categories', actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE] },
  {
    resource: 'transaction',
    actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.REFUND],
  },
  { resource: 'outlets', actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE] },
  { resource: 'tenants', actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE] },
  { resource: 'stocks', actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE] },
  {
    resource: 'stockAdjustments',
    actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
  },
  { resource: 'orders', actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE] },
  { resource: 'orderItems', actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE] },
  { resource: 'report', actions: [Action.READ, Action.EXPORT] },
  { resource: 'settings', actions: [Action.READ, Action.UPDATE] },
  { resource: 'discounts', actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE] },
  {
    resource: 'paymentMethods',
    actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
  },
  { resource: 'cashShifts', actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE] },
  { resource: 'sales', actions: [Action.READ] },
  { resource: 'roles', actions: [Action.READ, Action.CREATE, Action.UPDATE, Action.DELETE] },
  {
    resource: 'subscriptions',
    actions: [Action.READ, Action.CREATE, Action.UPDATE, Action.DELETE],
  },
  {
    resource: 'subscription_plans',
    actions: [Action.READ, Action.CREATE, Action.UPDATE, Action.DELETE],
  },
];

const ownerPermissions = [
  { resource: 'users', actions: [Action.CREATE, Action.READ, Action.LIST] },
  { resource: 'user', actions: [Action.CREATE, Action.READ, Action.LIST] },
  { resource: 'products', actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE] },
  { resource: 'categories', actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE] },
  {
    resource: 'transaction',
    actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.REFUND],
  },
  { resource: 'outlets', actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE] },
  { resource: 'stocks', actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE] },
  {
    resource: 'stockAdjustments',
    actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
  },
  { resource: 'orders', actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE] },
  { resource: 'orderItems', actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE] },
  { resource: 'report', actions: [Action.READ, Action.EXPORT] },
  { resource: 'settings', actions: [Action.READ, Action.UPDATE] },
  { resource: 'discounts', actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE] },
  {
    resource: 'paymentMethods',
    actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
  },
  { resource: 'cashShifts', actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE] },
  { resource: 'dashboard', actions: [Action.READ] },
  { resource: 'sales', actions: [Action.READ] },
  { resource: 'roles', actions: [Action.READ, Action.CREATE, Action.UPDATE, Action.DELETE] },
];

const cashierPermissions = [
  { resource: 'products', actions: [Action.READ] },
  { resource: 'categories', actions: [Action.READ] },
  { resource: 'transaction', actions: [Action.CREATE, Action.READ, Action.REFUND] },
  { resource: 'outlets', actions: [Action.READ] },
  { resource: 'tenants', actions: [Action.READ] },
  { resource: 'stocks', actions: [Action.READ] },
  {
    resource: 'stockAdjustments',
    actions: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
  },
  { resource: 'orders', actions: [Action.CREATE, Action.READ, Action.UPDATE] },
  { resource: 'orderItems', actions: [Action.CREATE, Action.READ] },
  { resource: 'report', actions: [Action.READ] },
  { resource: 'settings', actions: [Action.READ] },
  { resource: 'discounts', actions: [Action.READ, Action.UPDATE] },
  { resource: 'paymentMethods', actions: [Action.READ] },
  { resource: 'cashShifts', actions: [Action.CREATE, Action.READ, Action.UPDATE] },
  { resource: 'sales', actions: [Action.READ] },
];

async function seedRbac() {
  console.log('Seeding RBAC resources...');

  const defaultResources = [
    { name: 'users', description: 'User management' },
    { name: 'user', description: 'User operations' },
    { name: 'products', description: 'Product management' },
    { name: 'categories', description: 'Category management' },
    { name: 'transaction', description: 'Transaction operations' },
    { name: 'outlets', description: 'Outlet management' },
    { name: 'tenants', description: 'Tenant management' },
    { name: 'stocks', description: 'Stock management' },
    { name: 'stockAdjustments', description: 'Stock adjustment operations' },
    { name: 'orders', description: 'Order management' },
    { name: 'orderItems', description: 'Order item operations' },
    { name: 'report', description: 'Report access' },
    { name: 'settings', description: 'Settings management' },
    { name: 'discounts', description: 'Discount management' },
    { name: 'paymentMethods', description: 'Payment method management' },
    { name: 'cashShifts', description: 'Cash shift management' },
    { name: 'dashboard', description: 'Dashboard access' },
    { name: 'sales', description: 'Sales operations' },
    { name: 'roles', description: 'Roles management' },
  ];

  for (const resource of defaultResources) {
    await db.insert(resources).values(resource).onConflictDoNothing({
      target: resources.name,
    });
    console.log(`✓ Inserted resource: ${resource.name}`);
  }

  console.log('Seeding RBAC roles and permissions...');

  // Insert roles
  for (const role of defaultRoles) {
    await db.insert(roles).values(role).onConflictDoNothing({
      target: roles.id,
    });
    console.log(`✓ Inserted role: ${role.name}`);
  }

  // Insert permissions
  const rolePermissionsMap: Record<string, typeof adminPermissions> = {
    [GLOBAL_ADMIN_ROLE_ID]: adminPermissions,
    [GLOBAL_OWNER_ROLE_ID]: ownerPermissions,
    [GLOBAL_CASHIER_ROLE_ID]: cashierPermissions,
    [TEMPLATE_OWNER_ROLE_ID]: ownerPermissions,
    [TEMPLATE_CASHIER_ROLE_ID]: cashierPermissions,
  };

  for (const [roleId, permissions] of Object.entries(rolePermissionsMap)) {
    for (const perm of permissions) {
      for (const action of perm.actions) {
        await db
          .insert(rolePermissions)
          .values({
            roleId,
            resource: perm.resource,
            action,
          })
          .onConflictDoNothing();
      }
    }
    console.log(`✓ Inserted permissions for role: ${roleId}`);
  }

  console.log('✅ Seeding completed!');
}

export { seedRbac };
