import { CurrentUser, type CurrentUserType } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { Action, Permission, PermissionGuard, ScopeGuard, TenantScope } from '@/rbac';
import { Body, Controller, Get, Param, Post, Query, UseGuards, UsePipes } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreateStockAdjustmentDto,
  CreateStockAdjustmentSchema,
  StockAdjustmentQueryDto,
  StockAdjustmentQuerySchema,
} from './dto';
import { StockAdjustmentsService } from './stock-adjustments.service';

@ApiTags('stock-adjustments')
@Controller('stock-adjustments')
@UseGuards(JwtAuthGuard, PermissionGuard, ScopeGuard)
@TenantScope()
export class StockAdjustmentsController {
  constructor(private readonly stockAdjustmentsService: StockAdjustmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all stock adjustments' })
  @UsePipes(new ZodValidationPipe(StockAdjustmentQuerySchema, 'query'))
  @Permission('stockAdjustments', [Action.READ])
  findAll(@Query() query: StockAdjustmentQueryDto, @CurrentUser() user: CurrentUserType) {
    return this.stockAdjustmentsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get stock adjustment by ID' })
  @Permission('stockAdjustments', [Action.READ])
  findById(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.stockAdjustmentsService.findById(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new stock adjustment' })
  @UsePipes(new ZodValidationPipe(CreateStockAdjustmentSchema))
  @Permission('stockAdjustments', [Action.CREATE])
  create(@Body() data: CreateStockAdjustmentDto, @CurrentUser() user: CurrentUserType) {
    return this.stockAdjustmentsService.create(data, user);
  }
}
