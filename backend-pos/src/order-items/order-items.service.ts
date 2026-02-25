import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { eq, and, sql, SQL } from 'drizzle-orm';
import { orderItems } from '../db/schema/order-item-schema';
import { tenants } from '../db/schema/tenant-schema';
import { outlets } from '../db/schema/outlet-schema';
import { orders } from '../db/schema/order-schema';
import { products } from '../db/schema/product-schema';
import {
  CreateOrderItemDto,
  UpdateOrderItemDto,
  OrderItemQueryDto,
} from './dto';
import { DB_CONNECTION } from '../db/db.module';
import type { DrizzleDB } from '../db/type';
import type { CurrentUserType } from '../common/decorators/current-user.decorator';

@Injectable()
export class OrderItemsService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) {}

  async findAll(query: OrderItemQueryDto) {
    const { page = 1, limit = 10, orderId, productId, outletId } = query;
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [];

    if (orderId) {
      conditions.push(eq(orderItems.orderId, orderId));
    }

    if (productId) {
      conditions.push(eq(orderItems.productId, productId));
    }

    if (outletId) {
      conditions.push(eq(orderItems.outletId, outletId));
    }

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(orderItems)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
    ]);

    const orderItemsWithProduct = data.map((row) => ({
      ...row.order_items,
      product: row.products
        ? {
            id: row.products.id,
            nama: row.products.nama,
            sku: row.products.sku,
            hargaJual: row.products.hargaJual,
          }
        : null,
    }));

    const total = Number(totalResult[0]?.count || 0);

    return {
      data: orderItemsWithProduct,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, user: CurrentUserType) {
    const orderItem = await this.db.query.orderItems.findFirst({
      where: eq(orderItems.id, id),
      with: {
        outlet: true,
        order: true,
        product: true,
      },
    });

    if (!orderItem) {
      throw new NotFoundException(`Order item with ID ${id} not found`);
    }

    if (user.role === 'owner' || user.role === 'cashier') {
      const userTenants = await this.db.query.tenants.findMany({
        where: eq(tenants.userId, user.id),
      });
      const userTenantIds = userTenants.map((t) => t.id);
      if (
        userTenantIds.length > 0 &&
        !userTenantIds.includes(orderItem.outlet.tenantId)
      ) {
        throw new ForbiddenException('You do not have access to this order item');
      }
    }

    return orderItem;
  }

  async create(data: CreateOrderItemDto, user: CurrentUserType) {
    const outlet = await this.db.query.outlets.findFirst({
      where: eq(outlets.id, data.outletId),
    });

    if (!outlet) {
      throw new NotFoundException(`Outlet with ID ${data.outletId} not found`);
    }

    if (user.role === 'owner') {
      const tenant = await this.db.query.tenants.findFirst({
        where: eq(tenants.id, outlet.tenantId),
      });
      if (!tenant || tenant.userId !== user.id) {
        throw new ForbiddenException(
          'You do not have permission to create order items in this outlet',
        );
      }
    }

    const order = await this.db.query.orders.findFirst({
      where: eq(orders.id, data.orderId),
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${data.orderId} not found`);
    }

    if (order.outletId !== data.outletId) {
      throw new ForbiddenException('Order does not belong to this outlet');
    }

    const product = await this.db.query.products.findFirst({
      where: eq(products.id, data.productId),
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${data.productId} not found`);
    }

    if (product.tenantId !== outlet.tenantId) {
      throw new ForbiddenException('Product does not belong to this tenant');
    }

    const [orderItem] = await this.db
      .insert(orderItems)
      .values({
        outletId: data.outletId,
        orderId: data.orderId,
        productId: data.productId,
        quantity: data.quantity,
        hargaSatuan: data.hargaSatuan,
        jumlahDiskon: data.jumlahDiskon,
        total: data.total,
      })
      .returning();

    return orderItem;
  }

  async update(id: string, data: UpdateOrderItemDto, user: CurrentUserType) {
    const existingOrderItem = await this.findById(id, user);

    if (data.productId && data.productId !== existingOrderItem.productId) {
      const product = await this.db.query.products.findFirst({
        where: eq(products.id, data.productId),
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${data.productId} not found`);
      }

      if (product.tenantId !== existingOrderItem.outlet.tenantId) {
        throw new ForbiddenException('Product does not belong to this tenant');
      }
    }

    const [orderItem] = await this.db
      .update(orderItems)
      .set(data)
      .where(eq(orderItems.id, id))
      .returning();

    return orderItem;
  }

  async remove(id: string, user: CurrentUserType) {
    await this.findById(id, user);

    const [orderItem] = await this.db
      .delete(orderItems)
      .where(eq(orderItems.id, id))
      .returning();

    return orderItem;
  }
}
