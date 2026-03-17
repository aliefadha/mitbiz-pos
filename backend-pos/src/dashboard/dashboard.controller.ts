import { CurrentUser, type CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { Action, Permission, PermissionGuard, ScopeGuard, TenantScope } from '@/rbac';
import { Controller, Get, Query, UseGuards, UsePipes } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { type DashboardQueryDto, DashboardQuerySchema } from './dto';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionGuard, ScopeGuard)
@TenantScope()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @UsePipes(new ZodValidationPipe(DashboardQuerySchema, 'query'))
  @Permission([
    ['dashboard', [Action.READ]],
    ['sales', [Action.READ]],
    ['reports', [Action.READ]],
    ['orders', [Action.READ]],
  ])
  getStats(@Query() query: DashboardQueryDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.dashboardService.getStats(query, user);
  }

  @Get('sales-trend')
  @ApiOperation({ summary: 'Get sales trend over time' })
  @UsePipes(new ZodValidationPipe(DashboardQuerySchema, 'query'))
  @Permission([
    ['dashboard', [Action.READ]],
    ['sales', [Action.READ]],
    ['reports', [Action.READ]],
    ['orders', [Action.READ]],
  ])
  getSalesTrend(@Query() query: DashboardQueryDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.dashboardService.getSalesTrend(query, user);
  }

  @Get('sales-by-branch')
  @ApiOperation({ summary: 'Get sales by branch/outlet' })
  @UsePipes(new ZodValidationPipe(DashboardQuerySchema, 'query'))
  @Permission([
    ['dashboard', [Action.READ]],
    ['sales', [Action.READ]],
    ['reports', [Action.READ]],
    ['orders', [Action.READ]],
  ])
  getSalesByBranch(@Query() query: DashboardQueryDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.dashboardService.getSalesByBranch(query, user);
  }

  @Get('sales-by-payment-method')
  @ApiOperation({ summary: 'Get sales by payment method' })
  @UsePipes(new ZodValidationPipe(DashboardQuerySchema, 'query'))
  @Permission([
    ['dashboard', [Action.READ]],
    ['sales', [Action.READ]],
    ['reports', [Action.READ]],
    ['orders', [Action.READ]],
  ])
  getSalesByPaymentMethod(
    @Query() query: DashboardQueryDto,
    @CurrentUser() user: CurrentUserWithRole,
  ) {
    return this.dashboardService.getSalesByPaymentMethod(query, user);
  }
}
