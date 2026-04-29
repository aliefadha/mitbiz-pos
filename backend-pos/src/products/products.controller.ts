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
  CreateProductDto,
  CreateProductSchema,
  ProductIdDto,
  ProductIdSchema,
  ProductQueryDto,
  ProductQuerySchema,
  UpdateProductDto,
  UpdateProductSchema,
} from './dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard, PermissionGuard, ScopeGuard)
@TenantScope()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @Permission([
    ['products', [Action.READ]],
    ['orders', [Action.CREATE]],
  ])
  @UsePipes(new ZodValidationPipe(ProductQuerySchema, 'query'))
  findAll(@Query() query: ProductQueryDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.productsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @Permission('products', [Action.READ])
  @Permission('orders', [Action.CREATE])
  @UsePipes(new ZodValidationPipe(ProductIdSchema, 'params'))
  findById(@Param() { id }: ProductIdDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.productsService.findById(id, user);
  }

  @Post()
  @HttpCode(204)
  @ApiOperation({ summary: 'Create a new product' })
  @Permission('products', [Action.CREATE])
  @UsePipes(new ZodValidationPipe(CreateProductSchema))
  async create(@Body() data: CreateProductDto, @CurrentUser() user: CurrentUserWithRole) {
    await this.productsService.create(data, user);
  }

  @Put(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Update a product' })
  @Permission('products', [Action.UPDATE])
  @UsePipes(new ZodValidationPipe(ProductIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateProductSchema))
  async update(
    @Param() { id }: ProductIdDto,
    @Body() data: UpdateProductDto,
    @CurrentUser() user: CurrentUserWithRole,
  ) {
    await this.productsService.update(id, data, user);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a product' })
  @Permission('products', [Action.DELETE])
  @UsePipes(new ZodValidationPipe(ProductIdSchema, 'params'))
  async remove(@Param() { id }: ProductIdDto, @CurrentUser() user: CurrentUserWithRole) {
    await this.productsService.remove(id, user);
  }
}
