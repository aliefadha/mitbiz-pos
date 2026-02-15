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
import { CategoriesService } from './categories.service';
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  CategoryIdSchema,
  CategoryQuerySchema,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryIdDto,
  CategoryQueryDto,
} from './dto';
import { AuthGuard } from '@thallesp/nestjs-better-auth';

@ApiTags('categories')
@Controller('categories')
@UseGuards(AuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @UsePipes(new ZodValidationPipe(CategoryQuerySchema, 'query'))
  findAll(@Query() query: CategoryQueryDto) {
    return this.categoriesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @UsePipes(new ZodValidationPipe(CategoryIdSchema, 'params'))
  findById(@Param() { id }: CategoryIdDto) {
    return this.categoriesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @UsePipes(new ZodValidationPipe(CreateCategorySchema))
  create(@Body() data: CreateCategoryDto) {
    return this.categoriesService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a category' })
  @UsePipes(new ZodValidationPipe(CategoryIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateCategorySchema))
  update(@Param() { id }: CategoryIdDto, @Body() data: UpdateCategoryDto) {
    return this.categoriesService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  @UsePipes(new ZodValidationPipe(CategoryIdSchema, 'params'))
  remove(@Param() { id }: CategoryIdDto) {
    return this.categoriesService.remove(id);
  }
}
