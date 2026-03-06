import { CurrentUserType, CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ScopeType } from '../types/rbac.types';
import { RbacService } from './rbac.service';

@Injectable()
export class TenantAuthService {
  constructor(private readonly rbacService: RbacService) {}

  /**
   * Check if user can access a specific tenant's resources
   * Global roles can access all tenants
   * Tenant-scoped roles can only access their assigned tenant
   */
  async canAccessTenant(user: CurrentUserWithRole, resourceTenantId: string): Promise<boolean> {
    // If user has role info attached
    if (user.role) {
      // Global roles can access all tenants
      if (user.role.scope === ScopeType.GLOBAL) {
        return true;
      }
      // Tenant-scoped roles can only access their tenant
      if (user.role.scope === ScopeType.TENANT && user.role.tenantId) {
        return user.role.tenantId === resourceTenantId;
      }
    }

    // Fallback: fetch role info if not cached
    if (user.roleId) {
      const role = await this.rbacService.getRoleWithPermissions(user.roleId);
      if (!role || !role.isActive) {
        return false;
      }

      // Global roles can access all tenants
      if (role.scope === ScopeType.GLOBAL) {
        return true;
      }

      // Tenant-scoped roles can only access their tenant
      if (role.scope === ScopeType.TENANT && role.tenantId) {
        return role.tenantId === resourceTenantId;
      }
    }

    return false;
  }

  /**
   * Validate that the tenantId in query matches the user's allowed tenant
   * Throws ForbiddenException if mismatch
   */
  async validateQueryTenantId(
    user: CurrentUserWithRole,
    queryTenantId?: string | null,
  ): Promise<void> {
    if (!queryTenantId) {
      return; // No tenantId provided, no validation needed
    }

    const hasAccess = await this.canAccessTenant(user, queryTenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this tenant');
    }
  }

  /**
   * Get the effective tenant ID for the user
   * For tenant-scoped roles: returns role.tenantId
   * For global roles: returns user.tenantId (if set) or null
   */
  async getEffectiveTenantId(user: CurrentUserWithRole): Promise<string | null> {
    // If user has role info attached
    if (user.role) {
      if (user.role.scope === ScopeType.TENANT && user.role.tenantId) {
        return user.role.tenantId;
      }
      // Global role - use user's tenantId if set
      return user.tenantId || null;
    }

    // Fallback: fetch role info
    if (user.roleId) {
      const role = await this.rbacService.getRoleWithPermissions(user.roleId);
      if (role?.isActive) {
        if (role.scope === ScopeType.TENANT && role.tenantId) {
          return role.tenantId;
        }
      }
    }

    // Global role or no role - use user's tenantId
    return user.tenantId || null;
  }

  /**
   * Check if user can create/update/delete in a specific tenant
   * Validates that the target tenant matches user's allowed tenant
   */
  async validateTenantOperation(
    user: CurrentUserWithRole,
    operationTenantId: string,
  ): Promise<void> {
    const hasAccess = await this.canAccessTenant(user, operationTenantId);
    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have permission to perform this operation in this tenant',
      );
    }
  }
}
