import { resolve } from 'node:path';
import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { categories } from '@/db/schema/category-schema';
import { outlets } from '@/db/schema/outlet-schema';
import { products } from '@/db/schema/product-schema';
import { productStocks } from '@/db/schema/stock-schema';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import { Test, TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import { vi } from 'vitest';
import { TestDb, ensureSchemaPushed } from '../../test/helpers/database.helper';
import { createOutlet, createProduct, createTenant } from '../../test/helpers/fixtures.helper';
import { StocksService } from './stocks.service';

function createMockTenantAuth() {
  return {
    canAccessTenant: vi.fn().mockResolvedValue(true),
    getEffectiveTenantId: vi.fn().mockResolvedValue(null),
    validateQueryTenantId: vi.fn().mockResolvedValue(undefined),
    validateTenantOperation: vi.fn().mockResolvedValue(undefined),
  };
}

describe('StocksService', () => {
  let service: StocksService;
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StocksService,
        { provide: DB_CONNECTION, useValue: testDb.db },
        { provide: TenantAuthService, useValue: tenantAuth },
      ],
    }).compile();

    service = module.get<StocksService>(StocksService);
  });

  describe('findAll', () => {
    it('should return paginated stocks filtered by effective tenant', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      await testDb.db!.insert(productStocks).values({
        id: 'stock-1',
        productId: product.id,
        outletId: outlet.id,
        quantity: 100,
      });

      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({}, mockUser);

      expect(tenantAuth.getEffectiveTenantId).toHaveBeenCalledWith(mockUser);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('stock-1');
      expect(result.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
    });

    it('should isolate stocks by tenant', async () => {
      await createTenant(testDb.db!, { id: 'tenant-2', slug: 'tenant-2' });
      const outlet1 = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const outlet2 = await createOutlet(testDb.db!, { tenantId: 'tenant-2' });
      const product1 = await createProduct(testDb.db!, { tenantId: 'tenant-1' });
      const product2 = await createProduct(testDb.db!, { tenantId: 'tenant-2' });

      await testDb.db!.insert(productStocks).values({
        id: 'stock-1',
        productId: product1.id,
        outletId: outlet1.id,
        quantity: 100,
      });
      await testDb.db!.insert(productStocks).values({
        id: 'stock-2',
        productId: product2.id,
        outletId: outlet2.id,
        quantity: 200,
      });

      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({}, mockUser);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('stock-1');
    });

    it('should filter by productId', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const product1 = await createProduct(testDb.db!, { tenantId: 'tenant-1' });
      const product2 = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      await testDb.db!.insert(productStocks).values({
        id: 'stock-1',
        productId: product1.id,
        outletId: outlet.id,
        quantity: 100,
      });
      await testDb.db!.insert(productStocks).values({
        id: 'stock-2',
        productId: product2.id,
        outletId: outlet.id,
        quantity: 200,
      });

      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({ productId: product1.id }, mockUser);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('stock-1');
    });

    it('should filter by outletId', async () => {
      const outlet1 = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const outlet2 = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      await testDb.db!.insert(productStocks).values({
        id: 'stock-1',
        productId: product.id,
        outletId: outlet1.id,
        quantity: 100,
      });
      await testDb.db!.insert(productStocks).values({
        id: 'stock-2',
        productId: product.id,
        outletId: outlet2.id,
        quantity: 200,
      });

      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({ outletId: outlet1.id }, mockUser);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('stock-1');
    });

    it('should return empty when filtering by cross-tenant outletId', async () => {
      await createTenant(testDb.db!, { id: 'tenant-2', slug: 'tenant-2' });
      const outlet1 = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const outlet2 = await createOutlet(testDb.db!, { tenantId: 'tenant-2' });
      const product1 = await createProduct(testDb.db!, { tenantId: 'tenant-1' });
      const product2 = await createProduct(testDb.db!, { tenantId: 'tenant-2' });

      await testDb.db!.insert(productStocks).values({
        id: 'stock-1',
        productId: product1.id,
        outletId: outlet1.id,
        quantity: 100,
      });
      await testDb.db!.insert(productStocks).values({
        id: 'stock-2',
        productId: product2.id,
        outletId: outlet2.id,
        quantity: 200,
      });

      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      // User tries to access outlet from tenant-2 by explicit ID
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

      await testDb.db!.insert(productStocks).values({
        id: 'stock-1',
        productId: product1.id,
        outletId: outlet1.id,
        quantity: 100,
      });
      await testDb.db!.insert(productStocks).values({
        id: 'stock-2',
        productId: product2.id,
        outletId: outlet2.id,
        quantity: 200,
      });

      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      // User tries to access product from tenant-2 by explicit ID
      const result = await service.findAll({ productId: product2.id }, mockUser);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });

    it('should exclude inactive stocks by default', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      await testDb.db!.insert(productStocks).values({
        id: 'stock-1',
        productId: product.id,
        outletId: outlet.id,
        quantity: 100,
        isActive: true,
      });
      await testDb.db!.insert(productStocks).values({
        id: 'stock-2',
        productId: product.id,
        outletId: outlet.id,
        quantity: 200,
        isActive: false,
      });

      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({}, mockUser);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('stock-1');
    });

    it('should return empty data when no stocks exist', async () => {
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({}, mockUser);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return enriched stock with product, category, and outlet', async () => {
      const outlet = await createOutlet(testDb.db!, { id: 'outlet-a', tenantId: 'tenant-1' });
      const product = await createProduct(testDb.db!, {
        id: 'product-a',
        tenantId: 'tenant-1',
        sku: 'SKU-001',
      });

      await testDb.db!.insert(productStocks).values({
        id: 'stock-1',
        productId: product.id,
        outletId: outlet.id,
        quantity: 100,
      });

      const result = await service.findById('stock-1', mockUser);

      expect(result.id).toBe('stock-1');
      expect(result.quantity).toBe(100);
      expect(result.product).toBeTruthy();
      expect(result.product!.id).toBe(product.id);
      expect(result.outlet).toBeTruthy();
      expect(result.outlet!.id).toBe(outlet.id);
    });

    it('should throw NotFoundException when stock does not exist', async () => {
      await expect(service.findById('nonexistent', mockUser)).rejects.toThrow(
        'Stock with ID nonexistent not found',
      );
    });

    it('should throw ForbiddenException when user cannot access tenant', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      await testDb.db!.insert(productStocks).values({
        id: 'stock-1',
        productId: product.id,
        outletId: outlet.id,
        quantity: 100,
      });

      tenantAuth.canAccessTenant.mockResolvedValue(false);

      await expect(service.findById('stock-1', mockUser)).rejects.toThrow(
        'You do not have access to this stock',
      );
    });
  });

  describe('create', () => {
    it('should return void and create a stock record', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      const result = await service.create(
        {
          productId: product.id,
          outletId: outlet.id,
          quantity: 100,
        },
        mockUser,
      );

      expect(result).toBeUndefined();
      expect(tenantAuth.validateTenantOperation).toHaveBeenCalledWith(mockUser, 'tenant-1');

      const stocks = await testDb.db!.select().from(productStocks);
      expect(stocks).toHaveLength(1);
      expect(stocks[0].quantity).toBe(100);
      expect(stocks[0].productId).toBe(product.id);
      expect(stocks[0].outletId).toBe(outlet.id);
      expect(stocks[0].isActive).toBe(true);
    });

    it('should throw ConflictException on duplicate product+outlet', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      await testDb.db!.insert(productStocks).values({
        id: 'stock-1',
        productId: product.id,
        outletId: outlet.id,
        quantity: 50,
      });

      await expect(
        service.create(
          {
            productId: product.id,
            outletId: outlet.id,
            quantity: 100,
          },
          mockUser,
        ),
      ).rejects.toThrow('Stock telah dibuat');
    });

    it('should throw NotFoundException when product does not exist', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });

      await expect(
        service.create(
          {
            productId: 'nonexistent',
            outletId: outlet.id,
            quantity: 100,
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
            productId: product.id,
            outletId: 'nonexistent',
            quantity: 100,
          },
          mockUser,
        ),
      ).rejects.toThrow('Outlet with ID nonexistent not found');
    });

    it('should throw ForbiddenException when outlet and product are in different tenants', async () => {
      await createTenant(testDb.db!, { id: 'tenant-2', slug: 'tenant-2' });
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-2' });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      await expect(
        service.create(
          {
            productId: product.id,
            outletId: outlet.id,
            quantity: 100,
          },
          mockUser,
        ),
      ).rejects.toThrow('Outlet does not belong to the same tenant as the product');
    });

    it('should throw ForbiddenException when product is inactive', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1', isActive: false });

      await expect(
        service.create(
          {
            productId: product.id,
            outletId: outlet.id,
            quantity: 100,
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
            productId: product.id,
            outletId: outlet.id,
            quantity: 100,
          },
          mockUser,
        ),
      ).rejects.toThrow('Outlet is inactive');
    });
  });

  describe('update', () => {
    it('should return void and update quantity', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      await testDb.db!.insert(productStocks).values({
        id: 'stock-1',
        productId: product.id,
        outletId: outlet.id,
        quantity: 50,
      });

      const result = await service.update('stock-1', { quantity: 200 }, mockUser);

      expect(result).toBeUndefined();

      const stocks = await testDb
        .db!.select()
        .from(productStocks)
        .where(eq(productStocks.id, 'stock-1'));
      expect(stocks[0].quantity).toBe(200);
    });

    it('should throw NotFoundException when stock does not exist', async () => {
      await expect(service.update('nonexistent', { quantity: 100 }, mockUser)).rejects.toThrow(
        'Stock with ID nonexistent not found',
      );
    });

    it('should throw ForbiddenException when user cannot access tenant', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      await testDb.db!.insert(productStocks).values({
        id: 'stock-1',
        productId: product.id,
        outletId: outlet.id,
        quantity: 50,
      });

      tenantAuth.canAccessTenant.mockResolvedValue(false);

      await expect(service.update('stock-1', { quantity: 100 }, mockUser)).rejects.toThrow(
        'You do not have access to this stock',
      );
    });
  });

  describe('remove', () => {
    it('should return void and soft-delete the stock', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      await testDb.db!.insert(productStocks).values({
        id: 'stock-1',
        productId: product.id,
        outletId: outlet.id,
        quantity: 50,
        isActive: true,
      });

      const result = await service.remove('stock-1', mockUser);

      expect(result).toBeUndefined();

      const stocks = await testDb
        .db!.select()
        .from(productStocks)
        .where(eq(productStocks.id, 'stock-1'));
      expect(stocks[0].isActive).toBe(false);
    });

    it('should throw NotFoundException when stock does not exist', async () => {
      await expect(service.remove('nonexistent', mockUser)).rejects.toThrow(
        'Stock with ID nonexistent not found',
      );
    });

    it('should throw ForbiddenException when user cannot access tenant', async () => {
      const outlet = await createOutlet(testDb.db!, { tenantId: 'tenant-1' });
      const product = await createProduct(testDb.db!, { tenantId: 'tenant-1' });

      await testDb.db!.insert(productStocks).values({
        id: 'stock-1',
        productId: product.id,
        outletId: outlet.id,
        quantity: 50,
      });

      tenantAuth.canAccessTenant.mockResolvedValue(false);

      await expect(service.remove('stock-1', mockUser)).rejects.toThrow(
        'You do not have access to this stock',
      );
    });
  });
});
