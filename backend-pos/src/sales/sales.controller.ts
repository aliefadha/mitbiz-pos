import { Controller, Get, Query, UseGuards, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { SalesService } from './sales.service';
import { SalesQuerySchema, type SalesQueryDto } from './dto';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { CurrentUser, type CurrentUserType } from '@/common/decorators/current-user.decorator';

@ApiTags('sales')
@Controller('sales')
@UseGuards(AuthGuard, PermissionGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('top-products')
  @ApiOperation({ summary: 'Get top selling products' })
  @UsePipes(new ZodValidationPipe(SalesQuerySchema, 'query'))
  getTopProducts(@Query() query: SalesQueryDto, @CurrentUser() user: CurrentUserType) {
    return this.salesService.getTopProducts(query, user, query.limit ?? 10);
  }

  @Get('by-category')
  @ApiOperation({ summary: 'Get sales by category' })
  @UsePipes(new ZodValidationPipe(SalesQuerySchema, 'query'))
  getSalesByCategory(@Query() query: SalesQueryDto, @CurrentUser() user: CurrentUserType) {
    return this.salesService.getSalesByCategory(query, user);
  }

  @Get('by-product')
  @ApiOperation({ summary: 'Get sales by product' })
  @UsePipes(new ZodValidationPipe(SalesQuerySchema, 'query'))
  getSalesByProduct(@Query() query: SalesQueryDto, @CurrentUser() user: CurrentUserType) {
    return this.salesService.getSalesByProduct(query, user);
  }
}
