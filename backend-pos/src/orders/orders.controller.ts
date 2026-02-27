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
import { OrdersService } from './orders.service';
import {
  CreateOrderSchema,
  UpdateOrderSchema,
  OrderIdSchema,
  OrderQuerySchema,
  CreateOrderDto,
  UpdateOrderDto,
  OrderIdDto,
  OrderQueryDto,
} from './dto';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { CurrentUser, type CurrentUserType } from '@/common/decorators/current-user.decorator';

@ApiTags('orders')
@Controller('orders')
@UseGuards(AuthGuard, PermissionGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @UsePipes(new ZodValidationPipe(OrderQuerySchema, 'query'))
  findAll(@Query() query: OrderQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @UsePipes(new ZodValidationPipe(OrderIdSchema, 'params'))
  findById(@Param() { id }: OrderIdDto, @CurrentUser() user: CurrentUserType) {
    return this.ordersService.findById(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @UsePipes(new ZodValidationPipe(CreateOrderSchema))
  create(@Body() data: CreateOrderDto, @CurrentUser() user: CurrentUserType) {
    return this.ordersService.create(data, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an order' })
  @UsePipes(new ZodValidationPipe(OrderIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateOrderSchema))
  update(
    @Param() { id }: OrderIdDto,
    @Body() data: UpdateOrderDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.ordersService.update(id, data, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an order' })
  @UsePipes(new ZodValidationPipe(OrderIdSchema, 'params'))
  remove(@Param() { id }: OrderIdDto, @CurrentUser() user: CurrentUserType) {
    return this.ordersService.remove(id, user);
  }
}
