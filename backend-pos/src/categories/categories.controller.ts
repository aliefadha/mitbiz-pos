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
import { CategoriesService } from './categories.service';
import {
  CategoryIdDto,
  CategoryIdSchema,
  CategoryQueryDto,
  CategoryQuerySchema,
  CreateCategoryDto,
  CreateCategorySchema,
  UpdateCategoryDto,
  UpdateCategorySchema,
} from './dto';

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard, PermissionGuard, ScopeGuard)
@TenantScope()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @UsePipes(new ZodValidationPipe(CategoryQuerySchema, 'query'))
  @Permission('categories', [Action.READ])
  findAll(@Query() query: CategoryQueryDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.categoriesService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @UsePipes(new ZodValidationPipe(CategoryIdSchema, 'params'))
  @Permission('categories', [Action.READ])
  findById(@Param() { id }: CategoryIdDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.categoriesService.findById(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @UsePipes(new ZodValidationPipe(CreateCategorySchema))
  @Permission('categories', [Action.CREATE])
  create(@Body() data: CreateCategoryDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.categoriesService.create(data, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a category' })
  @UsePipes(new ZodValidationPipe(CategoryIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateCategorySchema))
  @Permission('categories', [Action.UPDATE])
  update(
    @Param() { id }: CategoryIdDto,
    @Body() data: UpdateCategoryDto,
    @CurrentUser() user: CurrentUserWithRole,
  ) {
    return this.categoriesService.update(id, data, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  @UsePipes(new ZodValidationPipe(CategoryIdSchema, 'params'))
  @Permission('categories', [Action.DELETE])
  remove(@Param() { id }: CategoryIdDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.categoriesService.remove(id, user);
  }
}
