import { auth } from '@/lib/auth';
import { findUserRoles } from '@/lib/user.service';
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';

@Injectable()
export class JwtAuthGuard extends AuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
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
