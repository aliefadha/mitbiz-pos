import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiBody, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { TenantsService } from './tenants.service';
import {
  CreateTenantSchema,
  UpdateTenantSchema,
  TenantSlugSchema,
  TenantQuerySchema,
  TenantSummarySchema,
  CreateTenantDto,
  UpdateTenantDto,
  TenantSlugDto,
  TenantQueryDto,
  TenantSummaryDto,
} from './dto';
import { AuthGuard, Roles, OptionalAuth } from '@thallesp/nestjs-better-auth';
import {
  CurrentUser,
  type CurrentUserType,
} from '../common/decorators/current-user.decorator';

@ApiTags('tenants')
@Controller('tenants')
@UseGuards(AuthGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Roles(['admin', 'owner'])
  @Get()
  @ApiOperation({ summary: 'Get all tenants' })
  @UsePipes(new ZodValidationPipe(TenantQuerySchema, 'query'))
  findAll(
    @Query() query: TenantQueryDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.tenantsService.findAll(query, user);
  }

  @Roles(['admin', 'owner'])
  @Get(':slug')
  @ApiOperation({ summary: 'Get tenant by slug' })
  @UsePipes(new ZodValidationPipe(TenantSlugSchema, 'params'))
  findBySlug(
    @Param() { slug }: TenantSlugDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.tenantsService.findBySlug(slug, user);
  }

  @OptionalAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiBody({ type: CreateTenantDto })
  @UsePipes(new ZodValidationPipe(CreateTenantSchema))
  create(@Body() data: CreateTenantDto, @CurrentUser() user: CurrentUserType) {
    return this.tenantsService.create(data, user);
  }

  @Roles(['admin', 'owner'])
  @Put(':slug')
  @ApiOperation({ summary: 'Update a tenant' })
  @UsePipes(new ZodValidationPipe(TenantSlugSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateTenantSchema))
  update(
    @Param() { slug }: TenantSlugDto,
    @Body() data: UpdateTenantDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.tenantsService.update(slug, data, user);
  }

  @Roles(['admin', 'owner'])
  @Delete(':slug')
  @ApiOperation({ summary: 'Delete a tenant' })
  @UsePipes(new ZodValidationPipe(TenantSlugSchema, 'params'))
  remove(
    @Param() { slug }: TenantSlugDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.tenantsService.remove(slug, user);
  }

  @Roles(['admin', 'owner'])
  @Get(':slug/summary')
  @ApiOperation({
    summary:
      'Get tenant summary (counts for outlets, categories, products, user)',
  })
  @UsePipes(new ZodValidationPipe(TenantSummarySchema, 'params'))
  getSummary(
    @Param() { slug }: TenantSummaryDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.tenantsService.getSummary(slug, user);
  }
}
