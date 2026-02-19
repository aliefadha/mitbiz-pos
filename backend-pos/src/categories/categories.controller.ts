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
import { PermissionGuard } from '../common/guards/permission.guard';
import {
  CurrentUser,
  type CurrentUserType,
} from '../common/decorators/current-user.decorator';

@ApiTags('categories')
@Controller('categories')
@UseGuards(AuthGuard, PermissionGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @UsePipes(new ZodValidationPipe(CategoryQuerySchema, 'query'))
  findAll(
    @Query() query: CategoryQueryDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.categoriesService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @UsePipes(new ZodValidationPipe(CategoryIdSchema, 'params'))
  findById(
    @Param() { id }: CategoryIdDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.categoriesService.findById(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @UsePipes(new ZodValidationPipe(CreateCategorySchema))
  create(
    @Body() data: CreateCategoryDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.categoriesService.create(data, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a category' })
  @UsePipes(new ZodValidationPipe(CategoryIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateCategorySchema))
  update(
    @Param() { id }: CategoryIdDto,
    @Body() data: UpdateCategoryDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.categoriesService.update(id, data, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  @UsePipes(new ZodValidationPipe(CategoryIdSchema, 'params'))
  remove(@Param() { id }: CategoryIdDto, @CurrentUser() user: CurrentUserType) {
    return this.categoriesService.remove(id, user);
  }
}
