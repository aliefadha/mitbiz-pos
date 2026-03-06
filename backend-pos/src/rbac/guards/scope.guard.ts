import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import { SCOPE_KEY } from '../decorators/scope.decorator';
import { RbacService } from '../services/rbac.service';
import { ScopeType } from '../types/rbac.types';

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(AuthService) private authService: AuthService,
    private rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const headers = fromNodeHeaders(request.headers);
    const session = await this.authService.api.getSession({ headers });

    if (!session) {
      throw new UnauthorizedException('No session found');
    }

    const scope = this.reflector.get<ScopeType>(SCOPE_KEY, context.getHandler());

    if (!scope) {
      return true;
    }

    const userData = session.user as unknown as {
      outletId?: string | null;
      roleId?: string | null;
    };

    const outletId = userData?.outletId;
    const roleId = userData?.roleId;

    if (!roleId) {
      throw new UnauthorizedException('No role assigned to user');
    }

    // Check if role already attached by PermissionGuard
    let role = (request.user as any)?.role;

    if (!role) {
      const roleData = await this.rbacService.getRoleWithPermissions(roleId);
      if (!roleData) {
        throw new ForbiddenException('Role not found or inactive');
      }
      role = roleData;

      // Attach role info to request for caching
      request.user = {
        ...session.user,
        role: {
          id: role.id,
          name: role.name,
          scope: role.scope,
          tenantId: role.tenantId,
        },
      } as unknown as typeof request.user;
    }

    if (scope === ScopeType.GLOBAL && role.scope === ScopeType.TENANT) {
      const roleTenantId = await this.rbacService.getUserTenantId(outletId ?? null);
      if (role.tenantId && roleTenantId !== role.tenantId) {
        throw new ForbiddenException('Access denied: global scope required');
      }
    }

    if (scope === ScopeType.TENANT) {
      if (role.scope === ScopeType.GLOBAL) {
        // Global users can access any tenant, use query param or user preference
        const userTenantId = await this.rbacService.getUserTenantId(outletId ?? null);
        request.tenantId = userTenantId || role.tenantId;
        return true;
      }

      // Tenant-scoped roles are restricted to their assigned tenant
      if (!role.tenantId) {
        throw new ForbiddenException('No tenant associated with role');
      }

      request.tenantId = role.tenantId;
    }

    return true;
  }
}
