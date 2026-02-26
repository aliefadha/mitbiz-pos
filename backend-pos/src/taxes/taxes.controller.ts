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
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { TaxesService } from './taxes.service';
import {
  CreateTaxSchema,
  UpdateTaxSchema,
  TaxIdSchema,
  TaxQuerySchema,
  CreateTaxDto,
  UpdateTaxDto,
  TaxIdDto,
  TaxQueryDto,
} from './dto';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { PermissionGuard } from '../common/guards/permission.guard';
import {
  CurrentUser,
  type CurrentUserType,
} from '../common/decorators/current-user.decorator';

@ApiTags('taxes')
@Controller('taxes')
@UseGuards(AuthGuard, PermissionGuard)
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all taxes' })
  @UsePipes(new ZodValidationPipe(TaxQuerySchema, 'query'))
  findAll(@Query() query: TaxQueryDto) {
    return this.taxesService.findAll(query);
  }

  @Get('active-for-outlet')
  @ApiOperation({ summary: 'Get active taxes for a specific outlet' })
  @ApiQuery({ name: 'tenantId', required: true, type: String })
  @ApiQuery({ name: 'outletId', required: true, type: String })
  findActiveForOutlet(
    @Query('tenantId') tenantId: string,
    @Query('outletId') outletId: string,
  ) {
    return this.taxesService.findActiveForOutlet(tenantId, outletId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tax by ID' })
  @UsePipes(new ZodValidationPipe(TaxIdSchema, 'params'))
  findById(@Param() { id }: TaxIdDto, @CurrentUser() user: CurrentUserType) {
    return this.taxesService.findById(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tax' })
  @UsePipes(new ZodValidationPipe(CreateTaxSchema))
  create(@Body() data: CreateTaxDto, @CurrentUser() user: CurrentUserType) {
    return this.taxesService.create(data, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a tax' })
  @UsePipes(new ZodValidationPipe(TaxIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateTaxSchema))
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
  remove(@Param() { id }: TaxIdDto, @CurrentUser() user: CurrentUserType) {
    return this.taxesService.remove(id, user);
  }
}
