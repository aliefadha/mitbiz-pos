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

@ApiTags('products')
@Controller('products')
@UseGuards(AuthGuard)
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
  findById(@Param() { id }: ProductIdDto) {
    return this.productsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @UsePipes(new ZodValidationPipe(CreateProductSchema))
  create(@Body() data: CreateProductDto) {
    return this.productsService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a product' })
  @UsePipes(new ZodValidationPipe(ProductIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateProductSchema))
  update(@Param() { id }: ProductIdDto, @Body() data: UpdateProductDto) {
    return this.productsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @UsePipes(new ZodValidationPipe(ProductIdSchema, 'params'))
  remove(@Param() { id }: ProductIdDto) {
    return this.productsService.remove(id);
  }
}
