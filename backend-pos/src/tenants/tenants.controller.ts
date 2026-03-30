import { CurrentUser, type CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { FileUploadInterceptor } from '@/common/interceptors/file-upload.interceptor';
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard, OptionalAuth } from '@thallesp/nestjs-better-auth';
import {
  CreateTenantDto,
  CreateTenantSchema,
  TenantIdDto,
  TenantIdSchema,
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
  constructor(private readonly tenantsService: TenantsService) { }

  @Get()
  @ApiOperation({ summary: 'Get all tenants' })
  @UsePipes(new ZodValidationPipe(TenantQuerySchema, 'query'))
  @Permission([
    ['tenants', [Action.READ]],
    ['orders', [Action.CREATE]],
  ])
  findAll(@Query() query: TenantQueryDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.tenantsService.findAll(query, user);
  }

  @Get('id/:id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  @UsePipes(new ZodValidationPipe(TenantIdSchema, 'params'))
  @Permission([
    ['tenants', [Action.READ]],
    ['orders', [Action.CREATE]],
  ])
  findById(@Param() { id }: TenantIdDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.tenantsService.findById(id, user);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get tenant by slug' })
  @UsePipes(new ZodValidationPipe(TenantSlugSchema, 'params'))
  @Permission('tenants', [Action.READ])
  findBySlug(@Param() { slug }: TenantSlugDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.tenantsService.findBySlug(slug, user);
  }

  @OptionalAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateTenantDto })
  @UsePipes(new ZodValidationPipe(CreateTenantSchema))
  @UseInterceptors(new FileUploadInterceptor({ fieldName: 'image', dest: './uploads/tenants' }))
  @Permission('tenants', [Action.CREATE])
  create(
    @Body() data: CreateTenantDto,
    @CurrentUser() user: CurrentUserWithRole,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.tenantsService.create(data, user, file);
  }

  @Put('id/:id')
  @ApiOperation({ summary: 'Update a tenant' })
  @ApiConsumes('multipart/form-data')
  @UsePipes(new ZodValidationPipe(TenantIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateTenantSchema))
  @UseInterceptors(new FileUploadInterceptor({ fieldName: 'image', dest: './uploads/tenants' }))
  @Permission('tenants', [Action.UPDATE])
  update(
    @Param() { id }: TenantIdDto,
    @Body() data: UpdateTenantDto,
    @CurrentUser() user: CurrentUserWithRole,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.tenantsService.update(id, data, user, file);
  }

  @Delete('id/:id/image')
  @ApiOperation({ summary: 'Delete tenant image' })
  @UsePipes(new ZodValidationPipe(TenantIdSchema, 'params'))
  @Permission('tenants', [Action.UPDATE])
  deleteImage(@Param() { id }: TenantIdDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.tenantsService.deleteImage(id, user);
  }

  @Get('id/:id/outlets')
  @ApiOperation({ summary: 'Get all outlets for a tenant by ID' })
  @UsePipes(new ZodValidationPipe(TenantIdSchema, 'params'))
  @Permission('tenants', [Action.READ])
  findOutletsById(@Param() { id }: TenantIdDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.tenantsService.findOutletsById(id, user);
  }

  @Delete(':slug')
  @ApiOperation({ summary: 'Delete a tenant' })
  @UsePipes(new ZodValidationPipe(TenantSlugSchema, 'params'))
  @Permission('tenants', [Action.DELETE])
  remove(@Param() { slug }: TenantSlugDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.tenantsService.remove(slug, user);
  }

  @Get(':slug/summary')
  @ApiOperation({
    summary: 'Get tenant summary (counts for outlets, categories, products, user)',
  })
  @UsePipes(new ZodValidationPipe(TenantSummarySchema, 'params'))
  @Permission('tenants', [Action.READ])
  getSummary(@Param() { slug }: TenantSummaryDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.tenantsService.getSummary(slug, user);
  }

  @Get(':slug/users')
  @ApiOperation({ summary: 'Get all users for a tenant' })
  @UsePipes(new ZodValidationPipe(TenantSlugSchema, 'params'))
  @Permission('tenants', [Action.READ])
  findUsers(@Param() { slug }: TenantSlugDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.tenantsService.findUsers(slug, user);
  }

  @Get(':slug/outlets')
  @ApiOperation({ summary: 'Get all outlets for a tenant' })
  @UsePipes(new ZodValidationPipe(TenantSlugSchema, 'params'))
  @Permission('tenants', [Action.READ])
  findOutlets(@Param() { slug }: TenantSlugDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.tenantsService.findOutlets(slug, user);
  }
}
