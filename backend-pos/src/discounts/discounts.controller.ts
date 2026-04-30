import { CurrentUser, type CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { Action, Permission, PermissionGuard, ScopeGuard, TenantScope } from '@/rbac';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DiscountsService } from './discounts.service';
import {
  CreateDiscountDto,
  CreateDiscountSchema,
  DiscountIdDto,
  DiscountIdSchema,
  DiscountQueryDto,
  DiscountQuerySchema,
  UpdateDiscountDto,
  UpdateDiscountSchema,
} from './dto';

@ApiTags('discounts')
@Controller('discounts')
@UseGuards(JwtAuthGuard, PermissionGuard, ScopeGuard)
@TenantScope()
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all discounts' })
  @UsePipes(new ZodValidationPipe(DiscountQuerySchema, 'query'))
  @Permission([
    ['discounts', [Action.READ]],
    ['orders', [Action.CREATE]],
  ])
  findAll(@Query() query: DiscountQueryDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.discountsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get discount by ID' })
  @UsePipes(new ZodValidationPipe(DiscountIdSchema, 'params'))
  @Permission('discounts', [Action.READ])
  @Permission('orders', [Action.CREATE])
  findById(@Param() { id }: DiscountIdDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.discountsService.findById(id, user);
  }

  @Post()
  @HttpCode(204)
  @ApiOperation({ summary: 'Create a new discount' })
  @UsePipes(new ZodValidationPipe(CreateDiscountSchema))
  @Permission('discounts', [Action.CREATE])
  async create(@Body() data: CreateDiscountDto, @CurrentUser() user: CurrentUserWithRole) {
    await this.discountsService.create(data, user);
  }

  @Put(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Update a discount' })
  @UsePipes(new ZodValidationPipe(DiscountIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateDiscountSchema))
  @Permission('discounts', [Action.UPDATE])
  async update(
    @Param() { id }: DiscountIdDto,
    @Body() data: UpdateDiscountDto,
    @CurrentUser() user: CurrentUserWithRole,
  ) {
    await this.discountsService.update(id, data, user);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a discount' })
  @UsePipes(new ZodValidationPipe(DiscountIdSchema, 'params'))
  @Permission('discounts', [Action.DELETE])
  async remove(@Param() { id }: DiscountIdDto, @CurrentUser() user: CurrentUserWithRole) {
    await this.discountsService.remove(id, user);
  }
}
