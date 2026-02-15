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
import { AuthGuard } from '@thallesp/nestjs-better-auth';

@ApiTags('stock-adjustments')
@Controller('stock-adjustments')
@UseGuards(AuthGuard)
export class StockAdjustmentsController {
  constructor(private readonly stockAdjustmentsService: StockAdjustmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all stock adjustments' })
  @UsePipes(new ZodValidationPipe(StockAdjustmentQuerySchema, 'query'))
  findAll(@Query() query: StockAdjustmentQueryDto) {
    return this.stockAdjustmentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get stock adjustment by ID' })
  findById(@Param('id') id: string) {
    return this.stockAdjustmentsService.findById(parseInt(id, 10));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new stock adjustment' })
  @UsePipes(new ZodValidationPipe(CreateStockAdjustmentSchema))
  create(@Body() data: CreateStockAdjustmentDto) {
    return this.stockAdjustmentsService.create(data);
  }
}
