import { resolve } from 'node:path';
import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestDb, ensureSchemaPushed } from '../../test/helpers/database.helper';
import { createPaymentMethod, createTenant } from '../../test/helpers/fixtures.helper';
import type { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './dto';
import { PaymentMethodsService } from './payment-methods.service';

function createMockTenantAuth() {
  return {
    canAccessTenant: jest.fn().mockResolvedValue(true),
    getEffectiveTenantId: jest.fn().mockResolvedValue(null),
    validateQueryTenantId: jest.fn().mockResolvedValue(undefined),
    validateTenantOperation: jest.fn().mockResolvedValue(undefined),
  };
}

describe('PaymentMethodsService', () => {
  let service: PaymentMethodsService;
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
        PaymentMethodsService,
        { provide: DB_CONNECTION, useValue: testDb.db },
        { provide: TenantAuthService, useValue: tenantAuth },
      ],
    }).compile();

    service = module.get<PaymentMethodsService>(PaymentMethodsService);
  });

  describe('findAll', () => {
    it('should return paginated payment methods filtered by effective tenant ID', async () => {
      await createPaymentMethod(testDb.db!, { id: 'pm-1', tenantId: 'tenant-1', nama: 'Cash' });
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({}, user);

      expect(tenantAuth.getEffectiveTenantId).toHaveBeenCalledWith(user);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('pm-1');
      expect(result.data[0].nama).toBe('Cash');
      expect(result.data[0].tenantId).toBe('tenant-1');
      expect(result.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
    });

    it('should use query tenantId instead of effective when provided', async () => {
      await createTenant(testDb.db!, { id: 'tenant-2', slug: 'tenant-2' });
      await createPaymentMethod(testDb.db!, { id: 'pm-1', tenantId: 'tenant-2' });
      tenantAuth.validateQueryTenantId.mockResolvedValue(undefined);

      const result = await service.findAll({ tenantId: 'tenant-2' }, user);

      expect(tenantAuth.validateQueryTenantId).toHaveBeenCalledWith(user, 'tenant-2');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('pm-1');
    });

    it('should handle pagination offset correctly', async () => {
      for (let i = 0; i < 25; i++) {
        await createPaymentMethod(testDb.db!, { tenantId: 'tenant-1', nama: `Payment ${i}` });
      }
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({ page: 3, limit: 5 }, user);

      expect(result.data).toHaveLength(5);
      expect(result.meta).toEqual({ page: 3, limit: 5, total: 25, totalPages: 5 });
    });

    it('should return empty data when no payment methods exist', async () => {
      tenantAuth.getEffectiveTenantId.mockResolvedValue('tenant-1');

      const result = await service.findAll({}, user);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return a payment method with nested tenant when it exists', async () => {
      await createPaymentMethod(testDb.db!, {
        id: 'pm-1',
        tenantId: 'tenant-1',
        nama: 'Cash',
      });
      tenantAuth.canAccessTenant.mockResolvedValue(true);

      const result = await service.findById('pm-1', user);

      expect(tenantAuth.canAccessTenant).toHaveBeenCalledWith(user, 'tenant-1');
      expect(result.id).toBe('pm-1');
      expect(result.nama).toBe('Cash');
      expect(result.tenant).toEqual({
        id: 'tenant-1',
        nama: 'Default Tenant',
        slug: 'default-tenant',
        isActive: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should throw NotFoundException when payment method does not exist', async () => {
      await expect(service.findById('nonexistent', user)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user cannot access the tenant', async () => {
      await createTenant(testDb.db!, { id: 'tenant-2', slug: 'tenant-2' });
      await createPaymentMethod(testDb.db!, { id: 'pm-1', tenantId: 'tenant-2' });
      tenantAuth.canAccessTenant.mockResolvedValue(false);

      await expect(service.findById('pm-1', user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('should insert without returning a value', async () => {
      const dto = {
        tenantId: 'tenant-1',
        nama: 'Credit Card',
        isActive: true,
      } as CreatePaymentMethodDto;

      const result = await service.create(dto, user);

      expect(tenantAuth.validateTenantOperation).toHaveBeenCalledWith(user, 'tenant-1');
      expect(result).toBeUndefined();
    });

    it('should throw ForbiddenException when user cannot operate in target tenant', async () => {
      tenantAuth.validateTenantOperation.mockRejectedValue(new ForbiddenException());
      const dto = { tenantId: 'tenant-2', nama: 'Cash', isActive: true } as CreatePaymentMethodDto;

      await expect(service.create(dto, user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update without returning a value', async () => {
      await createPaymentMethod(testDb.db!, { id: 'pm-1', tenantId: 'tenant-1', nama: 'Cash' });
      tenantAuth.canAccessTenant.mockResolvedValue(true);

      const result = await service.update(
        'pm-1',
        { nama: 'Bank Transfer' } as UpdatePaymentMethodDto,
        user,
      );

      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when updating nonexistent method', async () => {
      await expect(
        service.update('nonexistent', { nama: 'X' } as UpdatePaymentMethodDto, user),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete without returning a value', async () => {
      await createPaymentMethod(testDb.db!, { id: 'pm-1', tenantId: 'tenant-1' });
      tenantAuth.canAccessTenant.mockResolvedValue(true);

      const result = await service.remove('pm-1', user);

      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when removing nonexistent method', async () => {
      await expect(service.remove('nonexistent', user)).rejects.toThrow(NotFoundException);
    });
  });
});
