import { CurrentUser, type CurrentUserType } from '@/common/decorators/current-user.decorator';
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
  @Permission('outlets', [Action.READ])
  findAll(@Query() query: OutletQueryDto, @CurrentUser() user: CurrentUserType) {
    return this.outletsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get outlet by ID' })
  @UsePipes(new ZodValidationPipe(OutletIdSchema, 'params'))
  @Permission('outlets', [Action.READ])
  findById(@Param() { id }: OutletIdDto, @CurrentUser() user: CurrentUserType) {
    return this.outletsService.findById(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new outlet' })
  @UsePipes(new ZodValidationPipe(CreateOutletSchema))
  @Permission('outlets', [Action.CREATE])
  create(@Body() data: CreateOutletDto, @CurrentUser() user: CurrentUserType) {
    return this.outletsService.create(data, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an outlet' })
  @UsePipes(new ZodValidationPipe(OutletIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateOutletSchema))
  @Permission('outlets', [Action.UPDATE])
  update(
    @Param() { id }: OutletIdDto,
    @Body() data: UpdateOutletDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.outletsService.update(id, data, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an outlet' })
  @UsePipes(new ZodValidationPipe(OutletIdSchema, 'params'))
  @Permission('outlets', [Action.DELETE])
  remove(@Param() { id }: OutletIdDto, @CurrentUser() user: CurrentUserType) {
    return this.outletsService.remove(id, user);
  }
}
