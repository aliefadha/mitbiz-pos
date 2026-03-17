import { randomUUID } from 'node:crypto';
import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { user as userTable } from '@/db/schema/auth-schema';
import { cashShifts } from '@/db/schema/cash-shift-schema';
import { orderItems } from '@/db/schema/order-item-schema';
import { orders } from '@/db/schema/order-schema';
import { outlets } from '@/db/schema/outlet-schema';
import { paymentMethods } from '@/db/schema/payment-method-schema';
import { products } from '@/db/schema/product-schema';
import { productStocks } from '@/db/schema/stock-schema';
import { tenants } from '@/db/schema/tenant-schema';
import type { DrizzleDB } from '@/db/type';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SQL, and, desc, eq, inArray, like, sql } from 'drizzle-orm';
import { CreateOrderDto, OrderQueryDto, UpdateOrderDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(DB_CONNECTION) private db: DrizzleDB,
    private readonly tenantAuth: TenantAuthService,
  ) {}

  async findAll(query: OrderQueryDto, user: CurrentUserWithRole) {
    const { page = 1, limit = 10, search, status, tenantId, outletId, cashShiftId } = query;
    const offset = (page - 1) * limit;

    // Validate that query tenantId matches user's allowed tenant
    if (tenantId) {
      await this.tenantAuth.validateQueryTenantId(user, tenantId);
    }

    // Get effective tenant ID for the user (for filtering if no tenantId provided)
    const effectiveTenantId = await this.tenantAuth.getEffectiveTenantId(user);

    const conditions: SQL<unknown>[] = [];

    if (status) {
      conditions.push(eq(orders.status, status));
    }

    // Use query tenantId if provided, otherwise use effective tenant (for non-global roles)
    const filterTenantId = tenantId || effectiveTenantId;
    if (filterTenantId) {
      conditions.push(eq(orders.tenantId, filterTenantId));
    }

    if (outletId) {
      conditions.push(eq(orders.outletId, outletId));
    }

    if (cashShiftId) {
      conditions.push(eq(orders.cashShiftId, cashShiftId));
    }

    // If user has outletId assigned, automatically filter to show only their orders
    if (user.outletId) {
      conditions.push(eq(orders.cashierId, user.id));
    }

    if (search) {
      conditions.push(
        like(orders.orderNumber, `%${search}%`),
        like(orders.nomorAntrian, `%${search}%`),
      );
    }

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(orders)
        .leftJoin(outlets, eq(orders.outletId, outlets.id))
        .leftJoin(userTable, eq(orders.cashierId, userTable.id))
        .leftJoin(paymentMethods, eq(orders.paymentMethodId, paymentMethods.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(orders.createdAt)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
    ]);

    const ordersWithRelations = data.map((row) => ({
      ...row.orders,
      outlet: row.outlets
        ? {
            id: row.outlets.id,
            nama: row.outlets.nama,
          }
        : null,
      cashier: row.user
        ? {
            id: row.user.id,
            name: row.user.name,
            email: row.user.email,
          }
        : null,
      paymentMethod: row.payment_methods
        ? {
            id: row.payment_methods.id,
            nama: row.payment_methods.nama,
          }
        : null,
    }));

    const total = Number(totalResult[0]?.count || 0);

    return {
      data: ordersWithRelations,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, user: CurrentUserWithRole) {
    const order = await this.db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        outlet: {
          columns: {
            id: true,
            nama: true,
          },
        },
        cashier: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        paymentMethod: {
          columns: {
            id: true,
            nama: true,
          },
        },
        orderItems: {
          with: {
            product: {
              columns: {
                id: true,
                sku: true,
                nama: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Check tenant access (permission already checked by guard)
    const hasAccess = await this.tenantAuth.canAccessTenant(user, order.tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return order;
  }

  async create(data: CreateOrderDto, user: CurrentUserWithRole) {
    // Validate tenant access for creating order
    await this.tenantAuth.validateTenantOperation(user, data.tenantId);

    // Parallelize initial queries
    const [outlet, tenant, openShift] = await Promise.all([
      this.db.query.outlets.findFirst({
        where: eq(outlets.id, data.outletId),
      }),
      this.db.query.tenants.findFirst({
        where: eq(tenants.id, data.tenantId),
      }),
      this.db.query.cashShifts.findFirst({
        where: and(
          eq(cashShifts.outletId, data.outletId),
          eq(cashShifts.cashierId, user.id),
          eq(cashShifts.status, 'buka'),
        ),
      }),
    ]);

    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (outlet.tenantId !== data.tenantId) {
      throw new ForbiddenException('Outlet does not belong to the specified tenant');
    }

    if (!openShift) {
      throw new ForbiddenException(
        'Tidak ada shift kasir yang terbuka. Silakan buka shift terlebih dahulu.',
      );
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;
    const uuid = randomUUID().split('-')[0].toUpperCase();
    const orderNumber = `ORD-${tenant.slug}-${outlet.kode}-${dateStr}-${uuid}`;

    return await this.db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          ...data,
          orderNumber,
          cashierId: user.id,
          cashShiftId: openShift.id,
          completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
        })
        .returning();

      if (data.items && data.items.length > 0) {
        const productIds = data.items.map((item) => item.productId);

        const productData = await tx
          .select({
            id: products.id,
            enableStockTracking: products.enableStockTracking,
          })
          .from(products)
          .where(inArray(products.id, productIds));

        const productMap = new Map(productData.map((p) => [p.id, p]));

        const trackedItemsFiltered = data.items.filter(
          (item) => productMap.get(item.productId)?.enableStockTracking === true,
        );

        if (trackedItemsFiltered.length > 0) {
          const stockMap = new Map(
            (
              await tx
                .select()
                .from(productStocks)
                .where(
                  and(
                    eq(productStocks.outletId, data.outletId),
                    inArray(
                      productStocks.productId,
                      trackedItemsFiltered.map((i) => i.productId),
                    ),
                  ),
                )
            ).map((s) => [s.productId, s]),
          );

          const insufficientStock = trackedItemsFiltered.find((item) => {
            const existingStock = stockMap.get(item.productId);
            if (!existingStock) return true;
            return existingStock.quantity < item.quantity;
          });

          if (insufficientStock) {
            throw new ForbiddenException(
              `Insufficient stock for product ${insufficientStock.productId}.`,
            );
          }

          await Promise.all(
            trackedItemsFiltered.map((item) => {
              const existingStock = stockMap.get(item.productId);
              if (existingStock) {
                return tx
                  .update(productStocks)
                  .set({ quantity: existingStock.quantity - item.quantity })
                  .where(eq(productStocks.id, existingStock.id));
              }
            }),
          );
        }

        const orderItemsData = data.items.map((item) => ({
          outletId: data.outletId,
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          hargaSatuan: item.hargaSatuan,
          jumlahDiskon: item.jumlahDiskon || '0',
          total: item.total,
        }));

        await tx.insert(orderItems).values(orderItemsData);
      }

      return order;
    });
  }

  async update(id: string, data: UpdateOrderDto, user: CurrentUserWithRole) {
    // findById already validates tenant access
    const existingOrder = await this.findById(id, user);

    if (data.outletId && data.outletId !== existingOrder.outletId) {
      const outlet = await this.db.query.outlets.findFirst({
        where: eq(outlets.id, data.outletId),
      });

      if (!outlet) {
        throw new NotFoundException(`Outlet with ID ${data.outletId} not found`);
      }

      if (outlet.tenantId !== existingOrder.tenantId) {
        throw new ForbiddenException('Outlet does not belong to this tenant');
      }
    }

    const [order] = await this.db
      .update(orders)
      .set({
        ...data,
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    return order;
  }

  async remove(id: string, user: CurrentUserWithRole) {
    // findById already validates tenant access
    await this.findById(id, user);

    const [order] = await this.db.delete(orders).where(eq(orders.id, id)).returning();

    return order;
  }
}
