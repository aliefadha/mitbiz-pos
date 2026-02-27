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
import { CashShiftsService } from './cash-shifts.service';
import {
  CreateCashShiftSchema,
  UpdateCashShiftSchema,
  CashShiftIdSchema,
  CashShiftQuerySchema,
  CreateCashShiftDto,
  UpdateCashShiftDto,
  CashShiftIdDto,
  CashShiftQueryDto,
} from './dto';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { CurrentUser, type CurrentUserType } from '@/common/decorators/current-user.decorator';

@ApiTags('cash-shifts')
@Controller('cash-shifts')
@UseGuards(AuthGuard, PermissionGuard)
export class CashShiftsController {
  constructor(private readonly cashShiftsService: CashShiftsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all cash shifts' })
  @UsePipes(new ZodValidationPipe(CashShiftQuerySchema, 'query'))
  findAll(@Query() query: CashShiftQueryDto) {
    return this.cashShiftsService.findAll(query);
  }

  @Get('open')
  @ApiOperation({ summary: 'Get open cash shift for current user outlet' })
  findOpen(@CurrentUser() user: CurrentUserType, @Query('outletId') outletId?: string) {
    const targetOutletId = outletId || user.outletId;
    if (!targetOutletId) {
      return null;
    }
    return this.cashShiftsService.findOpenShift(targetOutletId, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cash shift by ID' })
  @UsePipes(new ZodValidationPipe(CashShiftIdSchema, 'params'))
  findById(@Param() { id }: CashShiftIdDto, @CurrentUser() user: CurrentUserType) {
    return this.cashShiftsService.findById(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Open a new cash shift' })
  @UsePipes(new ZodValidationPipe(CreateCashShiftSchema))
  create(@Body() data: CreateCashShiftDto, @CurrentUser() user: CurrentUserType) {
    return this.cashShiftsService.create(data, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a cash shift (close shift)' })
  @UsePipes(new ZodValidationPipe(CashShiftIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateCashShiftSchema))
  update(
    @Param() { id }: CashShiftIdDto,
    @Body() data: UpdateCashShiftDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.cashShiftsService.update(id, data, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a cash shift' })
  @UsePipes(new ZodValidationPipe(CashShiftIdSchema, 'params'))
  remove(@Param() { id }: CashShiftIdDto, @CurrentUser() user: CurrentUserType) {
    return this.cashShiftsService.remove(id, user);
  }
}
