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
import { CashShiftsService } from './cash-shifts.service';
import {
  CashShiftIdDto,
  CashShiftIdSchema,
  CashShiftQueryDto,
  CashShiftQuerySchema,
  CreateCashShiftDto,
  CreateCashShiftSchema,
  UpdateCashShiftDto,
  UpdateCashShiftSchema,
} from './dto';

@ApiTags('cash-shifts')
@Controller('cash-shifts')
@UseGuards(JwtAuthGuard, PermissionGuard, ScopeGuard)
@TenantScope()
export class CashShiftsController {
  constructor(private readonly cashShiftsService: CashShiftsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all cash shifts' })
  @UsePipes(new ZodValidationPipe(CashShiftQuerySchema, 'query'))
  @Permission('cashShifts', [Action.READ])
  findAll(@Query() query: CashShiftQueryDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.cashShiftsService.findAll(query, user);
  }

  @Get('open')
  @ApiOperation({ summary: 'Get open cash shift for current user outlet' })
  @Permission('cashShifts', [Action.READ])
  findOpen(@CurrentUser() user: CurrentUserWithRole, @Query('outletId') outletId?: string) {
    const targetOutletId = outletId || user.outletId;
    if (!targetOutletId) {
      return null;
    }
    return this.cashShiftsService.findOpenShift(targetOutletId, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cash shift by ID' })
  @UsePipes(new ZodValidationPipe(CashShiftIdSchema, 'params'))
  @Permission('cashShifts', [Action.READ])
  findById(@Param() { id }: CashShiftIdDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.cashShiftsService.findById(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Open a new cash shift' })
  @UsePipes(new ZodValidationPipe(CreateCashShiftSchema))
  @Permission('cashShifts', [Action.CREATE])
  create(@Body() data: CreateCashShiftDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.cashShiftsService.create(data, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a cash shift (close shift)' })
  @UsePipes(new ZodValidationPipe(CashShiftIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateCashShiftSchema))
  @Permission('cashShifts', [Action.UPDATE])
  update(
    @Param() { id }: CashShiftIdDto,
    @Body() data: UpdateCashShiftDto,
    @CurrentUser() user: CurrentUserWithRole,
  ) {
    return this.cashShiftsService.update(id, data, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a cash shift' })
  @UsePipes(new ZodValidationPipe(CashShiftIdSchema, 'params'))
  @Permission('cashShifts', [Action.DELETE])
  remove(@Param() { id }: CashShiftIdDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.cashShiftsService.remove(id, user);
  }
}
