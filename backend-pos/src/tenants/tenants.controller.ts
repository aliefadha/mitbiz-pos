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
  Req,
  Headers,
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
import { AuthGuard, AllowAnonymous } from '@thallesp/nestjs-better-auth';

@ApiTags('tenants')
@Controller('tenants')
@UseGuards(AuthGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tenants' })
  @UsePipes(new ZodValidationPipe(TenantQuerySchema, 'query'))
  findAll(@Query() query: TenantQueryDto, @Req() req: any, @Headers('x-user-id') headerUserId?: string) {
    const role = req.user?.role;
    
    if (role !== 'admin' && headerUserId) {
      query.userId = headerUserId;
    }
    
    return this.tenantsService.findAll(query);
  }

  @Get(':slug')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Get tenant by slug (public)' })
  @UsePipes(new ZodValidationPipe(TenantSlugSchema, 'params'))
  findBySlug(@Param() { slug }: TenantSlugDto) {
    return this.tenantsService.findBySlug(slug);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiBody({ type: CreateTenantDto })
  @UsePipes(new ZodValidationPipe(CreateTenantSchema))
  create(@Body() data: CreateTenantDto, @Req() req: any) {
    const loggedInUserId = req.user?.id;
    const role = req.user?.role;
    let userId: string | undefined;

    if (role === 'admin' && data.userId) {
      userId = data.userId;
    } else {
      userId = loggedInUserId;
    }

    return this.tenantsService.create({
      ...data,
      userId,
    });
  }

  @Put(':slug')
  @ApiOperation({ summary: 'Update a tenant' })
  @UsePipes(new ZodValidationPipe(TenantSlugSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateTenantSchema))
  update(@Param() { slug }: TenantSlugDto, @Body() data: UpdateTenantDto) {
    return this.tenantsService.update(slug, data);
  }

  @Delete(':slug')
  @ApiOperation({ summary: 'Delete a tenant' })
  @UsePipes(new ZodValidationPipe(TenantSlugSchema, 'params'))
  remove(@Param() { slug }: TenantSlugDto) {
    return this.tenantsService.remove(slug);
  }

  @Get(':slug/summary')
  @ApiOperation({ summary: 'Get tenant summary (counts for outlets, categories, products, user)' })
  @UsePipes(new ZodValidationPipe(TenantSummarySchema, 'params'))
  getSummary(@Param() { slug }: TenantSummaryDto) {
    return this.tenantsService.getSummary(slug);
  }
}
