import { Controller, Get, Query, UseGuards, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { DashboardService } from './dashboard.service';
import { DashboardQuerySchema, type DashboardQueryDto } from './dto';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { CurrentUser, type CurrentUserType } from '@/common/decorators/current-user.decorator';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(AuthGuard, PermissionGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @UsePipes(new ZodValidationPipe(DashboardQuerySchema, 'query'))
  getStats(@Query() query: DashboardQueryDto, @CurrentUser() user: CurrentUserType) {
    return this.dashboardService.getStats(query, user);
  }

  @Get('sales-trend')
  @ApiOperation({ summary: 'Get sales trend over time' })
  @UsePipes(new ZodValidationPipe(DashboardQuerySchema, 'query'))
  getSalesTrend(@Query() query: DashboardQueryDto, @CurrentUser() user: CurrentUserType) {
    return this.dashboardService.getSalesTrend(query, user);
  }

  @Get('sales-by-branch')
  @ApiOperation({ summary: 'Get sales by branch/outlet' })
  @UsePipes(new ZodValidationPipe(DashboardQuerySchema, 'query'))
  getSalesByBranch(@Query() query: DashboardQueryDto, @CurrentUser() user: CurrentUserType) {
    return this.dashboardService.getSalesByBranch(query, user);
  }

  @Get('sales-by-payment-method')
  @ApiOperation({ summary: 'Get sales by payment method' })
  @UsePipes(new ZodValidationPipe(DashboardQuerySchema, 'query'))
  getSalesByPaymentMethod(@Query() query: DashboardQueryDto, @CurrentUser() user: CurrentUserType) {
    return this.dashboardService.getSalesByPaymentMethod(query, user);
  }
}
