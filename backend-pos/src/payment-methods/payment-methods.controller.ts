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
import { PaymentMethodsService } from './payment-methods.service';
import {
  CreatePaymentMethodSchema,
  UpdatePaymentMethodSchema,
  PaymentMethodIdSchema,
  PaymentMethodQuerySchema,
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
  PaymentMethodIdDto,
  PaymentMethodQueryDto,
} from './dto';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { CurrentUser, type CurrentUserType } from '@/common/decorators/current-user.decorator';

@ApiTags('payment-methods')
@Controller('payment-methods')
@UseGuards(AuthGuard, PermissionGuard)
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all payment methods' })
  @UsePipes(new ZodValidationPipe(PaymentMethodQuerySchema, 'query'))
  findAll(@Query() query: PaymentMethodQueryDto) {
    return this.paymentMethodsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment method by ID' })
  @UsePipes(new ZodValidationPipe(PaymentMethodIdSchema, 'params'))
  findById(@Param() { id }: PaymentMethodIdDto, @CurrentUser() user: CurrentUserType) {
    return this.paymentMethodsService.findById(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new payment method' })
  @UsePipes(new ZodValidationPipe(CreatePaymentMethodSchema))
  create(@Body() data: CreatePaymentMethodDto, @CurrentUser() user: CurrentUserType) {
    return this.paymentMethodsService.create(data, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a payment method' })
  @UsePipes(new ZodValidationPipe(PaymentMethodIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdatePaymentMethodSchema))
  update(
    @Param() { id }: PaymentMethodIdDto,
    @Body() data: UpdatePaymentMethodDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.paymentMethodsService.update(id, data, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a payment method' })
  @UsePipes(new ZodValidationPipe(PaymentMethodIdSchema, 'params'))
  remove(@Param() { id }: PaymentMethodIdDto, @CurrentUser() user: CurrentUserType) {
    return this.paymentMethodsService.remove(id, user);
  }
}
