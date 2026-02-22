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
import { auth } from '../../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';
import { adminRole, ownerRole, cashierRole } from '../../lib/permissions';
import type { Request as ExpressRequest } from 'express';

const METHOD_TO_ACTION: Record<string, string> = {
  GET: 'read',
  POST: 'create',
  PATCH: 'update',
  PUT: 'update',
  DELETE: 'delete',
};

const ROLE_MAP: Record<
  string,
  { authorize: (request: unknown) => { success: boolean } }
> = {
  admin: adminRole,
  owner: ownerRole,
  cashier: cashierRole,
};

const CONTROLLER_TO_PERMISSION: Record<string, string> = {
  'stock-adjustments': 'stockAdjustments',
};

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(AuthService) private authService: AuthService<typeof auth>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const headers = fromNodeHeaders(request.headers);
    const session = await this.authService.api.getSession({ headers });

    if (!session) {
      throw new UnauthorizedException('No session found');
    }

    const role = session.user?.role;
    if (!role) {
      throw new UnauthorizedException('No role found in session');
    }

    const controller = context.getClass();

    const controllerPath = this.getControllerPath(controller);

    const action = this.getAction(request.method);

    if (!controllerPath || !action) {
      return true;
    }

    const permissionKey =
      CONTROLLER_TO_PERMISSION[controllerPath] || controllerPath;

    const rolePermissions = ROLE_MAP[role];
    if (!rolePermissions) {
      throw new ForbiddenException(`Unknown role: ${role}`);
    }

    const result = rolePermissions.authorize({
      [permissionKey]: [action],
    });

    if (!result.success) {
      throw new ForbiddenException(
        `You don't have permission to ${action} ${controllerPath}`,
      );
    }

    return true;
  }

  private getControllerPath(controller: new () => object): string | null {
    const controllerPath = Reflect.getMetadata('path', controller) as
      | string
      | null;
    return controllerPath || null;
  }

  private getAction(method: string): string | null {
    return METHOD_TO_ACTION[method] || null;
  }
}
