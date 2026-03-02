import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CashShiftsModule } from './cash-shifts/cash-shifts.module';
import { CategoriesModule } from './categories/categories.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { DashboardModule } from './dashboard/dashboard.module';
import { DbModule } from './db/db.module';
import { DiscountsModule } from './discounts/discounts.module';
import { auth } from './lib/auth';
import { OrderItemsModule } from './order-items/order-items.module';
import { OrdersModule } from './orders/orders.module';
import { OutletsModule } from './outlets/outlets.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { ProductsModule } from './products/products.module';
import { RbacModule } from './rbac/rbac.module';
import { RolesModule } from './roles/roles.module';
import { SalesModule } from './sales/sales.module';
import { StockAdjustmentsModule } from './stock-adjustments/stock-adjustments.module';
import { StocksModule } from './stocks/stocks.module';
import { TenantsModule } from './tenants/tenants.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    AuthModule.forRoot({ auth, disableGlobalAuthGuard: true }),
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    RbacModule,
    RolesModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute (POS-friendly)
      },
    ]),
    TenantsModule,
    OutletsModule,
    CategoriesModule,
    ProductsModule,
    StocksModule,
    StockAdjustmentsModule,
    UserModule,
    OrdersModule,
    OrderItemsModule,
    DiscountsModule,
    PaymentMethodsModule,
    CashShiftsModule,
    DashboardModule,
    SalesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseEnvelopeInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
