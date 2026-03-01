import { randomUUID } from 'node:crypto';
import type { CurrentUserType } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { cashShifts } from '@/db/schema/cash-shift-schema';
import { orderItems } from '@/db/schema/order-item-schema';
import { orders } from '@/db/schema/order-schema';
import { outlets } from '@/db/schema/outlet-schema';
import { productStocks } from '@/db/schema/stock-schema';
import { tenants } from '@/db/schema/tenant-schema';
import type { DrizzleDB } from '@/db/type';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SQL, and, desc, eq, like, sql } from 'drizzle-orm';
import { CreateOrderDto, OrderQueryDto, UpdateOrderDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) {}

  async findAll(query: OrderQueryDto) {
    const { page = 1, limit = 10, search, status, tenantId, outletId, cashShiftId } = query;
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [];

    if (status) {
      conditions.push(eq(orders.status, status));
    }

    if (tenantId) {
      conditions.push(eq(orders.tenantId, tenantId));
    }

    if (outletId) {
      conditions.push(eq(orders.outletId, outletId));
    }

    if (cashShiftId) {
      conditions.push(eq(orders.cashShiftId, cashShiftId));
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
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(orders.createdAt)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
    ]);

    const ordersWithOutlet = data.map((row) => ({
      ...row.orders,
      outlet: row.outlets
        ? {
            id: row.outlets.id,
            nama: row.outlets.nama,
            alamat: row.outlets.alamat,
            isActive: row.outlets.isActive,
            createdAt: row.outlets.createdAt,
            updatedAt: row.outlets.updatedAt,
          }
        : null,
    }));

    const total = Number(totalResult[0]?.count || 0);

    return {
      data: ordersWithOutlet,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, user: CurrentUserType) {
    const order = await this.db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        outlet: true,
        orderItems: {
          with: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (user.role === 'owner' || user.role === 'cashier') {
      const userTenants = await this.db.query.tenants.findMany({
        where: eq(tenants.userId, user.id),
      });
      const userTenantIds = userTenants.map((t) => t.id);
      if (userTenantIds.length > 0 && !userTenantIds.includes(order.tenantId)) {
        throw new ForbiddenException('You do not have access to this order');
      }
    }

    return order;
  }

  async create(data: CreateOrderDto, user: CurrentUserType) {
    if (user.role === 'owner') {
      const userTenants = await this.db.query.tenants.findMany({
        where: eq(tenants.userId, user.id),
      });
      const userTenantIds = userTenants.map((t) => t.id);
      if (!userTenantIds.includes(data.tenantId)) {
        throw new ForbiddenException('You do not have permission to create orders in this tenant');
      }
    }

    if (user.role === 'cashier' && user.outletId) {
      const userOutlet = await this.db.query.outlets.findFirst({
        where: eq(outlets.id, user.outletId),
      });
      if (!userOutlet || userOutlet.tenantId !== data.tenantId) {
        throw new ForbiddenException('You do not have permission to create orders in this tenant');
      }
    }

    const tenant = await this.db.query.tenants.findFirst({
      where: eq(tenants.id, data.tenantId),
    });

    const outlet = await this.db.query.outlets.findFirst({
      where: eq(outlets.id, data.outletId),
    });

    if (!tenant || !outlet) {
      throw new NotFoundException('Tenant or Outlet not found');
    }

    const openShift = await this.db.query.cashShifts.findFirst({
      where: and(eq(cashShifts.outletId, data.outletId), eq(cashShifts.status, 'buka')),
    });

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

        const stocks = await tx
          .select()
          .from(productStocks)
          .where(and(eq(productStocks.outletId, data.outletId)));

        const stockMap = new Map(stocks.map((s) => [s.productId, s]));

        const insufficientStock = data.items.find((item) => {
          const existingStock = stockMap.get(item.productId);
          if (!existingStock) return true;
          return existingStock.quantity < item.quantity;
        });

        if (insufficientStock) {
          const product = stockMap.get(insufficientStock.productId);
          throw new ForbiddenException(
            `Insufficient stock for product ${product?.productId || insufficientStock.productId}. Available: ${product?.quantity || 0}, Requested: ${insufficientStock.quantity}`,
          );
        }

        await Promise.all(
          data.items.map(async (item) => {
            const existingStock = stockMap.get(item.productId);
            if (existingStock) {
              await tx
                .update(productStocks)
                .set({ quantity: existingStock.quantity - item.quantity })
                .where(eq(productStocks.id, existingStock.id));
            }
          }),
        );
      }

      return order;
    });
  }

  async update(id: string, data: UpdateOrderDto, user: CurrentUserType) {
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

  async remove(id: string, user: CurrentUserType) {
    await this.findById(id, user);

    const [order] = await this.db.delete(orders).where(eq(orders.id, id)).returning();

    return order;
  }
}
