import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { adminRole, ownerRole, cashierRole } from '../../lib/permissions';

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

interface SessionWithUser {
  user: {
    role: string;
  };
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const session = request.session as SessionWithUser | null;

    if (!session) {
      throw new UnauthorizedException('No session found');
    }

    const role = session.user?.role;
    if (!role) {
      throw new UnauthorizedException('No role found in session');
    }

    const controller = context.getClass();

    const controllerPath = this.getControllerPath(controller);

    const action = this.getAction(request.method as string);

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
