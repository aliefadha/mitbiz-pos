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
import { PERMISSION_KEY, PermissionMetadata } from '../decorators/permission.decorator';
import { RbacService } from '../services/rbac.service';
import { Action, CONTROLLER_TO_RESOURCE, METHOD_TO_ACTION } from '../types/rbac.types';

@Injectable()
export class PermissionGuard implements CanActivate {
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

    const roleId = (session.user as unknown as { roleId?: string })?.roleId;
    if (!roleId) {
      throw new UnauthorizedException('No role assigned to user');
    }

    const explicitPermission = this.reflector.get<PermissionMetadata>(
      PERMISSION_KEY,
      context.getHandler(),
    );

    const resource = explicitPermission?.resource || this.getResourceFromController(context);
    const action = explicitPermission?.actions?.[0] || this.getAction(request.method);

    if (!resource || !action) {
      return true;
    }

    const role = await this.rbacService.getRoleWithPermissions(roleId);
    if (!role) {
      throw new ForbiddenException('Role not found or inactive');
    }

    const hasPermission = this.rbacService.hasPermission(role.permissions, resource, action);

    if (!hasPermission) {
      throw new ForbiddenException(`You don't have permission to ${action} ${resource}`);
    }

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

    return true;
  }

  private getResourceFromController(context: ExecutionContext): string | null {
    const controller = context.getClass();
    const controllerPath = Reflect.getMetadata('path', controller) as string | null;
    if (!controllerPath) return null;
    return CONTROLLER_TO_RESOURCE[controllerPath] || controllerPath;
  }

  private getAction(method: string): Action | null {
    return METHOD_TO_ACTION[method] || null;
  }
}
