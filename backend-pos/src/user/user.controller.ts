import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Request,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AuthService, AuthGuard, Roles } from '@thallesp/nestjs-better-auth';
import { auth } from '../lib/auth';
import type { Request as ExpressRequest } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { CreateUserSchema, CreateUserDto } from './dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('users')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private authService: AuthService<typeof auth>) {}

  @Roles(['admin'])
  @Get()
  async getUsers(@Request() req: ExpressRequest) {
    const users = await this.authService.api.listUsers({
      query: {},
      headers: fromNodeHeaders(req.headers),
    });
    return users;
  }

  @Roles(['admin', 'owner'])
  @Post()
  @UsePipes(new ZodValidationPipe(CreateUserSchema))
  async createUser(
    @Body() body: CreateUserDto,
    @Request() req: ExpressRequest,
  ) {
    const user = await this.authService.api.createUser({
      body: body as any,
      headers: fromNodeHeaders(req.headers),
    });
    return user;
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
