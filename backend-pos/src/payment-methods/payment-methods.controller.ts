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
  CreatePaymentMethodDto,
  CreatePaymentMethodSchema,
  PaymentMethodIdDto,
  PaymentMethodIdSchema,
  PaymentMethodQueryDto,
  PaymentMethodQuerySchema,
  UpdatePaymentMethodDto,
  UpdatePaymentMethodSchema,
} from './dto';
import { PaymentMethodsService } from './payment-methods.service';

@ApiTags('payment-methods')
@Controller('payment-methods')
@UseGuards(JwtAuthGuard, PermissionGuard, ScopeGuard)
@TenantScope()
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all payment methods' })
  @UsePipes(new ZodValidationPipe(PaymentMethodQuerySchema, 'query'))
  @Permission([
    ['paymentMethods', [Action.READ]],
    ['orders', [Action.CREATE]],
  ])
  findAll(@Query() query: PaymentMethodQueryDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.paymentMethodsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment method by ID' })
  @UsePipes(new ZodValidationPipe(PaymentMethodIdSchema, 'params'))
  @Permission('paymentMethods', [Action.READ])
  findById(@Param() { id }: PaymentMethodIdDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.paymentMethodsService.findById(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new payment method' })
  @UsePipes(new ZodValidationPipe(CreatePaymentMethodSchema))
  @Permission('paymentMethods', [Action.CREATE])
  create(@Body() data: CreatePaymentMethodDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.paymentMethodsService.create(data, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a payment method' })
  @UsePipes(new ZodValidationPipe(PaymentMethodIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdatePaymentMethodSchema))
  @Permission('paymentMethods', [Action.UPDATE])
  update(
    @Param() { id }: PaymentMethodIdDto,
    @Body() data: UpdatePaymentMethodDto,
    @CurrentUser() user: CurrentUserWithRole,
  ) {
    return this.paymentMethodsService.update(id, data, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a payment method' })
  @UsePipes(new ZodValidationPipe(PaymentMethodIdSchema, 'params'))
  @Permission('paymentMethods', [Action.DELETE])
  remove(@Param() { id }: PaymentMethodIdDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.paymentMethodsService.remove(id, user);
  }
}
