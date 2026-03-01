import { CurrentUser, type CurrentUserType } from '@/common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { Action, GlobalScope, Permission, PermissionGuard, ScopeGuard } from '@/rbac';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, OptionalAuth } from '@thallesp/nestjs-better-auth';
import {
  CreateTenantDto,
  CreateTenantSchema,
  TenantQueryDto,
  TenantQuerySchema,
  TenantSlugDto,
  TenantSlugSchema,
  TenantSummaryDto,
  TenantSummarySchema,
  UpdateTenantDto,
  UpdateTenantSchema,
} from './dto';
import { TenantsService } from './tenants.service';

@ApiTags('tenants')
@Controller('tenants')
@UseGuards(AuthGuard, PermissionGuard, ScopeGuard)
@GlobalScope()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tenants' })
  @UsePipes(new ZodValidationPipe(TenantQuerySchema, 'query'))
  @Permission('tenants', [Action.READ])
  findAll(@Query() query: TenantQueryDto, @CurrentUser() user: CurrentUserType) {
    return this.tenantsService.findAll(query, user);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get tenant by slug' })
  @UsePipes(new ZodValidationPipe(TenantSlugSchema, 'params'))
  @Permission('tenants', [Action.READ])
  findBySlug(@Param() { slug }: TenantSlugDto, @CurrentUser() user: CurrentUserType) {
    return this.tenantsService.findBySlug(slug, user);
  }

  @OptionalAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiBody({ type: CreateTenantDto })
  @UsePipes(new ZodValidationPipe(CreateTenantSchema))
  @Permission('tenants', [Action.CREATE])
  create(@Body() data: CreateTenantDto, @CurrentUser() user: CurrentUserType) {
    return this.tenantsService.create(data, user);
  }

  @Put(':slug')
  @ApiOperation({ summary: 'Update a tenant' })
  @UsePipes(new ZodValidationPipe(TenantSlugSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateTenantSchema))
  @Permission('tenants', [Action.UPDATE])
  update(
    @Param() { slug }: TenantSlugDto,
    @Body() data: UpdateTenantDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.tenantsService.update(slug, data, user);
  }

  @Delete(':slug')
  @ApiOperation({ summary: 'Delete a tenant' })
  @UsePipes(new ZodValidationPipe(TenantSlugSchema, 'params'))
  @Permission('tenants', [Action.DELETE])
  remove(@Param() { slug }: TenantSlugDto, @CurrentUser() user: CurrentUserType) {
    return this.tenantsService.remove(slug, user);
  }

  @Get(':slug/summary')
  @ApiOperation({
    summary: 'Get tenant summary (counts for outlets, categories, products, user)',
  })
  @UsePipes(new ZodValidationPipe(TenantSummarySchema, 'params'))
  @Permission('tenants', [Action.READ])
  getSummary(@Param() { slug }: TenantSummaryDto, @CurrentUser() user: CurrentUserType) {
    return this.tenantsService.getSummary(slug, user);
  }

  @Get(':slug/users')
  @ApiOperation({ summary: 'Get all users for a tenant' })
  @UsePipes(new ZodValidationPipe(TenantSlugSchema, 'params'))
  @Permission('tenants', [Action.READ])
  findUsers(@Param() { slug }: TenantSlugDto, @CurrentUser() user: CurrentUserType) {
    return this.tenantsService.findUsers(slug, user);
  }

  @Get(':slug/outlets')
  @ApiOperation({ summary: 'Get all outlets for a tenant' })
  @UsePipes(new ZodValidationPipe(TenantSlugSchema, 'params'))
  @Permission('tenants', [Action.READ])
  findOutlets(@Param() { slug }: TenantSlugDto, @CurrentUser() user: CurrentUserType) {
    return this.tenantsService.findOutlets(slug, user);
  }
}
