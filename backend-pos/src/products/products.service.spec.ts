import { resolve } from 'node:path';
import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { products } from '@/db/schema/product-schema';
import { productStocks } from '@/db/schema/stock-schema';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import { vi } from 'vitest';
import { TestDb, ensureSchemaPushed } from '../../test/helpers/database.helper';
import {
  createCategory,
  createOutlet,
  createProduct,
  createTenant,
} from '../../test/helpers/fixtures.helper';
import type { CreateProductDto, UpdateProductDto } from './dto';
import { ProductsService } from './products.service';

function createMockTenantAuth() {
  return {
    canAccessTenant: vi.fn().mockResolvedValue(true),
    getEffectiveTenantId: vi.fn().mockResolvedValue(null),
    validateQueryTenantId: vi.fn().mockResolvedValue(undefined),
    validateTenantOperation: vi.fn().mockResolvedValue(undefined),
  };
}

describe('ProductsService', () => {
  let service: ProductsService;
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
        ProductsService,
        { provide: DB_CONNECTION, useValue: testDb.db },
        { provide: TenantAuthService, useValue: tenantAuth },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('findAll', () => {
    it('should return paginated products with stock and category', async () => {
      await createCategory(testDb.db!, { id: 'cat-1', tenantId: 'tenant-1', nama: 'Food' });
      await createProduct(testDb.db!, {
        id: 'prod-1',
        tenantId: 'tenant-1',
        nama: 'Burger',
        categoryId: 'cat-1',
      });
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({}, user);

      expect(tenantAuth.getEffectiveTenantId).toHaveBeenCalledWith(user);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('prod-1');
      expect(result.data[0].nama).toBe('Burger');
      expect(result.data[0].stock).toBe(0);
      expect(result.data[0].category).toEqual({
        id: 'cat-1',
        nama: 'Food',
        deskripsi: expect.any(String),
        isActive: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        totalProduk: 1,
        produkAktif: 1,
      });
    });

    it('should sum stock correctly across multiple outlets', async () => {
      await createOutlet(testDb.db!, { id: 'outlet-1', tenantId: 'tenant-1', nama: 'Outlet 1' });
      await createOutlet(testDb.db!, { id: 'outlet-2', tenantId: 'tenant-1', nama: 'Outlet 2' });
      await createProduct(testDb.db!, {
        id: 'prod-1',
        tenantId: 'tenant-1',
        nama: 'Burger',
      });
      await testDb.db!.insert(productStocks).values([
        { productId: 'prod-1', outletId: 'outlet-1', quantity: 5 },
        { productId: 'prod-1', outletId: 'outlet-2', quantity: 3 },
      ]);
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({}, user);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('prod-1');
      expect(result.data[0].stock).toBe(8);
      expect(result.meta.total).toBe(1);
    });

    it('should isolate products by tenant', async () => {
      await createTenant(testDb.db!, { id: 'tenant-2', slug: 'tenant-2' });
      await createProduct(testDb.db!, { id: 'prod-1', tenantId: 'tenant-1', nama: 'Burger' });
      await createProduct(testDb.db!, { id: 'prod-2', tenantId: 'tenant-2', nama: 'Pizza' });
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({}, user);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('prod-1');
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

    it('should search case-insensitively', async () => {
      await createProduct(testDb.db!, { id: 'prod-1', tenantId: 'tenant-1', nama: 'Burger' });
      await createProduct(testDb.db!, { id: 'prod-2', tenantId: 'tenant-1', nama: 'BURGER' });
      await createProduct(testDb.db!, { id: 'prod-3', tenantId: 'tenant-1', nama: 'Pizza' });
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({ search: 'burger' }, user);

      expect(result.data).toHaveLength(2);
      expect(result.data.map((p) => p.id).sort()).toEqual(['prod-1', 'prod-2']);
    });

    it('should filter by categoryId', async () => {
      await createCategory(testDb.db!, { id: 'cat-1', tenantId: 'tenant-1', nama: 'Food' });
      await createCategory(testDb.db!, { id: 'cat-2', tenantId: 'tenant-1', nama: 'Drinks' });
      await createProduct(testDb.db!, {
        id: 'prod-1',
        tenantId: 'tenant-1',
        nama: 'Burger',
        categoryId: 'cat-1',
      });
      await createProduct(testDb.db!, {
        id: 'prod-2',
        tenantId: 'tenant-1',
        nama: 'Pizza',
        categoryId: 'cat-2',
      });
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({ categoryId: 'cat-1' }, user);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('prod-1');
    });

    it('should filter stock by outletId', async () => {
      await createOutlet(testDb.db!, { id: 'outlet-1', tenantId: 'tenant-1', nama: 'Outlet 1' });
      await createOutlet(testDb.db!, { id: 'outlet-2', tenantId: 'tenant-1', nama: 'Outlet 2' });
      await createProduct(testDb.db!, { id: 'prod-1', tenantId: 'tenant-1', nama: 'Burger' });
      await testDb.db!.insert(productStocks).values([
        { productId: 'prod-1', outletId: 'outlet-1', quantity: 10 },
        { productId: 'prod-1', outletId: 'outlet-2', quantity: 7 },
      ]);
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({ outletId: 'outlet-1' }, user);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].stock).toBe(10);
    });

    it('should handle pagination offset correctly', async () => {
      for (let i = 0; i < 25; i++) {
        await createProduct(testDb.db!, { tenantId: 'tenant-1', nama: `Product ${i}` });
      }
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({ page: 3, limit: 5 }, user);

      expect(result.data).toHaveLength(5);
      expect(result.meta).toEqual({
        page: 3,
        limit: 5,
        total: 25,
        totalPages: 5,
        totalProduk: 25,
        produkAktif: 25,
      });
    });

    it('should return empty data when no products exist', async () => {
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({}, user);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalProduk).toBe(0);
      expect(result.meta.produkAktif).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return an enriched product with tenant, category, and stock', async () => {
      await createCategory(testDb.db!, {
        id: 'cat-1',
        tenantId: 'tenant-1',
        nama: 'Food',
        deskripsi: 'All food items',
      });
      await createProduct(testDb.db!, {
        id: 'prod-1',
        tenantId: 'tenant-1',
        nama: 'Burger',
        deskripsi: 'Beef burger',
        categoryId: 'cat-1',
      });
      tenantAuth.canAccessTenant.mockResolvedValue(true);

      const result = await service.findById('prod-1', user);

      expect(tenantAuth.canAccessTenant).toHaveBeenCalledWith(user, 'tenant-1');
      expect(result.id).toBe('prod-1');
      expect(result.nama).toBe('Burger');
      expect(result.deskripsi).toBe('Beef burger');
      expect(result.stock).toBe(0);
      expect(result.category).toEqual({
        id: 'cat-1',
        nama: 'Food',
        deskripsi: 'All food items',
        isActive: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(result.tenant).toEqual({
        id: 'tenant-1',
        nama: 'Default Tenant',
        slug: 'default-tenant',
        isActive: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should throw NotFoundException when product does not exist', async () => {
      await expect(service.findById('nonexistent', user)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user cannot access the tenant', async () => {
      await createTenant(testDb.db!, { id: 'tenant-2', slug: 'tenant-2' });
      await createProduct(testDb.db!, { id: 'prod-1', tenantId: 'tenant-2' });
      tenantAuth.canAccessTenant.mockResolvedValue(false);

      await expect(service.findById('prod-1', user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('should insert without returning a value', async () => {
      const dto = {
        tenantId: 'tenant-1',
        nama: 'Burger',
        hargaJual: '0',
        isActive: true,
      } as CreateProductDto;

      const result = await service.create(dto, user);

      expect(tenantAuth.validateTenantOperation).toHaveBeenCalledWith(user, 'tenant-1');
      expect(result).toBeUndefined();
    });

    it('should throw ConflictException on duplicate SKU in same tenant', async () => {
      await createProduct(testDb.db!, { id: 'prod-1', tenantId: 'tenant-1', sku: 'SKU-001' });

      const dto = {
        tenantId: 'tenant-1',
        nama: 'Burger',
        sku: 'SKU-001',
        hargaJual: '0',
      } as CreateProductDto;

      await expect(service.create(dto, user)).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException when category does not belong to same tenant', async () => {
      await createTenant(testDb.db!, { id: 'tenant-2', slug: 'tenant-2' });
      await createCategory(testDb.db!, { id: 'cat-1', tenantId: 'tenant-2', nama: 'Food' });

      const dto = {
        tenantId: 'tenant-1',
        nama: 'Burger',
        categoryId: 'cat-1',
        hargaJual: '0',
      } as CreateProductDto;

      await expect(service.create(dto, user)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when category does not exist', async () => {
      const dto = {
        tenantId: 'tenant-1',
        nama: 'Burger',
        categoryId: 'nonexistent',
        hargaJual: '0',
      } as CreateProductDto;

      await expect(service.create(dto, user)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user cannot operate in target tenant', async () => {
      tenantAuth.validateTenantOperation.mockRejectedValue(new ForbiddenException());

      const dto = { tenantId: 'tenant-2', nama: 'Burger', hargaJual: '0' } as CreateProductDto;

      await expect(service.create(dto, user)).rejects.toThrow(ForbiddenException);
    });

    it('should allow creating without SKU', async () => {
      const dto = { tenantId: 'tenant-1', nama: 'Burger', hargaJual: '0' } as CreateProductDto;

      await expect(service.create(dto, user)).resolves.toBeUndefined();
    });

    it('should allow creating without category', async () => {
      const dto = { tenantId: 'tenant-1', nama: 'Burger', hargaJual: '0' } as CreateProductDto;

      await expect(service.create(dto, user)).resolves.toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update without returning a value', async () => {
      await createProduct(testDb.db!, { id: 'prod-1', tenantId: 'tenant-1', nama: 'Burger' });
      tenantAuth.canAccessTenant.mockResolvedValue(true);

      const result = await service.update('prod-1', { nama: 'Updated' } as UpdateProductDto, user);

      expect(result).toBeUndefined();
    });

    it('should update isActive to false in database', async () => {
      await createProduct(testDb.db!, { id: 'prod-1', tenantId: 'tenant-1', isActive: true });
      tenantAuth.canAccessTenant.mockResolvedValue(true);

      await service.update('prod-1', { isActive: false } as UpdateProductDto, user);

      const rows = await testDb.db!.select().from(products).where(eq(products.id, 'prod-1'));
      expect(rows[0].isActive).toBe(false);
    });

    it('should update nama in database', async () => {
      await createProduct(testDb.db!, { id: 'prod-1', tenantId: 'tenant-1', nama: 'Old Name' });
      tenantAuth.canAccessTenant.mockResolvedValue(true);

      await service.update('prod-1', { nama: 'New Name' } as UpdateProductDto, user);

      const rows = await testDb.db!.select().from(products).where(eq(products.id, 'prod-1'));
      expect(rows[0].nama).toBe('New Name');
    });

    it('should throw NotFoundException when updating nonexistent product', async () => {
      await expect(
        service.update('nonexistent', { nama: 'X' } as UpdateProductDto, user),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when SKU changed to existing SKU in same tenant', async () => {
      await createProduct(testDb.db!, { id: 'prod-1', tenantId: 'tenant-1', sku: 'SKU-001' });
      await createProduct(testDb.db!, { id: 'prod-2', tenantId: 'tenant-1', sku: 'SKU-002' });
      tenantAuth.canAccessTenant.mockResolvedValue(true);

      await expect(
        service.update('prod-1', { sku: 'SKU-002' } as UpdateProductDto, user),
      ).rejects.toThrow(ConflictException);
    });

    it('should not throw when SKU is unchanged', async () => {
      await createProduct(testDb.db!, { id: 'prod-1', tenantId: 'tenant-1', sku: 'SKU-001' });
      tenantAuth.canAccessTenant.mockResolvedValue(true);

      await expect(
        service.update('prod-1', { sku: 'SKU-001' } as UpdateProductDto, user),
      ).resolves.toBeUndefined();
    });

    it('should throw NotFoundException when categoryId changed to nonexistent category', async () => {
      await createProduct(testDb.db!, { id: 'prod-1', tenantId: 'tenant-1' });
      tenantAuth.canAccessTenant.mockResolvedValue(true);

      await expect(
        service.update('prod-1', { categoryId: 'nonexistent' } as UpdateProductDto, user),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when categoryId changed to different tenant category', async () => {
      await createTenant(testDb.db!, { id: 'tenant-2', slug: 'tenant-2' });
      await createCategory(testDb.db!, { id: 'cat-2', tenantId: 'tenant-2', nama: 'Drinks' });
      await createProduct(testDb.db!, { id: 'prod-1', tenantId: 'tenant-1' });
      tenantAuth.canAccessTenant.mockResolvedValue(true);

      await expect(
        service.update('prod-1', { categoryId: 'cat-2' } as UpdateProductDto, user),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should soft-delete without returning a value', async () => {
      await createProduct(testDb.db!, { id: 'prod-1', tenantId: 'tenant-1' });
      tenantAuth.canAccessTenant.mockResolvedValue(true);

      const result = await service.remove('prod-1', user);

      expect(result).toBeUndefined();
    });

    it('should set isActive to false in the database', async () => {
      await createProduct(testDb.db!, { id: 'prod-1', tenantId: 'tenant-1', isActive: true });
      tenantAuth.canAccessTenant.mockResolvedValue(true);

      await service.remove('prod-1', user);

      const rows = await testDb.db!.select().from(products).where(eq(products.id, 'prod-1'));
      expect(rows[0].isActive).toBe(false);
    });

    it('should throw NotFoundException when removing nonexistent product', async () => {
      await expect(service.remove('nonexistent', user)).rejects.toThrow(NotFoundException);
    });
  });
});
