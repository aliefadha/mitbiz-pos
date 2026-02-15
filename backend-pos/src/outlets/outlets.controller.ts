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
import { AuthGuard } from '@thallesp/nestjs-better-auth';

@ApiTags('outlets')
@Controller('outlets')
@UseGuards(AuthGuard)
export class OutletsController {
  constructor(private readonly outletsService: OutletsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all outlets' })
  @UsePipes(new ZodValidationPipe(OutletQuerySchema, 'query'))
  findAll(@Query() query: OutletQueryDto) {
    return this.outletsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get outlet by ID' })
  @UsePipes(new ZodValidationPipe(OutletIdSchema, 'params'))
  findById(@Param() { id }: OutletIdDto) {
    return this.outletsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new outlet' })
  @UsePipes(new ZodValidationPipe(CreateOutletSchema))
  create(@Body() data: CreateOutletDto) {
    return this.outletsService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an outlet' })
  @UsePipes(new ZodValidationPipe(OutletIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateOutletSchema))
  update(@Param() { id }: OutletIdDto, @Body() data: UpdateOutletDto) {
    return this.outletsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an outlet' })
  @UsePipes(new ZodValidationPipe(OutletIdSchema, 'params'))
  remove(@Param() { id }: OutletIdDto) {
    return this.outletsService.remove(id);
  }
}
