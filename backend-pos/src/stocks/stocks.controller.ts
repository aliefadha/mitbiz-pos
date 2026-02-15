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
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { StocksService } from './stocks.service';
import {
  CreateStockSchema,
  UpdateStockSchema,
  StockIdSchema,
  StockQuerySchema,
  CreateStockDto,
  UpdateStockDto,
  StockIdDto,
  StockQueryDto,
} from './dto';
import { AuthGuard } from '@thallesp/nestjs-better-auth';

@ApiTags('stocks')
@Controller('stocks')
@UseGuards(AuthGuard)
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all stocks' })
  @UsePipes(new ZodValidationPipe(StockQuerySchema, 'query'))
  findAll(@Query() query: StockQueryDto) {
    return this.stocksService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get stock by ID' })
  @UsePipes(new ZodValidationPipe(StockIdSchema, 'params'))
  findById(@Param() { id }: StockIdDto) {
    return this.stocksService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new stock' })
  @UsePipes(new ZodValidationPipe(CreateStockSchema))
  create(@Body() data: CreateStockDto) {
    return this.stocksService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a stock' })
  @UsePipes(new ZodValidationPipe(StockIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateStockSchema))
  update(@Param() { id }: StockIdDto, @Body() data: UpdateStockDto) {
    return this.stocksService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a stock' })
  @UsePipes(new ZodValidationPipe(StockIdSchema, 'params'))
  remove(@Param() { id }: StockIdDto) {
    return this.stocksService.remove(id);
  }
}
