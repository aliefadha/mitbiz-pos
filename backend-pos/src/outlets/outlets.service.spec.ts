import { resolve } from 'node:path';
import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { outlets } from '@/db/schema/outlet-schema';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import { vi } from 'vitest';
import { TestDb, ensureSchemaPushed } from '../../test/helpers/database.helper';
import { createOutlet, createTenant } from '../../test/helpers/fixtures.helper';
import type { CreateOutletDto, UpdateOutletDto } from './dto';
import { OutletsService } from './outlets.service';

function createMockTenantAuth() {
  return {
    canAccessTenant: vi.fn().mockResolvedValue(true),
    getEffectiveTenantId: vi.fn().mockResolvedValue(null),
    validateQueryTenantId: vi.fn().mockResolvedValue(undefined),
    validateTenantOperation: vi.fn().mockResolvedValue(undefined),
  };
}

describe('OutletsService', () => {
  let service: OutletsService;
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
        OutletsService,
        { provide: DB_CONNECTION, useValue: testDb.db },
        { provide: TenantAuthService, useValue: tenantAuth },
      ],
    }).compile();

    service = module.get<OutletsService>(OutletsService);
  });

  describe('findAll', () => {
    it('should return paginated outlets filtered by effective tenant ID', async () => {
      await createOutlet(testDb.db!, { id: 'outlet-1', tenantId: 'tenant-1', nama: 'Main Outlet' });
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({}, user);

      expect(tenantAuth.getEffectiveTenantId).toHaveBeenCalledWith(user);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('outlet-1');
      expect(result.data[0].tenantId).toBe('tenant-1');
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        totalOutlet: 1,
        outletAktif: 1,
        outletNonaktif: 0,
      });
    });

    it('should use query tenantId instead of effective when provided', async () => {
      await createTenant(testDb.db!, { id: 'tenant-2', slug: 'tenant-2' });
      await createOutlet(testDb.db!, { id: 'outlet-1', tenantId: 'tenant-2' });
      tenantAuth.validateQueryTenantId.mockResolvedValue(undefined);

      const result = await service.findAll({ tenantId: 'tenant-2' }, user);

      expect(tenantAuth.validateQueryTenantId).toHaveBeenCalledWith(user, 'tenant-2');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('outlet-1');
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
        await createOutlet(testDb.db!, { tenantId: 'tenant-1', nama: `Outlet ${i}` });
      }
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({ page: 3, limit: 5 }, user);

      expect(result.data).toHaveLength(5);
      expect(result.meta).toMatchObject({ page: 3, limit: 5, total: 25, totalPages: 5 });
    });

    it('should return empty data when no outlets exist', async () => {
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({}, user);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should search case-insensitively using ilike', async () => {
      await createOutlet(testDb.db!, { tenantId: 'tenant-1', nama: 'Jakarta Store' });
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({ search: 'jakarta' }, user);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].nama).toBe('Jakarta Store');
    });

    it('should include correct stats for active and inactive outlets', async () => {
      await createOutlet(testDb.db!, { tenantId: 'tenant-1', nama: 'Active 1', isActive: true });
      await createOutlet(testDb.db!, { tenantId: 'tenant-1', nama: 'Active 2', isActive: true });
      await createOutlet(testDb.db!, { tenantId: 'tenant-1', nama: 'Inactive 1', isActive: false });
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({}, user);

      expect(result.meta.totalOutlet).toBe(3);
      expect(result.meta.outletAktif).toBe(2);
      expect(result.meta.outletNonaktif).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return an outlet with nested tenant when it exists', async () => {
      await createOutlet(testDb.db!, {
        id: 'outlet-1',
        tenantId: 'tenant-1',
        nama: 'Main Outlet',
        kode: 'MAIN',
        alamat: '123 Main St',
      });
      tenantAuth.canAccessTenant.mockResolvedValue(true);

      const result = await service.findById('outlet-1', user);

      expect(tenantAuth.canAccessTenant).toHaveBeenCalledWith(user, 'tenant-1');
      expect(result.id).toBe('outlet-1');
      expect(result.nama).toBe('Main Outlet');
      expect(result.kode).toBe('MAIN');
      expect(result.alamat).toBe('123 Main St');
      expect(result.tenant).toEqual({
        id: 'tenant-1',
        nama: 'Default Tenant',
        slug: 'default-tenant',
        isActive: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should throw NotFoundException when outlet does not exist', async () => {
      await expect(service.findById('nonexistent', user)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user cannot access the tenant', async () => {
      await createTenant(testDb.db!, { id: 'tenant-2', slug: 'tenant-2' });
      await createOutlet(testDb.db!, { id: 'outlet-1', tenantId: 'tenant-2' });
      tenantAuth.canAccessTenant.mockResolvedValue(false);

      await expect(service.findById('outlet-1', user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('should insert without returning a value', async () => {
      const dto = {
        tenantId: 'tenant-1',
        nama: 'New Outlet',
        kode: 'NEW01',
        isActive: true,
      } as CreateOutletDto;

      const result = await service.create(dto, user);

      expect(tenantAuth.validateTenantOperation).toHaveBeenCalledWith(user, 'tenant-1');
      expect(result).toBeUndefined();
    });

    it('should normalize kode to uppercase', async () => {
      const dto = {
        tenantId: 'tenant-1',
        nama: 'New Outlet',
        kode: 'low01',
        isActive: true,
      } as CreateOutletDto;

      await service.create(dto, user);

      const [created] = await testDb
        .db!.select({ kode: outlets.kode })
        .from(outlets)
        .where(eq(outlets.tenantId, 'tenant-1'));

      expect(created?.kode).toBe('LOW01');
    });

    it('should throw ConflictException when kode already exists for tenant', async () => {
      await createOutlet(testDb.db!, { tenantId: 'tenant-1', kode: 'DUP01' });
      const dto = {
        tenantId: 'tenant-1',
        nama: 'Duplicate',
        kode: 'DUP01',
        isActive: true,
      } as CreateOutletDto;

      await expect(service.create(dto, user)).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException when user cannot operate in target tenant', async () => {
      tenantAuth.validateTenantOperation.mockRejectedValue(new ForbiddenException());
      const dto = {
        tenantId: 'tenant-2',
        nama: 'New Outlet',
        kode: 'NEW02',
        isActive: true,
      } as CreateOutletDto;

      await expect(service.create(dto, user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update without returning a value', async () => {
      await createOutlet(testDb.db!, { id: 'outlet-1', tenantId: 'tenant-1', nama: 'Old Name' });
      tenantAuth.canAccessTenant.mockResolvedValue(true);

      const result = await service.update(
        'outlet-1',
        { nama: 'Updated Name' } as UpdateOutletDto,
        user,
      );

      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when updating nonexistent outlet', async () => {
      await expect(
        service.update('nonexistent', { nama: 'X' } as UpdateOutletDto, user),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when changing kode to an existing one', async () => {
      await createOutlet(testDb.db!, { id: 'outlet-1', tenantId: 'tenant-1', kode: 'OLD01' });
      await createOutlet(testDb.db!, { id: 'outlet-2', tenantId: 'tenant-1', kode: 'NEW01' });
      tenantAuth.canAccessTenant.mockResolvedValue(true);

      await expect(
        service.update('outlet-1', { kode: 'NEW01' } as UpdateOutletDto, user),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating to the same kode', async () => {
      await createOutlet(testDb.db!, { id: 'outlet-1', tenantId: 'tenant-1', kode: 'SAME01' });
      tenantAuth.canAccessTenant.mockResolvedValue(true);

      await expect(
        service.update('outlet-1', { kode: 'SAME01' } as UpdateOutletDto, user),
      ).resolves.toBeUndefined();
    });
  });

  describe('remove', () => {
    it('should soft-delete without returning a value', async () => {
      await createOutlet(testDb.db!, { id: 'outlet-1', tenantId: 'tenant-1' });
      tenantAuth.canAccessTenant.mockResolvedValue(true);

      const result = await service.remove('outlet-1', user);

      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when removing nonexistent outlet', async () => {
      await expect(service.remove('nonexistent', user)).rejects.toThrow(NotFoundException);
    });

    it('should actually set isActive to false', async () => {
      await createOutlet(testDb.db!, { id: 'outlet-1', tenantId: 'tenant-1', isActive: true });
      tenantAuth.canAccessTenant.mockResolvedValue(true);

      await service.remove('outlet-1', user);

      const [row] = await testDb
        .db!.select({ isActive: outlets.isActive })
        .from(outlets)
        .where(eq(outlets.id, 'outlet-1'));

      expect(row?.isActive).toBe(false);
    });
  });
});
