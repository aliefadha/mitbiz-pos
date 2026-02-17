import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { StockAdjustmentsService } from './stock-adjustments.service';
import {
  CreateStockAdjustmentSchema,
  StockAdjustmentQuerySchema,
  CreateStockAdjustmentDto,
  StockAdjustmentQueryDto,
} from './dto';
import { AuthGuard, Roles } from '@thallesp/nestjs-better-auth';
import {
  CurrentUser,
  type CurrentUserType,
} from '../common/decorators/current-user.decorator';

@ApiTags('stock-adjustments')
@Controller('stock-adjustments')
@UseGuards(AuthGuard)
export class StockAdjustmentsController {
  constructor(
    private readonly stockAdjustmentsService: StockAdjustmentsService,
  ) {}

  @Roles(['admin', 'owner'])
  @Get()
  @ApiOperation({ summary: 'Get all stock adjustments' })
  @UsePipes(new ZodValidationPipe(StockAdjustmentQuerySchema, 'query'))
  findAll(
    @Query() query: StockAdjustmentQueryDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.stockAdjustmentsService.findAll(query, user);
  }

  @Roles(['admin', 'owner'])
  @Get(':id')
  @ApiOperation({ summary: 'Get stock adjustment by ID' })
  findById(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.stockAdjustmentsService.findById(parseInt(id, 10), user);
  }

  @Roles(['admin', 'owner'])
  @Post()
  @ApiOperation({ summary: 'Create a new stock adjustment' })
  @UsePipes(new ZodValidationPipe(CreateStockAdjustmentSchema))
  create(
    @Body() data: CreateStockAdjustmentDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.stockAdjustmentsService.create(data, user);
  }
}
