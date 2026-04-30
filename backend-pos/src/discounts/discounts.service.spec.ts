import { resolve } from 'node:path';
import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { discountProducts, discounts } from '@/db/schema/discount-schema';
import { products } from '@/db/schema/product-schema';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import { vi } from 'vitest';
import { TestDb, ensureSchemaPushed } from '../../test/helpers/database.helper';
import { createOutlet, createTenant } from '../../test/helpers/fixtures.helper';
import { DiscountsService } from './discounts.service';

function createMockTenantAuth() {
  return {
    canAccessTenant: vi.fn().mockResolvedValue(true),
    getEffectiveTenantId: vi.fn().mockResolvedValue(null),
    validateQueryTenantId: vi.fn().mockResolvedValue(undefined),
    validateTenantOperation: vi.fn().mockResolvedValue(undefined),
  };
}

describe('DiscountsService', () => {
  let service: DiscountsService;
  const testDb = new TestDb();
  let tenantAuth: ReturnType<typeof createMockTenantAuth>;

  const user: CurrentUserWithRole = {
    id: 'user-1',
    email: 'cashier@example.com',
    role: {
      id: 'role-1',
      name: 'Cashier',
      scope: 'tenant',
      tenantId: 'tenant-1',
    },
  };

  beforeAll(async () => {
    ensureSchemaPushed(resolve(__dirname, '../..'));
    await testDb.connect();
  }, 30000);

  afterAll(async () => {
    await testDb.disconnect();
  });

  beforeEach(async () => {
    await testDb.truncate();
    tenantAuth = createMockTenantAuth();

    await createTenant(testDb.db!, {
      id: 'tenant-1',
      nama: 'Default Tenant',
      slug: 'default-tenant',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountsService,
        { provide: DB_CONNECTION, useValue: testDb.db },
        { provide: TenantAuthService, useValue: tenantAuth },
      ],
    }).compile();

    service = module.get<DiscountsService>(DiscountsService);
  });

  describe('findAll', () => {
    it('should return paginated discounts filtered by effective tenant ID', async () => {
      await testDb.db!.insert(discounts).values({
        id: 'disc-1',
        tenantId: 'tenant-1',
        nama: 'Summer Sale',
        rate: '10.00',
        scope: 'transaction',
        level: 'tenant',
        isActive: true,
      });
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({}, user);

      expect(tenantAuth.getEffectiveTenantId).toHaveBeenCalledWith(user);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('disc-1');
      expect(result.data[0].tenantId).toBe('tenant-1');
      expect(result.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
    });

    it('should isolate discounts by tenant', async () => {
      await createTenant(testDb.db!, { id: 'tenant-2', slug: 'tenant-2' });
      await testDb.db!.insert(discounts).values({
        id: 'disc-1',
        tenantId: 'tenant-1',
        nama: 'Tenant 1 Discount',
        rate: '10.00',
        scope: 'transaction',
        level: 'tenant',
        isActive: true,
      });
      await testDb.db!.insert(discounts).values({
        id: 'disc-2',
        tenantId: 'tenant-2',
        nama: 'Tenant 2 Discount',
        rate: '5.00',
        scope: 'transaction',
        level: 'tenant',
        isActive: true,
      });
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({}, user);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('disc-1');
    });

    it('should use query tenantId instead of effective when provided', async () => {
      await createTenant(testDb.db!, { id: 'tenant-2', slug: 'tenant-2' });
      await testDb.db!.insert(discounts).values({
        id: 'disc-1',
        tenantId: 'tenant-2',
        nama: 'Tenant 2 Discount',
        rate: '5.00',
        scope: 'transaction',
        level: 'tenant',
        isActive: true,
      });
      tenantAuth.validateQueryTenantId.mockResolvedValue(undefined);

      const result = await service.findAll({ tenantId: 'tenant-2' }, user);

      expect(tenantAuth.validateQueryTenantId).toHaveBeenCalledWith(user, 'tenant-2');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('disc-1');
    });

    it('should search case-insensitively', async () => {
      await testDb.db!.insert(discounts).values({
        id: 'disc-1',
        tenantId: 'tenant-1',
        nama: 'Summer Sale',
        rate: '10.00',
        scope: 'transaction',
        level: 'tenant',
        isActive: true,
      });
      await testDb.db!.insert(discounts).values({
        id: 'disc-2',
        tenantId: 'tenant-1',
        nama: 'SUMMER DEAL',
        rate: '15.00',
        scope: 'transaction',
        level: 'tenant',
        isActive: true,
      });
      await testDb.db!.insert(discounts).values({
        id: 'disc-3',
        tenantId: 'tenant-1',
        nama: 'Winter Sale',
        rate: '20.00',
        scope: 'transaction',
        level: 'tenant',
        isActive: true,
      });
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({ search: 'summer' }, user);

      expect(result.data).toHaveLength(2);
      expect(result.data.map((d) => d.id).sort()).toEqual(['disc-1', 'disc-2']);
    });

    it('should filter by outletId when provided', async () => {
      await createOutlet(testDb.db!, { id: 'outlet-a', tenantId: 'tenant-1' });
      await testDb.db!.insert(discounts).values({
        id: 'disc-1',
        tenantId: 'tenant-1',
        nama: 'Outlet A Discount',
        rate: '10.00',
        scope: 'transaction',
        level: 'outlet',
        outletId: 'outlet-a',
        isActive: true,
      });
      await testDb.db!.insert(discounts).values({
        id: 'disc-2',
        tenantId: 'tenant-1',
        nama: 'Tenant Wide Discount',
        rate: '5.00',
        scope: 'transaction',
        level: 'tenant',
        isActive: true,
      });
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({ outletId: 'outlet-a' }, user);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('disc-1');
    });

    it('should isolate discounts by tenant when filtering by outletId', async () => {
      await createTenant(testDb.db!, { id: 'tenant-2', slug: 'tenant-2' });
      await createOutlet(testDb.db!, { id: 'outlet-a', tenantId: 'tenant-1' });
      await createOutlet(testDb.db!, { id: 'outlet-b', tenantId: 'tenant-2' });
      await testDb.db!.insert(discounts).values({
        id: 'disc-1',
        tenantId: 'tenant-1',
        nama: 'Tenant 1 Outlet Discount',
        rate: '10.00',
        scope: 'transaction',
        level: 'outlet',
        outletId: 'outlet-a',
        isActive: true,
      });
      await testDb.db!.insert(discounts).values({
        id: 'disc-2',
        tenantId: 'tenant-2',
        nama: 'Tenant 2 Outlet Discount',
        rate: '5.00',
        scope: 'transaction',
        level: 'outlet',
        outletId: 'outlet-b',
        isActive: true,
      });
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({ outletId: 'outlet-a' }, user);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('disc-1');
      expect(result.data[0].tenantId).toBe('tenant-1');
    });

    it('should throw ForbiddenException when user queries a different tenant', async () => {
      tenantAuth.validateQueryTenantId.mockRejectedValue(
        new ForbiddenException('You do not have access to this tenant'),
      );

      await expect(service.findAll({ tenantId: 'tenant-2' }, user)).rejects.toThrow(
        ForbiddenException,
      );
      expect(tenantAuth.validateQueryTenantId).toHaveBeenCalledWith(user, 'tenant-2');
    });

    it('should handle pagination offset correctly', async () => {
      for (let i = 0; i < 25; i++) {
        await testDb.db!.insert(discounts).values({
          tenantId: 'tenant-1',
          nama: `Discount ${i}`,
          rate: '10.00',
          scope: 'transaction',
          level: 'tenant',
          isActive: true,
        });
      }
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({ page: 3, limit: 5 }, user);

      expect(result.data).toHaveLength(5);
      expect(result.meta).toEqual({ page: 3, limit: 5, total: 25, totalPages: 5 });
    });

    it('should return empty data when no discounts exist', async () => {
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({}, user);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return enriched discount with tenant, outlet, and products', async () => {
      await createOutlet(testDb.db!, { id: 'outlet-a', tenantId: 'tenant-1' });
      await testDb.db!.insert(discounts).values({
        id: 'disc-1',
        tenantId: 'tenant-1',
        nama: 'Summer Sale',
        rate: '10.00',
        scope: 'transaction',
        level: 'outlet',
        outletId: 'outlet-a',
        isActive: true,
      });

      const result = await service.findById('disc-1', user);

      expect(result.id).toBe('disc-1');
      expect(result.nama).toBe('Summer Sale');
      expect(result.tenant).toBeTruthy();
      expect(result.tenant!.id).toBe('tenant-1');
      expect(result.outlet).toBeTruthy();
      expect(result.outlet!.id).toBe('outlet-a');
      expect(result.products).toEqual([]);
    });

    it('should throw NotFoundException when discount does not exist', async () => {
      await expect(service.findById('nonexistent', user)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user cannot access tenant', async () => {
      await testDb.db!.insert(discounts).values({
        id: 'disc-1',
        tenantId: 'tenant-1',
        nama: 'Secret Discount',
        rate: '10.00',
        scope: 'transaction',
        level: 'tenant',
        isActive: true,
      });
      tenantAuth.canAccessTenant.mockResolvedValue(false);

      await expect(service.findById('disc-1', user)).rejects.toThrow(ForbiddenException);
      expect(tenantAuth.canAccessTenant).toHaveBeenCalledWith(user, 'tenant-1');
    });
  });

  describe('create', () => {
    it('should return void and create a discount', async () => {
      const result = await service.create(
        {
          tenantId: 'tenant-1',
          nama: 'New Discount',
          rate: '15.00',
          scope: 'transaction',
          level: 'tenant',
          isActive: true,
        },
        user,
      );

      expect(result).toBeUndefined();
      expect(tenantAuth.validateTenantOperation).toHaveBeenCalledWith(user, 'tenant-1');

      const rows = await testDb
        .db!.select()
        .from(discounts)
        .where(eq(discounts.nama, 'New Discount'));
      expect(rows).toHaveLength(1);
      expect(rows[0].nama).toBe('New Discount');
    });

    it('should insert product associations when productIds provided', async () => {
      await testDb.db!.insert(products).values({
        id: 'prod-1',
        tenantId: 'tenant-1',
        sku: 'SKU-001',
        nama: 'Product 1',
        hargaBeli: '1000',
        hargaJual: '2000',
        unit: 'pcs',
        minStockLevel: 0,
        enableMinStock: false,
        enableStockTracking: true,
        isActive: true,
      });

      await service.create(
        {
          tenantId: 'tenant-1',
          nama: 'Product Discount',
          rate: '10.00',
          scope: 'product',
          level: 'tenant',
          isActive: true,
          productIds: ['prod-1'],
        },
        user,
      );

      const discountRows = await testDb
        .db!.select()
        .from(discounts)
        .where(eq(discounts.nama, 'Product Discount'));
      expect(discountRows).toHaveLength(1);

      const assocRows = await testDb
        .db!.select()
        .from(discountProducts)
        .where(eq(discountProducts.productId, 'prod-1'));
      expect(assocRows).toHaveLength(1);
      expect(assocRows[0].discountId).toBe(discountRows[0].id);
    });

    it('should throw ForbiddenException when user cannot operate in target tenant', async () => {
      tenantAuth.validateTenantOperation.mockRejectedValue(
        new ForbiddenException('You do not have access to this tenant'),
      );

      await expect(
        service.create(
          {
            tenantId: 'tenant-2',
            nama: 'Unauthorized Discount',
            rate: '10.00',
            scope: 'transaction',
            level: 'tenant',
            isActive: true,
          },
          user,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(tenantAuth.validateTenantOperation).toHaveBeenCalledWith(user, 'tenant-2');
    });
  });

  describe('update', () => {
    it('should return void and update discount with product associations', async () => {
      await testDb.db!.insert(products).values({
        id: 'prod-1',
        tenantId: 'tenant-1',
        sku: 'SKU-001',
        nama: 'Product 1',
        hargaBeli: '1000',
        hargaJual: '2000',
        unit: 'pcs',
        minStockLevel: 0,
        enableMinStock: false,
        enableStockTracking: true,
        isActive: true,
      });
      await testDb.db!.insert(products).values({
        id: 'prod-2',
        tenantId: 'tenant-1',
        sku: 'SKU-002',
        nama: 'Product 2',
        hargaBeli: '2000',
        hargaJual: '4000',
        unit: 'pcs',
        minStockLevel: 0,
        enableMinStock: false,
        enableStockTracking: true,
        isActive: true,
      });
      await testDb.db!.insert(discounts).values({
        id: 'disc-1',
        tenantId: 'tenant-1',
        nama: 'Old Name',
        rate: '5.00',
        scope: 'product',
        level: 'tenant',
        isActive: true,
      });
      await testDb.db!.insert(discountProducts).values({
        discountId: 'disc-1',
        productId: 'prod-1',
      });

      const result = await service.update(
        'disc-1',
        {
          nama: 'Updated Name',
          rate: '10.00',
          productIds: ['prod-2'],
        },
        user,
      );

      expect(result).toBeUndefined();

      const discountRows = await testDb
        .db!.select()
        .from(discounts)
        .where(eq(discounts.id, 'disc-1'));
      expect(discountRows[0].nama).toBe('Updated Name');
      expect(discountRows[0].rate).toBe('10.00');

      const assocRows = await testDb
        .db!.select()
        .from(discountProducts)
        .where(eq(discountProducts.discountId, 'disc-1'));
      expect(assocRows).toHaveLength(1);
      expect(assocRows[0].productId).toBe('prod-2');
    });
  });

  describe('remove', () => {
    it('should return void and soft-delete the discount', async () => {
      await testDb.db!.insert(discounts).values({
        id: 'disc-1',
        tenantId: 'tenant-1',
        nama: 'To Delete',
        rate: '10.00',
        scope: 'transaction',
        level: 'tenant',
        isActive: true,
      });

      const result = await service.remove('disc-1', user);

      expect(result).toBeUndefined();

      const rows = await testDb.db!.select().from(discounts).where(eq(discounts.id, 'disc-1'));
      expect(rows[0].isActive).toBe(false);
    });
  });
});
