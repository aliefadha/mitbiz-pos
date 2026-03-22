import { DB_CONNECTION } from '@/db/db.module';
import { user as userSchema } from '@/db/schema/auth-schema';
import { outlets } from '@/db/schema/outlet-schema';
import { paymentMethods } from '@/db/schema/payment-method-schema';
import { rolePermissions } from '@/db/schema/role-permission-schema';
import { roles } from '@/db/schema/role-schema';
import { tenants } from '@/db/schema/tenant-schema';
import type { DrizzleDB } from '@/db/type';
import { auth } from '@/lib/auth';
import { ScopeType } from '@/rbac/types/rbac.types';
import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const TEMPLATE_OWNER_ROLE_ID = '00000000-0000-0000-0000-000000000010';
const TEMPLATE_CASHIER_ROLE_ID = '00000000-0000-0000-0000-000000000011';

export const RegisterCompleteSchema = z.object({
  account: z.object({
    name: z.string().min(1, 'Name is required').max(255),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
  tenant: z.object({
    nama: z.string().min(1, 'Tenant name is required').max(255),
    slug: z
      .string()
      .min(1, 'Slug is required')
      .max(100)
      .regex(/^[a-zA-Z0-9-]+$/, 'Slug must contain only letters, numbers, and hyphens'),
    alamat: z.string().max(500).optional().nullable(),
    noHp: z.string().max(20).optional().nullable(),
  }),
  outlet: z.object({
    nama: z.string().min(1, 'Outlet name is required').max(255),
    kode: z.string().min(1, 'Outlet code is required').max(50),
    alamat: z.string().max(500).optional().nullable(),
    noHp: z.string().max(20).optional().nullable(),
  }),
});

export type RegisterCompleteInput = z.infer<typeof RegisterCompleteSchema>;

@Injectable()
export class RegisterService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) {}

  async registerComplete(input: RegisterCompleteInput) {
    const { account, tenant, outlet } = input;

    // Pre-validate uniqueness before creating user
    await this.validateUniqueness(tenant.slug, outlet.kode);

    // Create user via Better Auth (outside transaction since it uses different connection)
    const result = await auth.api.signUpEmail({
      body: {
        name: account.name,
        email: account.email,
        password: account.password,
        roleId: TEMPLATE_OWNER_ROLE_ID,
        callbackURL: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email`,
      },
    });

    if (!result.user) {
      throw new ConflictException('Failed to create user');
    }

    const userId = result.user.id;

    // Wrap all database operations in a transaction
    return await this.db.transaction(async (tx) => {
      const [newTenant] = await tx
        .insert(tenants)
        .values({
          nama: tenant.nama,
          slug: tenant.slug.toLowerCase(),
          userId: userId,
          alamat: tenant.alamat || null,
          noHp: tenant.noHp || null,
          isActive: true,
          settings: {
            taxRate: 11,
            receiptFooter: 'Terima kasih telah berbelanja',
          },
        })
        .returning();

      await tx.insert(paymentMethods).values([
        { tenantId: newTenant.id, nama: 'Tunai' },
        { tenantId: newTenant.id, nama: 'QRIS' },
      ]);

      await tx
        .update(userSchema)
        .set({
          tenantId: newTenant.id,
        })
        .where(eq(userSchema.id, userId));

      const [newOutlet] = await tx
        .insert(outlets)
        .values({
          tenantId: newTenant.id,
          nama: outlet.nama,
          kode: outlet.kode.toLowerCase(),
          alamat: outlet.alamat || null,
          noHp: outlet.noHp || null,
          isActive: true,
        })
        .returning();

      // Clone template roles with permissions
      await this.cloneTemplateRoles(tx, newTenant.id, userId);

      return {
        tenant: newTenant,
        outlet: newOutlet,
      };
    });
  }

  /**
   * Pre-validate uniqueness before starting registration
   * Checks tenant slug (globally unique) and outlet kode (unique per tenant)
   */
  private async validateUniqueness(slug: string, kode: string): Promise<void> {
    // Check if tenant slug already exists globally
    const existingTenant = await this.db.query.tenants.findFirst({
      where: eq(tenants.slug, slug.toLowerCase()),
    });

    if (existingTenant) {
      throw new ConflictException(`Tenant with slug '${slug}' already exists`);
    }

    // Note: We can't check outlet kode uniqueness here without tenant ID
    // The database unique constraint (tenant_id, kode) will catch this during transaction
    // Alternatively, we could check if any tenant already has this kode,
    // but that's unlikely to be an issue in practice
  }

  /**
   * Clone template roles (owner and cashier) with their permissions to a new tenant
   * Updates the user with the new owner role
   */
  private async cloneTemplateRoles(tx: DrizzleDB, tenantId: string, userId: string): Promise<void> {
    // Fetch template roles
    const [templateOwnerRole, templateCashierRole] = await Promise.all([
      tx.query.roles.findFirst({
        where: eq(roles.id, TEMPLATE_OWNER_ROLE_ID),
      }),
      tx.query.roles.findFirst({
        where: eq(roles.id, TEMPLATE_CASHIER_ROLE_ID),
      }),
    ]);

    // Fetch template permissions
    const [templateOwnerPermissions, templateCashierPermissions] = await Promise.all([
      tx.query.rolePermissions.findMany({
        where: eq(rolePermissions.roleId, TEMPLATE_OWNER_ROLE_ID),
      }),
      tx.query.rolePermissions.findMany({
        where: eq(rolePermissions.roleId, TEMPLATE_CASHIER_ROLE_ID),
      }),
    ]);

    // Clone owner role
    if (templateOwnerRole) {
      const [newOwnerRole] = await tx
        .insert(roles)
        .values({
          name: templateOwnerRole.name,
          scope: ScopeType.TENANT,
          tenantId: tenantId,
          description: templateOwnerRole.description,
          isActive: true,
          isDefault: true,
        })
        .returning();

      if (newOwnerRole && templateOwnerPermissions.length > 0) {
        await tx.insert(rolePermissions).values(
          templateOwnerPermissions.map((perm) => ({
            roleId: newOwnerRole.id,
            resource: perm.resource,
            action: perm.action,
          })),
        );
      }

      // Update user with new owner role
      await tx
        .update(userSchema)
        .set({
          roleId: newOwnerRole.id,
        })
        .where(eq(userSchema.id, userId));
    }

    // Clone cashier role with permissions
    if (templateCashierRole) {
      const [newCashierRole] = await tx
        .insert(roles)
        .values({
          name: templateCashierRole.name,
          scope: ScopeType.TENANT,
          tenantId: tenantId,
          description: templateCashierRole.description,
          isActive: true,
          isDefault: false,
        })
        .returning();

      // Clone cashier permissions (this was missing before!)
      if (newCashierRole && templateCashierPermissions.length > 0) {
        await tx.insert(rolePermissions).values(
          templateCashierPermissions.map((perm) => ({
            roleId: newCashierRole.id,
            resource: perm.resource,
            action: perm.action,
          })),
        );
      }
    }
  }
}
