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
  CreateOrderItemDto,
  CreateOrderItemSchema,
  OrderItemIdDto,
  OrderItemIdSchema,
  OrderItemQueryDto,
  OrderItemQuerySchema,
  UpdateOrderItemDto,
  UpdateOrderItemSchema,
} from './dto';
import { OrderItemsService } from './order-items.service';

@ApiTags('order-items')
@Controller('order-items')
@UseGuards(JwtAuthGuard, PermissionGuard, ScopeGuard)
@TenantScope()
export class OrderItemsController {
  constructor(private readonly orderItemsService: OrderItemsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all order items' })
  @UsePipes(new ZodValidationPipe(OrderItemQuerySchema, 'query'))
  @Permission('orderItems', [Action.READ])
  findAll(@Query() query: OrderItemQueryDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.orderItemsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order item by ID' })
  @UsePipes(new ZodValidationPipe(OrderItemIdSchema, 'params'))
  @Permission('orderItems', [Action.READ])
  findById(@Param() { id }: OrderItemIdDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.orderItemsService.findById(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new order item' })
  @UsePipes(new ZodValidationPipe(CreateOrderItemSchema))
  @Permission('orderItems', [Action.CREATE])
  create(@Body() data: CreateOrderItemDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.orderItemsService.create(data, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an order item' })
  @UsePipes(new ZodValidationPipe(OrderItemIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateOrderItemSchema))
  @Permission('orderItems', [Action.UPDATE])
  update(
    @Param() { id }: OrderItemIdDto,
    @Body() data: UpdateOrderItemDto,
    @CurrentUser() user: CurrentUserWithRole,
  ) {
    return this.orderItemsService.update(id, data, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an order item' })
  @UsePipes(new ZodValidationPipe(OrderItemIdSchema, 'params'))
  @Permission('orderItems', [Action.DELETE])
  remove(@Param() { id }: OrderItemIdDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.orderItemsService.remove(id, user);
  }
}
