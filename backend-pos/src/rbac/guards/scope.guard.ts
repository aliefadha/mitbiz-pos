import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import { RbacService } from '../services/rbac.service';
import { SCOPE_KEY } from '../decorators/scope.decorator';
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

    const role = await this.rbacService.getRoleWithPermissions(roleId);
    if (!role) {
      throw new ForbiddenException('Role not found or inactive');
    }

    if (scope === ScopeType.GLOBAL && role.scope === ScopeType.TENANT) {
      const roleTenantId = await this.rbacService.getUserTenantId(outletId ?? null);
      if (role.tenantId && roleTenantId !== role.tenantId) {
        throw new ForbiddenException('Access denied: global scope required');
      }
    }

    if (scope === ScopeType.TENANT) {
      if (role.scope === ScopeType.GLOBAL) {
        return true;
      }

      const userTenantId = await this.rbacService.getUserTenantId(outletId ?? null);
      if (!userTenantId) {
        throw new ForbiddenException('No tenant associated with user');
      }

      if (role.tenantId && role.tenantId !== userTenantId) {
        throw new ForbiddenException('Access denied: tenant mismatch');
      }

      request.tenantId = userTenantId;
    }

    return true;
  }
}
