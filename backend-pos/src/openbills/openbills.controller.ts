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
  AddItemToOpenBillDto,
  AddItemToOpenBillSchema,
  CloseOpenBillDto,
  CloseOpenBillSchema,
  CreateOpenBillDto,
  CreateOpenBillSchema,
  OpenBillIdDto,
  OpenBillIdSchema,
  OpenBillQueryDto,
  OpenBillQuerySchema,
  UpdateOpenBillDto,
  UpdateOpenBillSchema,
} from './dto';
import { OpenBillsService } from './openbills.service';

@ApiTags('openbills')
@Controller('openbills')
@UseGuards(JwtAuthGuard, PermissionGuard, ScopeGuard)
@TenantScope()
export class OpenBillsController {
  constructor(private readonly openBillsService: OpenBillsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all open bills' })
  @Permission('openBills', [Action.READ])
  @UsePipes(new ZodValidationPipe(OpenBillQuerySchema, 'query'))
  findAll(@Query() query: OpenBillQueryDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.openBillsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get open bill by ID' })
  @Permission('openBills', [Action.READ])
  @UsePipes(new ZodValidationPipe(OpenBillIdSchema, 'params'))
  findById(@Param() { id }: OpenBillIdDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.openBillsService.findById(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new open bill' })
  @Permission('openBills', [Action.CREATE])
  @UsePipes(new ZodValidationPipe(CreateOpenBillSchema))
  create(@Body() data: CreateOpenBillDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.openBillsService.create(data, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an open bill' })
  @Permission('openBills', [Action.UPDATE])
  @UsePipes(new ZodValidationPipe(OpenBillIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateOpenBillSchema))
  update(
    @Param() { id }: OpenBillIdDto,
    @Body() data: UpdateOpenBillDto,
    @CurrentUser() user: CurrentUserWithRole,
  ) {
    return this.openBillsService.update(id, data, user);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add item to open bill' })
  @Permission('openBills', [Action.UPDATE])
  @UsePipes(new ZodValidationPipe(OpenBillIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(AddItemToOpenBillSchema))
  addItem(
    @Param() { id }: OpenBillIdDto,
    @Body() data: AddItemToOpenBillDto,
    @CurrentUser() user: CurrentUserWithRole,
  ) {
    return this.openBillsService.addItem(id, data, user);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Remove item from open bill' })
  @Permission('openBills', [Action.UPDATE])
  @UsePipes(new ZodValidationPipe(OpenBillIdSchema, 'params'))
  removeItem(
    @Param() { id }: OpenBillIdDto,
    @Param('itemId') itemId: string,
    @CurrentUser() user: CurrentUserWithRole,
  ) {
    return this.openBillsService.removeItem(id, itemId, user);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close/complete an open bill' })
  @Permission('openBills', [Action.UPDATE])
  @UsePipes(new ZodValidationPipe(OpenBillIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(CloseOpenBillSchema))
  close(
    @Param() { id }: OpenBillIdDto,
    @Body() data: CloseOpenBillDto,
    @CurrentUser() user: CurrentUserWithRole,
  ) {
    return this.openBillsService.close(id, data, user);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an open bill' })
  @Permission('openBills', [Action.DELETE])
  @UsePipes(new ZodValidationPipe(OpenBillIdSchema, 'params'))
  cancel(@Param() { id }: OpenBillIdDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.openBillsService.cancel(id, user);
  }
}
