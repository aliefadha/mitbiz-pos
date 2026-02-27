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
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { OrderItemsService } from './order-items.service';
import {
  CreateOrderItemSchema,
  UpdateOrderItemSchema,
  OrderItemIdSchema,
  OrderItemQuerySchema,
  CreateOrderItemDto,
  UpdateOrderItemDto,
  OrderItemIdDto,
  OrderItemQueryDto,
} from './dto';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { CurrentUser, type CurrentUserType } from '@/common/decorators/current-user.decorator';

@ApiTags('order-items')
@Controller('order-items')
@UseGuards(AuthGuard, PermissionGuard)
export class OrderItemsController {
  constructor(private readonly orderItemsService: OrderItemsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all order items' })
  @UsePipes(new ZodValidationPipe(OrderItemQuerySchema, 'query'))
  findAll(@Query() query: OrderItemQueryDto) {
    return this.orderItemsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order item by ID' })
  @UsePipes(new ZodValidationPipe(OrderItemIdSchema, 'params'))
  findById(@Param() { id }: OrderItemIdDto, @CurrentUser() user: CurrentUserType) {
    return this.orderItemsService.findById(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new order item' })
  @UsePipes(new ZodValidationPipe(CreateOrderItemSchema))
  create(@Body() data: CreateOrderItemDto, @CurrentUser() user: CurrentUserType) {
    return this.orderItemsService.create(data, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an order item' })
  @UsePipes(new ZodValidationPipe(OrderItemIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateOrderItemSchema))
  update(
    @Param() { id }: OrderItemIdDto,
    @Body() data: UpdateOrderItemDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.orderItemsService.update(id, data, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an order item' })
  @UsePipes(new ZodValidationPipe(OrderItemIdSchema, 'params'))
  remove(@Param() { id }: OrderItemIdDto, @CurrentUser() user: CurrentUserType) {
    return this.orderItemsService.remove(id, user);
  }
}
