import { resolve } from 'node:path';
import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { user } from '@/db/schema/auth-schema';
import { outlets } from '@/db/schema/outlet-schema';
import { products } from '@/db/schema/product-schema';
import { stockAdjustments } from '@/db/schema/stock-adjustment-schema';
import { productStocks } from '@/db/schema/stock-schema';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import { Test, TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import { vi } from 'vitest';
import { TestDb, ensureSchemaPushed } from '../../test/helpers/database.helper';
import { createOutlet, createProduct, createTenant } from '../../test/helpers/fixtures.helper';
import { StockAdjustmentsService } from './stock-adjustments.service';

function createMockTenantAuth() {
  return {
    canAccessTenant: vi.fn().mockResolvedValue(true),
    getEffectiveTenantId: vi.fn().mockResolvedValue(null),
    validateQueryTenantId: vi.fn().mockResolvedValue(undefined),
    validateTenantOperation: vi.fn().mockResolvedValue(undefined),
  };
}

describe('StockAdjustmentsService', () => {
  let service: StockAdjustmentsService;
  const testDb = new TestDb();
  let tenantAuth: ReturnType<typeof createMockTenantAuth>;

  const mockUser: CurrentUserWithRole = {
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

    // Create the mock user in the database
    await testDb.db!.insert(user).values({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockAdjustmentsService,
        { provide: DB_CONNECTION, useValue: testDb.db },
        { provide: TenantAuthService, useValue: tenantAuth },
      ],
    }).compile();

    service = module.get<StockAdjustmentsService>(StockAdjustmentsService);
  });

  describe('findAll', () => {
    it('should return paginated stock adjustments filtered by effective tenant', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      await testDb.db!.insert(stockAdjustments).values({
        id: 'adj-1',
        outletId: outlet.id,
        productId: product.id,
        quantity: 10,
        adjustedBy: 'user-1',
      });

      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({}, mockUser);

      expect(tenantAuth.getEffectiveTenantId).toHaveBeenCalledWith(mockUser);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('adj-1');
      expect(result.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
    });

    it('should isolate adjustments by tenant', async () => {
      await createTenant(testDb.db!, { id: 'tenant-2', slug: 'tenant-2' });
      const outlet1 = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const outlet2 = await createOutlet(testDb.db!, { tenantId: 'tenant-2' });
      const product1 = await createProduct(testDb.db!, { tenantId: 'tenant-1' });
      const product2 = await createProduct(testDb.db!, { tenantId: 'tenant-2' });

      await testDb.db!.insert(stockAdjustments).values({
        id: 'adj-1',
        outletId: outlet1.id,
        productId: product1.id,
        quantity: 10,
        adjustedBy: 'user-1',
      });
      await testDb.db!.insert(stockAdjustments).values({
        id: 'adj-2',
        outletId: outlet2.id,
        productId: product2.id,
        quantity: 20,
        adjustedBy: 'user-1',
      });

      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({}, mockUser);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('adj-1');
    });

    it('should return empty when filtering by cross-tenant outletId', async () => {
      await createTenant(testDb.db!, { id: 'tenant-2', slug: 'tenant-2' });
      const outlet1 = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const outlet2 = await createOutlet(testDb.db!, { tenantId: 'tenant-2' });
      const product1 = await createProduct(testDb.db!, { tenantId: 'tenant-1' });
      const product2 = await createProduct(testDb.db!, { tenantId: 'tenant-2' });

      await testDb.db!.insert(stockAdjustments).values({
        id: 'adj-1',
        outletId: outlet1.id,
        productId: product1.id,
        quantity: 10,
        adjustedBy: 'user-1',
      });
      await testDb.db!.insert(stockAdjustments).values({
        id: 'adj-2',
        outletId: outlet2.id,
        productId: product2.id,
        quantity: 20,
        adjustedBy: 'user-1',
      });

      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({ outletId: outlet2.id }, mockUser);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });

    it('should return empty when filtering by cross-tenant productId', async () => {
      await createTenant(testDb.db!, { id: 'tenant-2', slug: 'tenant-2' });
      const outlet1 = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const outlet2 = await createOutlet(testDb.db!, { tenantId: 'tenant-2' });
      const product1 = await createProduct(testDb.db!, { tenantId: 'tenant-1' });
      const product2 = await createProduct(testDb.db!, { tenantId: 'tenant-2' });

      await testDb.db!.insert(stockAdjustments).values({
        id: 'adj-1',
        outletId: outlet1.id,
        productId: product1.id,
        quantity: 10,
        adjustedBy: 'user-1',
      });
      await testDb.db!.insert(stockAdjustments).values({
        id: 'adj-2',
        outletId: outlet2.id,
        productId: product2.id,
        quantity: 20,
        adjustedBy: 'user-1',
      });

      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      // User tries to access product from tenant-2 by explicit ID
      const result = await service.findAll({ productId: product2.id }, mockUser);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });

    it('should filter by productId', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const product1 = await createProduct(testDb.db!, { tenantId: 'tenant-1' });
      const product2 = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      await testDb.db!.insert(stockAdjustments).values({
        id: 'adj-1',
        outletId: outlet.id,
        productId: product1.id,
        quantity: 10,
        adjustedBy: 'user-1',
      });
      await testDb.db!.insert(stockAdjustments).values({
        id: 'adj-2',
        outletId: outlet.id,
        productId: product2.id,
        quantity: 20,
        adjustedBy: 'user-1',
      });

      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({ productId: product1.id }, mockUser);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('adj-1');
    });

    it('should filter by outletId', async () => {
      const outlet1 = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const outlet2 = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      await testDb.db!.insert(stockAdjustments).values({
        id: 'adj-1',
        outletId: outlet1.id,
        productId: product.id,
        quantity: 10,
        adjustedBy: 'user-1',
      });
      await testDb.db!.insert(stockAdjustments).values({
        id: 'adj-2',
        outletId: outlet2.id,
        productId: product.id,
        quantity: 20,
        adjustedBy: 'user-1',
      });

      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({ outletId: outlet1.id }, mockUser);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('adj-1');
    });

    it('should filter by adjustedBy', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      await testDb.db!.insert(user).values({
        id: 'user-2',
        name: 'Another User',
        email: 'another@example.com',
      });

      await testDb.db!.insert(stockAdjustments).values({
        id: 'adj-1',
        outletId: outlet.id,
        productId: product.id,
        quantity: 10,
        adjustedBy: 'user-1',
      });
      await testDb.db!.insert(stockAdjustments).values({
        id: 'adj-2',
        outletId: outlet.id,
        productId: product.id,
        quantity: 20,
        adjustedBy: 'user-2',
      });

      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({ adjustedBy: 'user-1' }, mockUser);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('adj-1');
    });

    it('should return empty data when no adjustments exist', async () => {
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({}, mockUser);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return enriched adjustment with product, outlet, and user', async () => {
      const outlet = await createOutlet(testDb.db!, { id: 'outlet-a', tenantId: 'tenant-1' });
      const product = await createProduct(testDb.db!, {
        id: 'product-a',
        tenantId: 'tenant-1',
        sku: 'SKU-001',
      });

      await testDb.db!.insert(stockAdjustments).values({
        id: 'adj-1',
        outletId: outlet.id,
        productId: product.id,
        quantity: 10,
        adjustedBy: 'user-1',
      });

      const result = await service.findById('adj-1', mockUser);

      expect(result.id).toBe('adj-1');
      expect(result.quantity).toBe(10);
      expect(result.product).toBeTruthy();
      expect(result.product!.id).toBe(product.id);
      expect(result.outlet).toBeTruthy();
      expect(result.outlet!.id).toBe(outlet.id);
      expect(result.user).toBeTruthy();
      expect(result.user!.id).toBe('user-1');
    });

    it('should throw NotFoundException when adjustment does not exist', async () => {
      await expect(service.findById('nonexistent', mockUser)).rejects.toThrow(
        'Stock adjustment with ID nonexistent not found',
      );
    });

    it('should throw ForbiddenException when user cannot access tenant', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      await testDb.db!.insert(stockAdjustments).values({
        id: 'adj-1',
        outletId: outlet.id,
        productId: product.id,
        quantity: 10,
        adjustedBy: 'user-1',
      });

      tenantAuth.canAccessTenant.mockResolvedValue(false);

      await expect(service.findById('adj-1', mockUser)).rejects.toThrow(
        'You do not have access to this stock adjustment',
      );
    });
  });

  describe('create', () => {
    it('should return void and create an adjustment that increments existing stock', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      // Pre-create stock
      await testDb.db!.insert(productStocks).values({
        id: 'stock-1',
        productId: product.id,
        outletId: outlet.id,
        quantity: 50,
      });

      const result = await service.create(
        {
          outletId: outlet.id,
          productId: product.id,
          quantity: 10,
          alasan: 'Restock',
        },
        mockUser,
      );

      expect(result).toBeUndefined();
      expect(tenantAuth.validateTenantOperation).toHaveBeenCalledWith(mockUser, 'tenant-1');

      // Verify adjustment was created
      const adjustments = await testDb.db!.select().from(stockAdjustments);
      expect(adjustments).toHaveLength(1);
      expect(adjustments[0].quantity).toBe(10);
      expect(adjustments[0].adjustedBy).toBe('user-1');

      // Verify stock was incremented
      const stocks = await testDb
        .db!.select()
        .from(productStocks)
        .where(eq(productStocks.id, 'stock-1'));
      expect(stocks[0].quantity).toBe(60);
    });

    it('should return void and create an adjustment that creates new stock when none exists', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      const result = await service.create(
        {
          outletId: outlet.id,
          productId: product.id,
          quantity: 25,
        },
        mockUser,
      );

      expect(result).toBeUndefined();

      // Verify new stock was created
      const stocks = await testDb.db!.select().from(productStocks);
      expect(stocks).toHaveLength(1);
      expect(stocks[0].quantity).toBe(25);
      expect(stocks[0].productId).toBe(product.id);
      expect(stocks[0].outletId).toBe(outlet.id);
    });

    it('should decrement existing stock with negative adjustment', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      await testDb.db!.insert(productStocks).values({
        id: 'stock-1',
        productId: product.id,
        outletId: outlet.id,
        quantity: 50,
      });

      const result = await service.create(
        {
          outletId: outlet.id,
          productId: product.id,
          quantity: -20,
          alasan: 'Damage',
        },
        mockUser,
      );

      expect(result).toBeUndefined();

      // Verify adjustment was created
      const adjustments = await testDb.db!.select().from(stockAdjustments);
      expect(adjustments).toHaveLength(1);
      expect(adjustments[0].quantity).toBe(-20);

      // Verify stock was decremented
      const stocks = await testDb
        .db!.select()
        .from(productStocks)
        .where(eq(productStocks.id, 'stock-1'));
      expect(stocks[0].quantity).toBe(30);
    });

    it('should keep stock unchanged when negative adjustment would go below zero', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      await testDb.db!.insert(productStocks).values({
        id: 'stock-1',
        productId: product.id,
        outletId: outlet.id,
        quantity: 10,
      });

      const result = await service.create(
        {
          outletId: outlet.id,
          productId: product.id,
          quantity: -25,
          alasan: 'Theft',
        },
        mockUser,
      );

      expect(result).toBeUndefined();

      // Verify adjustment was still created
      const adjustments = await testDb.db!.select().from(stockAdjustments);
      expect(adjustments).toHaveLength(1);
      expect(adjustments[0].quantity).toBe(-25);

      // Verify stock was NOT changed — kept as-is
      const stocks = await testDb
        .db!.select()
        .from(productStocks)
        .where(eq(productStocks.id, 'stock-1'));
      expect(stocks[0].quantity).toBe(10);
    });

    it('should not create stock when negative adjustment and none exists', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      const result = await service.create(
        {
          outletId: outlet.id,
          productId: product.id,
          quantity: -10,
          alasan: 'Initial damage',
        },
        mockUser,
      );

      expect(result).toBeUndefined();

      // Verify adjustment was still created
      const adjustments = await testDb.db!.select().from(stockAdjustments);
      expect(adjustments).toHaveLength(1);
      expect(adjustments[0].quantity).toBe(-10);

      // Verify no stock was created
      const stocks = await testDb.db!.select().from(productStocks);
      expect(stocks).toHaveLength(0);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });

      await expect(
        service.create(
          {
            outletId: outlet.id,
            productId: 'nonexistent',
            quantity: 10,
          },
          mockUser,
        ),
      ).rejects.toThrow('Product with ID nonexistent not found');
    });

    it('should throw NotFoundException when outlet does not exist', async () => {
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      await expect(
        service.create(
          {
            outletId: 'nonexistent',
            productId: product.id,
            quantity: 10,
          },
          mockUser,
        ),
      ).rejects.toThrow('Outlet with ID nonexistent not found');
    });

    it('should throw ForbiddenException when product and outlet are in different tenants', async () => {
      await createTenant(testDb.db!, { id: 'tenant-2', slug: 'tenant-2' });
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-2' });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      await expect(
        service.create(
          {
            outletId: outlet.id,
            productId: product.id,
            quantity: 10,
          },
          mockUser,
        ),
      ).rejects.toThrow('Product and outlet do not belong to the same tenant');
    });

    it('should throw ForbiddenException when user cannot operate in target tenant', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      tenantAuth.validateTenantOperation.mockRejectedValue(
        new Error('You do not have access to this tenant'),
      );

      await expect(
        service.create(
          {
            outletId: outlet.id,
            productId: product.id,
            quantity: 10,
          },
          mockUser,
        ),
      ).rejects.toThrow('You do not have access to this tenant');
    });

    it('should throw ForbiddenException when product is inactive', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1', isActive: false });

      await expect(
        service.create(
          {
            outletId: outlet.id,
            productId: product.id,
            quantity: 10,
          },
          mockUser,
        ),
      ).rejects.toThrow('Product is inactive');
    });

    it('should throw ForbiddenException when outlet is inactive', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1', isActive: false });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      await expect(
        service.create(
          {
            outletId: outlet.id,
            productId: product.id,
            quantity: 10,
          },
          mockUser,
        ),
      ).rejects.toThrow('Outlet is inactive');
    });
  });
});
