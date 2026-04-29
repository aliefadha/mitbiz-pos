import { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { ScopeType } from '../types/rbac.types';
import { RbacService } from './rbac.service';
import { TenantAuthService } from './tenant-auth.service';

describe('TenantAuthService', () => {
  let service: TenantAuthService;
  let rbacService: RbacService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantAuthService,
        {
          provide: RbacService,
          useValue: {
            getRoleWithPermissions: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TenantAuthService>(TenantAuthService);
    rbacService = module.get<RbacService>(RbacService);
  });

  describe('canAccessTenant', () => {
    it('should return true when user has a global role attached', async () => {
      const user: CurrentUserWithRole = {
        id: 'user-1',
        email: 'user@example.com',
        role: {
          id: 'role-global',
          name: 'Super Admin',
          scope: 'global',
          tenantId: null,
        },
      };

      const result = await service.canAccessTenant(user, 'any-tenant-123');

      expect(result).toBe(true);
    });

    it('should return true when user has a tenant role with matching tenantId', async () => {
      const tenantId = 'tenant-1';
      const user: CurrentUserWithRole = {
        id: 'user-2',
        email: 'cashier@example.com',
        role: {
          id: 'role-tenant',
          name: 'Cashier',
          scope: 'tenant',
          tenantId,
        },
      };

      const result = await service.canAccessTenant(user, tenantId);

      expect(result).toBe(true);
    });

    it('should return false when user has a tenant role with mismatched tenantId', async () => {
      const user: CurrentUserWithRole = {
        id: 'user-3',
        email: 'cashier@example.com',
        role: {
          id: 'role-tenant',
          name: 'Cashier',
          scope: 'tenant',
          tenantId: 'tenant-1',
        },
      };

      const result = await service.canAccessTenant(user, 'tenant-2');

      expect(result).toBe(false);
    });

    it('should return false when user has no role and no roleId', async () => {
      const user: CurrentUserWithRole = {
        id: 'user-4',
        email: 'no-role@example.com',
      };

      const result = await service.canAccessTenant(user, 'any-tenant');

      expect(result).toBe(false);
    });

    it('should fallback to roleId lookup when user.role is not attached', async () => {
      const tenantId = 'tenant-1';
      const user: CurrentUserWithRole = {
        id: 'user-5',
        email: 'fallback@example.com',
        roleId: 'role-1',
      };
      vi.spyOn(rbacService, 'getRoleWithPermissions').mockResolvedValue({
        id: 'role-1',
        name: 'Cashier',
        scope: ScopeType.TENANT,
        tenantId,
        isActive: true,
        permissions: [],
      });

      const result = await service.canAccessTenant(user, tenantId);

      expect(result).toBe(true);
    });

    it('should return false when roleId lookup returns inactive role', async () => {
      const user: CurrentUserWithRole = {
        id: 'user-6',
        email: 'inactive@example.com',
        roleId: 'role-inactive',
      };
      vi.spyOn(rbacService, 'getRoleWithPermissions').mockResolvedValue(null);

      const result = await service.canAccessTenant(user, 'any-tenant');

      expect(result).toBe(false);
    });

    it('should return true when roleId fallback finds a global role', async () => {
      const user: CurrentUserWithRole = {
        id: 'user-7',
        email: 'global-fallback@example.com',
        roleId: 'role-global',
      };
      vi.spyOn(rbacService, 'getRoleWithPermissions').mockResolvedValue({
        id: 'role-global',
        name: 'Super Admin',
        scope: ScopeType.GLOBAL,
        tenantId: null,
        isActive: true,
        permissions: [],
      });

      const result = await service.canAccessTenant(user, 'any-tenant');

      expect(result).toBe(true);
    });
  });

  describe('getEffectiveTenantId', () => {
    it('should return role tenantId when user has a tenant-scoped role', async () => {
      const tenantId = 'tenant-1';
      const user: CurrentUserWithRole = {
        id: 'user-8',
        email: 'cashier@example.com',
        role: {
          id: 'role-1',
          name: 'Cashier',
          scope: 'tenant',
          tenantId,
        },
      };

      const result = await service.getEffectiveTenantId(user);

      expect(result).toBe(tenantId);
    });

    it('should return user tenantId when user has a global role', async () => {
      const tenantId = 'tenant-1';
      const user: CurrentUserWithRole = {
        id: 'user-9',
        email: 'admin@example.com',
        tenantId,
        role: {
          id: 'role-1',
          name: 'Super Admin',
          scope: 'global',
          tenantId: null,
        },
      };

      const result = await service.getEffectiveTenantId(user);

      expect(result).toBe(tenantId);
    });

    it('should return null when global role user has no tenantId set', async () => {
      const user: CurrentUserWithRole = {
        id: 'user-10',
        email: 'admin@example.com',
        role: {
          id: 'role-1',
          name: 'Super Admin',
          scope: 'global',
          tenantId: null,
        },
      };

      const result = await service.getEffectiveTenantId(user);

      expect(result).toBeNull();
    });

    it('should return null when user has no role and no tenantId', async () => {
      const user: CurrentUserWithRole = {
        id: 'user-11',
        email: 'user@example.com',
      };

      const result = await service.getEffectiveTenantId(user);

      expect(result).toBeNull();
    });
  });

  describe('validateQueryTenantId', () => {
    it('should not throw when queryTenantId is not provided', async () => {
      const user: CurrentUserWithRole = {
        id: 'user-1',
        email: 'user@example.com',
      };

      await expect(service.validateQueryTenantId(user, undefined)).resolves.toBeUndefined();
    });

    it('should not throw when queryTenantId is null', async () => {
      const user: CurrentUserWithRole = {
        id: 'user-1',
        email: 'user@example.com',
      };

      await expect(service.validateQueryTenantId(user, null)).resolves.toBeUndefined();
    });

    it('should not throw when user has access to the queried tenant', async () => {
      const tenantId = 'tenant-1';
      const user: CurrentUserWithRole = {
        id: 'user-1',
        email: 'user@example.com',
        role: {
          id: 'role-1',
          name: 'Super Admin',
          scope: 'global',
          tenantId: null,
        },
      };

      await expect(service.validateQueryTenantId(user, tenantId)).resolves.toBeUndefined();
    });

    it('should throw ForbiddenException when user does not have access', async () => {
      const user: CurrentUserWithRole = {
        id: 'user-4',
        email: 'no-access@example.com',
      };

      await expect(service.validateQueryTenantId(user, 'tenant-x')).rejects.toThrow(
        'You do not have access to this tenant',
      );
    });
  });

  describe('validateTenantOperation', () => {
    it('should not throw when user has access to the operation tenant', async () => {
      const tenantId = 'tenant-1';
      const user: CurrentUserWithRole = {
        id: 'user-1',
        email: 'user@example.com',
        role: {
          id: 'role-1',
          name: 'Super Admin',
          scope: 'global',
          tenantId: null,
        },
      };

      await expect(service.validateTenantOperation(user, tenantId)).resolves.toBeUndefined();
    });

    it('should throw ForbiddenException when user does not have access', async () => {
      const user: CurrentUserWithRole = {
        id: 'user-4',
        email: 'no-access@example.com',
      };

      await expect(service.validateTenantOperation(user, 'tenant-y')).rejects.toThrow(
        'You do not have permission to perform this operation in this tenant',
      );
    });
  });
});
