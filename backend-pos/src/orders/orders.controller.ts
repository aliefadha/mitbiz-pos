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
  CancelOrderDto,
  CancelOrderSchema,
  CreateOrderDto,
  CreateOrderSchema,
  OrderIdDto,
  OrderIdSchema,
  OrderQueryDto,
  OrderQuerySchema,
  RefundOrderDto,
  RefundOrderSchema,
  UpdateOrderDto,
  UpdateOrderSchema,
} from './dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard, PermissionGuard, ScopeGuard)
@TenantScope()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @Permission('orders', [Action.READ])
  @UsePipes(new ZodValidationPipe(OrderQuerySchema, 'query'))
  findAll(@Query() query: OrderQueryDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.ordersService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @Permission('orders', [Action.READ])
  @UsePipes(new ZodValidationPipe(OrderIdSchema, 'params'))
  findById(@Param() { id }: OrderIdDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.ordersService.findById(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @Permission('orders', [Action.CREATE])
  @UsePipes(new ZodValidationPipe(CreateOrderSchema))
  create(@Body() data: CreateOrderDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.ordersService.create(data, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an order' })
  @Permission('orders', [Action.UPDATE])
  @UsePipes(new ZodValidationPipe(OrderIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateOrderSchema))
  update(
    @Param() { id }: OrderIdDto,
    @Body() data: UpdateOrderDto,
    @CurrentUser() user: CurrentUserWithRole,
  ) {
    return this.ordersService.update(id, data, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an order' })
  @Permission('orders', [Action.DELETE])
  @UsePipes(new ZodValidationPipe(OrderIdSchema, 'params'))
  remove(@Param() { id }: OrderIdDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.ordersService.remove(id, user);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  @Permission('orders', [Action.CANCEL])
  @UsePipes(new ZodValidationPipe(OrderIdSchema, 'params'))
  cancel(@Param() { id }: OrderIdDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.ordersService.cancel(id, user);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund an order' })
  @Permission('orders', [Action.REFUND])
  @UsePipes(new ZodValidationPipe(OrderIdSchema, 'params'))
  refund(@Param() { id }: OrderIdDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.ordersService.refund(id, user);
  }
}
