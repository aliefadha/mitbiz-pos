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
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { OutletsService } from './outlets.service';
import {
  CreateOutletSchema,
  UpdateOutletSchema,
  OutletIdSchema,
  OutletQuerySchema,
  CreateOutletDto,
  UpdateOutletDto,
  OutletIdDto,
  OutletQueryDto,
} from './dto';
import { AuthGuard, Roles } from '@thallesp/nestjs-better-auth';
import {
  CurrentUser,
  type CurrentUserType,
} from '../common/decorators/current-user.decorator';

@ApiTags('outlets')
@Controller('outlets')
@UseGuards(AuthGuard)
export class OutletsController {
  constructor(private readonly outletsService: OutletsService) {}

  @Roles(['admin', 'owner', 'cashier'])
  @Get()
  @ApiOperation({ summary: 'Get all outlets' })
  @UsePipes(new ZodValidationPipe(OutletQuerySchema, 'query'))
  findAll(
    @Query() query: OutletQueryDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.outletsService.findAll(query, user);
  }

  @Roles(['admin', 'owner', 'cashier'])
  @Get(':id')
  @ApiOperation({ summary: 'Get outlet by ID' })
  @UsePipes(new ZodValidationPipe(OutletIdSchema, 'params'))
  findById(@Param() { id }: OutletIdDto, @CurrentUser() user: CurrentUserType) {
    return this.outletsService.findById(id, user);
  }

  @Roles(['admin', 'owner'])
  @Post()
  @ApiOperation({ summary: 'Create a new outlet' })
  @UsePipes(new ZodValidationPipe(CreateOutletSchema))
  create(@Body() data: CreateOutletDto, @CurrentUser() user: CurrentUserType) {
    return this.outletsService.create(data, user);
  }

  @Roles(['admin', 'owner'])
  @Put(':id')
  @ApiOperation({ summary: 'Update an outlet' })
  @UsePipes(new ZodValidationPipe(OutletIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateOutletSchema))
  update(
    @Param() { id }: OutletIdDto,
    @Body() data: UpdateOutletDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.outletsService.update(id, data, user);
  }

  @Roles(['admin', 'owner'])
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an outlet' })
  @UsePipes(new ZodValidationPipe(OutletIdSchema, 'params'))
  remove(@Param() { id }: OutletIdDto, @CurrentUser() user: CurrentUserType) {
    return this.outletsService.remove(id, user);
  }
}
