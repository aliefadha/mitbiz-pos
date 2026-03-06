import { CurrentUser, type CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
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

import { AuthService } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import { asc, eq } from 'drizzle-orm';
import type { Request as ExpressRequest } from 'express';
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
  async getUsers(@Query() query: UserQueryDto, @CurrentUser() currentUser: CurrentUserWithRole) {
    if (!currentUser?.id) {
      return { users: [], total: 0 };
    }

    return this.userService.getAllUsers(currentUser, query.tenantId);
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
  async createUser(@Body() body: CreateUserDto, @CurrentUser() currentUser: CurrentUserWithRole) {
    if (!currentUser?.id) {
      return { error: 'No session found' };
    }

    const createdUser = await this.userService.createUser(body, currentUser);
    return { user: createdUser };
  }
}
