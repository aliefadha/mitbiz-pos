import { auth } from '@/lib/auth';
import { findUserRoles } from '@/lib/user.service';
import { PUBLIC_KEY } from '@/rbac/decorators/permission.decorator';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { fromNodeHeaders } from 'better-auth/node';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const headers = fromNodeHeaders(request.headers);

    const session = await auth.api.getSession({ headers });

    if (!session?.user) {
      throw new UnauthorizedException('Invalid session');
    }

    const role = await findUserRoles(session.user.id);

    request.user = {
      ...session.user,
      role,
    };

    return true;
  }
}
