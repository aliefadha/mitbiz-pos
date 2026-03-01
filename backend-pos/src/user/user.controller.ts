import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { DB_CONNECTION } from '@/db/db.module';
import { roles, user } from '@/db/schema';
import type { DrizzleDB } from '@/db/type';
import { auth } from '@/lib/auth';
import { Action, GlobalScope, Permission, PermissionGuard, RbacService, ScopeGuard } from '@/rbac';
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
    private rbacService: RbacService,
    @Inject(DB_CONNECTION) private db: DrizzleDB,
  ) {}

  @Get()
  @UsePipes(new ZodValidationPipe(UserQuerySchema, 'query'))
  @Permission('user', [Action.READ])
  async getUsers(@Query() query: UserQueryDto, @Request() req: ExpressRequest) {
    const headers = fromNodeHeaders(req.headers);
    const session = await this.authService.api.getSession({ headers });

    const roleId = (session?.user as unknown as { roleId?: string })?.roleId;
    let isOwner = false;

    if (roleId) {
      const role = await this.rbacService.getRoleWithPermissions(roleId);
      isOwner = role?.name === 'owner';
    }

    if (isOwner) {
      const userId = session?.user?.id;
      return this.userService.getUsersByOwner(userId!, query.tenantId);
    }

    const users = await this.db.select().from(user).orderBy(asc(user.createdAt));
    return { users, total: users.length };
  }

  @Post()
  @UsePipes(new ZodValidationPipe(CreateUserSchema))
  @Permission('user', [Action.CREATE])
  async createUser(@Body() body: CreateUserDto, @Request() req: ExpressRequest) {
    const { role: roleName, outletId, tenantId, isSubscribed, ...userData } = body;

    let roleId: string | undefined;
    if (roleName) {
      const [role] = await this.db.select().from(roles).where(eq(roles.name, roleName)).limit(1);
      roleId = role?.id;
    }

    const newUser = await auth.api.signUpEmail({
      body: {
        email: userData.email,
        password: userData.password,
        name: userData.name,
      },
    });

    if (newUser.user && (roleId || outletId || tenantId || isSubscribed !== undefined)) {
      await this.db
        .update(user)
        .set({
          roleId,
          outletId,
          tenantId,
          isSubscribed,
        })
        .where(eq(user.id, newUser.user.id));
    }

    return newUser;
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

  @Get('me/tenants')
  @Permission('user', [Action.READ])
  async getMyTenants(@Request() req: ExpressRequest) {
    const headers = fromNodeHeaders(req.headers);
    const session = await this.authService.api.getSession({ headers });
    if (!session) {
      return { error: 'No session found' };
    }
    const tenants = await this.userService.getUserTenantsAndOutlets(session.user.id);
    return { data: tenants };
  }

  @Patch('me')
  @Permission('user', [Action.UPDATE])
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
