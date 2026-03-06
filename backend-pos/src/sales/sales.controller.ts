import { CurrentUser, type CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { Action, Permission, PermissionGuard, ScopeGuard, TenantScope } from '@/rbac';
import { Controller, Get, Query, UseGuards, UsePipes } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type SalesQueryDto, SalesQuerySchema } from './dto';
import { SalesService } from './sales.service';

@ApiTags('sales')
@Controller('sales')
@UseGuards(JwtAuthGuard, PermissionGuard, ScopeGuard)
@TenantScope()
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('top-products')
  @ApiOperation({ summary: 'Get top selling products' })
  @UsePipes(new ZodValidationPipe(SalesQuerySchema, 'query'))
  @Permission('sales', [Action.READ])
  getTopProducts(@Query() query: SalesQueryDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.salesService.getTopProducts(query, user, query.limit ?? 10);
  }

  @Get('by-category')
  @ApiOperation({ summary: 'Get sales by category' })
  @UsePipes(new ZodValidationPipe(SalesQuerySchema, 'query'))
  @Permission('sales', [Action.READ])
  getSalesByCategory(@Query() query: SalesQueryDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.salesService.getSalesByCategory(query, user);
  }

  @Get('by-product')
  @ApiOperation({ summary: 'Get sales by product' })
  @UsePipes(new ZodValidationPipe(SalesQuerySchema, 'query'))
  @Permission('sales', [Action.READ])
  getSalesByProduct(@Query() query: SalesQueryDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.salesService.getSalesByProduct(query, user);
  }
}
