import { CurrentUser, type CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreateStockDto,
  CreateStockSchema,
  StockIdDto,
  StockIdSchema,
  StockQueryDto,
  StockQuerySchema,
  UpdateStockDto,
  UpdateStockSchema,
} from './dto';
import { StocksService } from './stocks.service';

@ApiTags('stocks')
@Controller('stocks')
@UseGuards(JwtAuthGuard, PermissionGuard, ScopeGuard)
@TenantScope()
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all stocks' })
  @UsePipes(new ZodValidationPipe(StockQuerySchema, 'query'))
  @Permission('stocks', [Action.READ])
  findAll(@Query() query: StockQueryDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.stocksService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get stock by ID' })
  @UsePipes(new ZodValidationPipe(StockIdSchema, 'params'))
  @Permission('stocks', [Action.READ])
  findById(@Param() { id }: StockIdDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.stocksService.findById(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new stock' })
  @UsePipes(new ZodValidationPipe(CreateStockSchema))
  @Permission('stocks', [Action.CREATE])
  create(@Body() data: CreateStockDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.stocksService.create(data, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a stock' })
  @UsePipes(new ZodValidationPipe(StockIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateStockSchema))
  @Permission('stocks', [Action.UPDATE])
  update(
    @Param() { id }: StockIdDto,
    @Body() data: UpdateStockDto,
    @CurrentUser() user: CurrentUserWithRole,
  ) {
    return this.stocksService.update(id, data, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a stock' })
  @UsePipes(new ZodValidationPipe(StockIdSchema, 'params'))
  @Permission('stocks', [Action.DELETE])
  remove(@Param() { id }: StockIdDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.stocksService.remove(id, user);
  }
}
