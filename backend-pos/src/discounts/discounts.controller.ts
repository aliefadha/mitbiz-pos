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
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { DiscountsService } from './discounts.service';
import {
  CreateDiscountSchema,
  UpdateDiscountSchema,
  DiscountIdSchema,
  DiscountQuerySchema,
  CreateDiscountDto,
  UpdateDiscountDto,
  DiscountIdDto,
  DiscountQueryDto,
} from './dto';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { CurrentUser, type CurrentUserType } from '@/common/decorators/current-user.decorator';

@ApiTags('discounts')
@Controller('discounts')
@UseGuards(AuthGuard, PermissionGuard)
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all discounts' })
  @UsePipes(new ZodValidationPipe(DiscountQuerySchema, 'query'))
  findAll(@Query() query: DiscountQueryDto) {
    return this.discountsService.findAll(query);
  }

  @Get('active-for-outlet')
  @ApiOperation({ summary: 'Get active discounts for a specific outlet' })
  @ApiQuery({ name: 'tenantId', required: true, type: String })
  @ApiQuery({ name: 'outletId', required: true, type: String })
  findActiveForOutlet(@Query('tenantId') tenantId: string, @Query('outletId') outletId: string) {
    return this.discountsService.findActiveForOutlet(tenantId, outletId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get discount by ID' })
  @UsePipes(new ZodValidationPipe(DiscountIdSchema, 'params'))
  findById(@Param() { id }: DiscountIdDto, @CurrentUser() user: CurrentUserType) {
    return this.discountsService.findById(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new discount' })
  @UsePipes(new ZodValidationPipe(CreateDiscountSchema))
  create(@Body() data: CreateDiscountDto, @CurrentUser() user: CurrentUserType) {
    return this.discountsService.create(data, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a discount' })
  @UsePipes(new ZodValidationPipe(DiscountIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateDiscountSchema))
  update(
    @Param() { id }: DiscountIdDto,
    @Body() data: UpdateDiscountDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.discountsService.update(id, data, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a discount' })
  @UsePipes(new ZodValidationPipe(DiscountIdSchema, 'params'))
  remove(@Param() { id }: DiscountIdDto, @CurrentUser() user: CurrentUserType) {
    return this.discountsService.remove(id, user);
  }
}
