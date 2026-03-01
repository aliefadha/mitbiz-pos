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
  @Permission('products', [Action.READ])
  @UsePipes(new ZodValidationPipe(ProductQuerySchema, 'query'))
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @Permission('products', [Action.READ])
  @UsePipes(new ZodValidationPipe(ProductIdSchema, 'params'))
  findById(@Param() { id }: ProductIdDto, @CurrentUser() user: CurrentUserType) {
    return this.productsService.findById(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @Permission('products', [Action.CREATE])
  @UsePipes(new ZodValidationPipe(CreateProductSchema))
  create(@Body() data: CreateProductDto, @CurrentUser() user: CurrentUserType) {
    return this.productsService.create(data, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a product' })
  @Permission('products', [Action.UPDATE])
  @UsePipes(new ZodValidationPipe(ProductIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateProductSchema))
  update(
    @Param() { id }: ProductIdDto,
    @Body() data: UpdateProductDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.productsService.update(id, data, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @Permission('products', [Action.DELETE])
  @UsePipes(new ZodValidationPipe(ProductIdSchema, 'params'))
  remove(@Param() { id }: ProductIdDto, @CurrentUser() user: CurrentUserType) {
    return this.productsService.remove(id, user);
  }
}
