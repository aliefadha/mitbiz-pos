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
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { ProductsService } from './products.service';
import {
  CreateProductSchema,
  UpdateProductSchema,
  ProductIdSchema,
  ProductQuerySchema,
  CreateProductDto,
  UpdateProductDto,
  ProductIdDto,
  ProductQueryDto,
} from './dto';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { CurrentUser, type CurrentUserType } from '@/common/decorators/current-user.decorator';

@ApiTags('products')
@Controller('products')
@UseGuards(AuthGuard, PermissionGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @UsePipes(new ZodValidationPipe(ProductQuerySchema, 'query'))
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @UsePipes(new ZodValidationPipe(ProductIdSchema, 'params'))
  findById(@Param() { id }: ProductIdDto, @CurrentUser() user: CurrentUserType) {
    return this.productsService.findById(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @UsePipes(new ZodValidationPipe(CreateProductSchema))
  create(@Body() data: CreateProductDto, @CurrentUser() user: CurrentUserType) {
    return this.productsService.create(data, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a product' })
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
  @UsePipes(new ZodValidationPipe(ProductIdSchema, 'params'))
  remove(@Param() { id }: ProductIdDto, @CurrentUser() user: CurrentUserType) {
    return this.productsService.remove(id, user);
  }
}
