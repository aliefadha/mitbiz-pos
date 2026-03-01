import { CurrentUser, type CurrentUserType } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { Action, Permission, PermissionGuard, ScopeGuard, TenantScope } from '@/rbac';
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
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  CreateTaxDto,
  CreateTaxSchema,
  TaxIdDto,
  TaxIdSchema,
  TaxQueryDto,
  TaxQuerySchema,
  UpdateTaxDto,
  UpdateTaxSchema,
} from './dto';
import { TaxesService } from './taxes.service';

@ApiTags('taxes')
@Controller('taxes')
@UseGuards(JwtAuthGuard, PermissionGuard, ScopeGuard)
@TenantScope()
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all taxes' })
  @UsePipes(new ZodValidationPipe(TaxQuerySchema, 'query'))
  @Permission('taxes', [Action.READ])
  findAll(@Query() query: TaxQueryDto) {
    return this.taxesService.findAll(query);
  }

  @Get('active-for-outlet')
  @ApiOperation({ summary: 'Get active taxes for a specific outlet' })
  @ApiQuery({ name: 'tenantId', required: true, type: String })
  @ApiQuery({ name: 'outletId', required: true, type: String })
  @Permission('taxes', [Action.READ])
  findActiveForOutlet(@Query('tenantId') tenantId: string, @Query('outletId') outletId: string) {
    return this.taxesService.findActiveForOutlet(tenantId, outletId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tax by ID' })
  @UsePipes(new ZodValidationPipe(TaxIdSchema, 'params'))
  @Permission('taxes', [Action.READ])
  findById(@Param() { id }: TaxIdDto, @CurrentUser() user: CurrentUserType) {
    return this.taxesService.findById(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tax' })
  @UsePipes(new ZodValidationPipe(CreateTaxSchema))
  @Permission('taxes', [Action.CREATE])
  create(@Body() data: CreateTaxDto, @CurrentUser() user: CurrentUserType) {
    return this.taxesService.create(data, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a tax' })
  @UsePipes(new ZodValidationPipe(TaxIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateTaxSchema))
  @Permission('taxes', [Action.UPDATE])
  update(
    @Param() { id }: TaxIdDto,
    @Body() data: UpdateTaxDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.taxesService.update(id, data, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tax' })
  @UsePipes(new ZodValidationPipe(TaxIdSchema, 'params'))
  @Permission('taxes', [Action.DELETE])
  remove(@Param() { id }: TaxIdDto, @CurrentUser() user: CurrentUserType) {
    return this.taxesService.remove(id, user);
  }
}
