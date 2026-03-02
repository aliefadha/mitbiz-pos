import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { auth } from '@/lib/auth';
import { Action, GlobalScope, Permission, PermissionGuard, ScopeGuard } from '@/rbac';
import {
  Body,
  Controller,
  Get,
  Inject,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  UsePipes,
} from '@nestjs/common';

import { asc, eq } from 'drizzle-orm';
import type { Request as ExpressRequest } from 'express';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import { CreateUserDto, CreateUserSchema, UserQueryDto, UserQuerySchema } from './dto';
import { UserService } from './user.service';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard, ScopeGuard)
@GlobalScope()
export class UserController {
  constructor(
    private authService: AuthService<typeof auth>,
    private userService: UserService,
  ) {}

  @Get()
  @UsePipes(new ZodValidationPipe(UserQuerySchema, 'query'))
  @Permission('user', [Action.READ])
  async getUsers(@Query() query: UserQueryDto, @Request() req: ExpressRequest) {
    const headers = fromNodeHeaders(req.headers);
    const session = await this.authService.api.getSession({ headers });

    if (!session?.user?.id) {
      return { users: [], total: 0 };
    }

    return this.userService.getAllUsers(session.user.id, query.tenantId);
  }

  @Get('me')
  @Permission('user', [Action.READ])
  async getProfile(@Request() req: ExpressRequest) {
    const session = await this.authService.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      return { error: 'No session found' };
    }
    return session.user;
  }

  @Post()
  @UsePipes(new ZodValidationPipe(CreateUserSchema))
  @Permission('user', [Action.CREATE])
  async createUser(@Body() body: CreateUserDto, @Request() req: ExpressRequest) {
    const headers = fromNodeHeaders(req.headers);
    const session = await this.authService.api.getSession({ headers });

    if (!session?.user?.id) {
      return { error: 'No session found' };
    }

    const createdUser = await this.userService.createUser(body, session.user.id);
    return { user: createdUser };
  }
}
