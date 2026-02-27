import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Request,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AuthService, AuthGuard } from '@thallesp/nestjs-better-auth';
import { auth } from '../lib/auth';
import type { Request as ExpressRequest } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { CreateUserSchema, CreateUserDto, UserQueryDto, UserQuerySchema } from './dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PermissionGuard } from '../common/guards/permission.guard';
import { UserService } from './user.service';

@Controller('users')
@UseGuards(AuthGuard, PermissionGuard)
export class UserController {
  constructor(
    private authService: AuthService<typeof auth>,
    private userService: UserService,
  ) {}

  @Get()
  @UsePipes(new ZodValidationPipe(UserQuerySchema, 'query'))
  async getUsers(@Query() query: UserQueryDto, @Request() req: ExpressRequest) {
    const headers = fromNodeHeaders(req.headers);
    const session = await this.authService.api.getSession({ headers });
    const role = session?.user?.role;

    if (role === 'owner') {
      const userId = session?.user?.id;
      return this.userService.getUsersByOwner(userId!, query.tenantId);
    }

    const users = await this.authService.api.listUsers({
      query: {},
      headers,
    });
    return users;
  }

  @Post()
  @UsePipes(new ZodValidationPipe(CreateUserSchema))
  async createUser(
    @Body() body: CreateUserDto,
    @Request() req: ExpressRequest,
  ) {
    const headers = fromNodeHeaders(req.headers);
    const { role, outletId, isSubscribed, ...userData } = body;
    return this.authService.api.createUser({
      body: {
        ...userData,
        role,
        data: {
          outletId,
          isSubscribed,
          emailVerified: true,
        },
      } as any,
      headers,
    });
  }

  @Get('me')
  async getProfile(@Request() req: ExpressRequest) {
    const session = await this.authService.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      return { error: 'No session found' };
    }
    return session.user;
  }

  @Get('me/tenants')
  async getMyTenants(@Request() req: ExpressRequest) {
    const headers = fromNodeHeaders(req.headers);
    const session = await this.authService.api.getSession({ headers });
    if (!session) {
      return { error: 'No session found' };
    }
    const tenants = await this.userService.getUserTenantsAndOutlets(
      session.user.id,
    );
    return { data: tenants };
  }

  @Patch('me')
  async updateProfile(
    @Body() body: { name?: string; image?: string },
    @Request() req: ExpressRequest,
  ) {
    const session = await this.authService.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      return { error: 'No session found' };
    }
    const user = await this.authService.api.updateUser({
      body: body as any,
      headers: fromNodeHeaders(req.headers),
    });
    return user;
  }
}
