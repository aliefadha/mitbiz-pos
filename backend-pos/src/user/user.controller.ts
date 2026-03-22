import { CurrentUser, type CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { auth } from '@/lib/auth';
import { Action, GlobalScope, Permission, PermissionGuard, Public, ScopeGuard } from '@/rbac';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthService } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request as ExpressRequest } from 'express';
import { z } from 'zod';
import {
  CreateUserDto,
  CreateUserSchema,
  UpdateUserDto,
  UpdateUserSchema,
  UserQueryDto,
  UserQuerySchema,
} from './dto';
import { UserService } from './user.service';

const CheckEmailSchema = z.object({
  email: z.string().email('Invalid email format'),
});

@ApiTags('users')
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
      return { users: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    }

    return this.userService.getAllUsers(currentUser, {
      tenantId: query.tenantId,
      page: query.page,
      limit: query.limit,
    });
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

  @Get('me/permissions')
  async getMyPermissions(@CurrentUser() currentUser: CurrentUserWithRole) {
    if (!currentUser?.id) {
      return { role: null, permissions: [] };
    }
    return this.userService.getUserRolesAndPermissions(currentUser.id);
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

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(UpdateUserSchema))
  @Permission('user', [Action.UPDATE])
  async updateUser(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @CurrentUser() currentUser: CurrentUserWithRole,
  ) {
    if (!currentUser?.id) {
      return { error: 'No session found' };
    }

    const updatedUser = await this.userService.updateUser(id, body, currentUser);
    return { user: updatedUser };
  }

  @Get('check-email')
  @Public()
  @UsePipes(new ZodValidationPipe(CheckEmailSchema, 'query'))
  @ApiOperation({ summary: 'Check if email already exists' })
  async checkEmail(@Query() query: z.infer<typeof CheckEmailSchema>) {
    const exists = await this.userService.checkEmailExists(query.email);
    return { exists };
  }
}
