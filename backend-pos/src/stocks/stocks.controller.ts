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
import { AuthGuard, Roles } from '@thallesp/nestjs-better-auth';
import {
  CurrentUser,
  type CurrentUserType,
} from '../common/decorators/current-user.decorator';

@ApiTags('stocks')
@Controller('stocks')
@UseGuards(AuthGuard)
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Roles(['admin', 'owner', 'cashier'])
  @Get()
  @ApiOperation({ summary: 'Get all stocks' })
  @UsePipes(new ZodValidationPipe(StockQuerySchema, 'query'))
  findAll(@Query() query: StockQueryDto, @CurrentUser() user: CurrentUserType) {
    return this.stocksService.findAll(query, user);
  }

  @Roles(['admin', 'owner', 'cashier'])
  @Get(':id')
  @ApiOperation({ summary: 'Get stock by ID' })
  @UsePipes(new ZodValidationPipe(StockIdSchema, 'params'))
  findById(@Param() { id }: StockIdDto, @CurrentUser() user: CurrentUserType) {
    return this.stocksService.findById(id, user);
  }

  @Roles(['admin', 'owner'])
  @Post()
  @ApiOperation({ summary: 'Create a new stock' })
  @UsePipes(new ZodValidationPipe(CreateStockSchema))
  create(@Body() data: CreateStockDto, @CurrentUser() user: CurrentUserType) {
    return this.stocksService.create(data, user);
  }

  @Roles(['admin', 'owner'])
  @Put(':id')
  @ApiOperation({ summary: 'Update a stock' })
  @UsePipes(new ZodValidationPipe(StockIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateStockSchema))
  update(
    @Param() { id }: StockIdDto,
    @Body() data: UpdateStockDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.stocksService.update(id, data, user);
  }

  @Roles(['admin', 'owner'])
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a stock' })
  @UsePipes(new ZodValidationPipe(StockIdSchema, 'params'))
  remove(@Param() { id }: StockIdDto, @CurrentUser() user: CurrentUserType) {
    return this.stocksService.remove(id, user);
  }
}
