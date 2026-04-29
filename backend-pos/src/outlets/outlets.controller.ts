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
import {
  CreateOutletDto,
  CreateOutletSchema,
  OutletIdDto,
  OutletIdSchema,
  OutletQueryDto,
  OutletQuerySchema,
  UpdateOutletDto,
  UpdateOutletSchema,
} from './dto';
import { OutletsService } from './outlets.service';

@ApiTags('outlets')
@Controller('outlets')
@UseGuards(JwtAuthGuard, PermissionGuard, ScopeGuard)
@TenantScope()
export class OutletsController {
  constructor(private readonly outletsService: OutletsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all outlets' })
  @UsePipes(new ZodValidationPipe(OutletQuerySchema, 'query'))
  @Permission([
    ['cashShifts', [Action.READ]],
    ['orders', [Action.CREATE]],
  ])
  findAll(@Query() query: OutletQueryDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.outletsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get outlet by ID' })
  @UsePipes(new ZodValidationPipe(OutletIdSchema, 'params'))
  @Permission('outlets', [Action.READ])
  @Permission('orders', [Action.CREATE])
  findById(@Param() { id }: OutletIdDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.outletsService.findById(id, user);
  }

  @Post()
  @HttpCode(204)
  @ApiOperation({ summary: 'Create a new outlet' })
  @UsePipes(new ZodValidationPipe(CreateOutletSchema))
  @Permission('outlets', [Action.CREATE])
  async create(@Body() data: CreateOutletDto, @CurrentUser() user: CurrentUserWithRole) {
    await this.outletsService.create(data, user);
  }

  @Put(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Update an outlet' })
  @UsePipes(new ZodValidationPipe(OutletIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateOutletSchema))
  @Permission('outlets', [Action.UPDATE])
  async update(
    @Param() { id }: OutletIdDto,
    @Body() data: UpdateOutletDto,
    @CurrentUser() user: CurrentUserWithRole,
  ) {
    await this.outletsService.update(id, data, user);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an outlet' })
  @UsePipes(new ZodValidationPipe(OutletIdSchema, 'params'))
  @Permission('outlets', [Action.DELETE])
  async remove(@Param() { id }: OutletIdDto, @CurrentUser() user: CurrentUserWithRole) {
    await this.outletsService.remove(id, user);
  }
}
