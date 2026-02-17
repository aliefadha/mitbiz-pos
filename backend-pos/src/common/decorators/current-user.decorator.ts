import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface CurrentUserType {
  id: string;
  email: string;
  role: string;
  tenantId?: number;
  outletId?: number;
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
