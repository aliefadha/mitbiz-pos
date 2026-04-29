import { resolve } from 'node:path';
import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { TestDb, ensureSchemaPushed } from '../../test/helpers/database.helper';
import { createCategory, createTenant } from '../../test/helpers/fixtures.helper';
import { CategoriesService } from './categories.service';
import type { CreateCategoryDto, UpdateCategoryDto } from './dto';

function createMockTenantAuth() {
  return {
    canAccessTenant: vi.fn().mockResolvedValue(true),
    getEffectiveTenantId: vi.fn().mockResolvedValue(null),
    validateQueryTenantId: vi.fn().mockResolvedValue(undefined),
    validateTenantOperation: vi.fn().mockResolvedValue(undefined),
  };
}

describe('CategoriesService', () => {
  let service: CategoriesService;
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

    // Create a default tenant so FK constraints on create are satisfied
    await createTenant(testDb.db!, {
      id: 'tenant-1',
      nama: 'Default Tenant',
      slug: 'default-tenant',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: DB_CONNECTION, useValue: testDb.db },
        { provide: TenantAuthService, useValue: tenantAuth },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('findAll', () => {
    it('should return paginated categories filtered by effective tenant ID', async () => {
      await createCategory(testDb.db!, { id: 'cat-1', tenantId: 'tenant-1', nama: 'Food' });
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({}, user);

      expect(tenantAuth.getEffectiveTenantId).toHaveBeenCalledWith(user);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('cat-1');
      expect(result.data[0].tenantId).toBe('tenant-1');
      expect(result.data[0].productsCount).toBe(0);
      expect(result.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
    });

    it('should use query tenantId instead of effective when provided', async () => {
      await createTenant(testDb.db!, { id: 'tenant-2', slug: 'tenant-2' });
      await createCategory(testDb.db!, { id: 'cat-1', tenantId: 'tenant-2' });
      tenantAuth.validateQueryTenantId.mockResolvedValue(undefined);

      const result = await service.findAll({ tenantId: 'tenant-2' }, user);

      expect(tenantAuth.validateQueryTenantId).toHaveBeenCalledWith(user, 'tenant-2');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('cat-1');
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
      // Create 25 categories
      for (let i = 0; i < 25; i++) {
        await createCategory(testDb.db!, { tenantId: 'tenant-1', nama: `Category ${i}` });
      }
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({ page: 3, limit: 5 }, user);

      expect(result.data).toHaveLength(5);
      expect(result.meta).toEqual({ page: 3, limit: 5, total: 25, totalPages: 5 });
    });

    it('should return empty data when no categories exist', async () => {
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({}, user);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return a category with nested tenant when it exists', async () => {
      await createCategory(testDb.db!, {
        id: 'cat-1',
        tenantId: 'tenant-1',
        nama: 'Food',
        deskripsi: 'All food items',
      });
      tenantAuth.canAccessTenant.mockResolvedValue(true);

      const result = await service.findById('cat-1', user);

      expect(tenantAuth.canAccessTenant).toHaveBeenCalledWith(user, 'tenant-1');
      expect(result.id).toBe('cat-1');
      expect(result.nama).toBe('Food');
      expect(result.deskripsi).toBe('All food items');
      expect(result.productsCount).toBe(0);
      expect(result.tenant).toEqual({
        id: 'tenant-1',
        nama: 'Default Tenant',
        slug: 'default-tenant',
        isActive: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should throw NotFoundException when category does not exist', async () => {
      await expect(service.findById('nonexistent', user)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user cannot access the tenant', async () => {
      await createTenant(testDb.db!, { id: 'tenant-2', slug: 'tenant-2' });
      await createCategory(testDb.db!, { id: 'cat-1', tenantId: 'tenant-2' });
      tenantAuth.canAccessTenant.mockResolvedValue(false);

      await expect(service.findById('cat-1', user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('should insert without returning a value', async () => {
      const dto = { tenantId: 'tenant-1', nama: 'Drinks', isActive: true } as CreateCategoryDto;

      const result = await service.create(dto, user);

      expect(tenantAuth.validateTenantOperation).toHaveBeenCalledWith(user, 'tenant-1');
      expect(result).toBeUndefined();
    });

    it('should throw ForbiddenException when user cannot operate in target tenant', async () => {
      tenantAuth.validateTenantOperation.mockRejectedValue(new ForbiddenException());
      const dto = { tenantId: 'tenant-2', nama: 'Drinks', isActive: true } as CreateCategoryDto;

      await expect(service.create(dto, user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update without returning a value', async () => {
      await createCategory(testDb.db!, { id: 'cat-1', tenantId: 'tenant-1', nama: 'Food' });
      tenantAuth.canAccessTenant.mockResolvedValue(true);

      const result = await service.update(
        'cat-1',
        { nama: 'Updated Food' } as UpdateCategoryDto,
        user,
      );

      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when updating nonexistent category', async () => {
      await expect(
        service.update('nonexistent', { nama: 'X' } as UpdateCategoryDto, user),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete without returning a value', async () => {
      await createCategory(testDb.db!, { id: 'cat-1', tenantId: 'tenant-1' });
      tenantAuth.canAccessTenant.mockResolvedValue(true);

      const result = await service.remove('cat-1', user);

      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when removing nonexistent category', async () => {
      await expect(service.remove('nonexistent', user)).rejects.toThrow(NotFoundException);
    });
  });
});
