import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

export interface CurrentUserType {
  id: string;
  email: string;
  role?: string;
  roleId?: string | null;
  tenantId?: string | null;
  outletId?: string | null;
  isSubscribed?: boolean;
}

interface RequestWithUser extends Request {
  user?: CurrentUserType;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserType | undefined, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
