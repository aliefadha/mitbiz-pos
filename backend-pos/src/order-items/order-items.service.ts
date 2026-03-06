import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { orderItems } from '@/db/schema/order-item-schema';
import { orders } from '@/db/schema/order-schema';
import { outlets } from '@/db/schema/outlet-schema';
import { products } from '@/db/schema/product-schema';
import type { DrizzleDB } from '@/db/type';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SQL, and, eq, sql } from 'drizzle-orm';
import { CreateOrderItemDto, OrderItemQueryDto, UpdateOrderItemDto } from './dto';

@Injectable()
export class OrderItemsService {
  constructor(
    @Inject(DB_CONNECTION) private db: DrizzleDB,
    private readonly tenantAuth: TenantAuthService,
  ) {}

  async findAll(query: OrderItemQueryDto, user: CurrentUserWithRole) {
    const { page = 1, limit = 10, orderId, productId, outletId } = query;
    const offset = (page - 1) * limit;

    // Get effective tenant ID for the user
    const effectiveTenantId = await this.tenantAuth.getEffectiveTenantId(user);

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

    // If user has a specific tenant, filter by outlet's tenant
    if (effectiveTenantId) {
      const outletIdsInTenant = await this.db
        .select({ id: outlets.id })
        .from(outlets)
        .where(eq(outlets.tenantId, effectiveTenantId));

      const outletIdList = outletIdsInTenant.map((o) => o.id);

      if (outletIdList.length > 0) {
        conditions.push(
          sql`${orderItems.outletId} IN (${sql.join(
            outletIdList.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        );
      }
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

  async findById(id: string, user: CurrentUserWithRole) {
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

    // Check tenant access via outlet's tenant (permission already checked by guard)
    const hasAccess = await this.tenantAuth.canAccessTenant(user, orderItem.outlet.tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this order item');
    }

    return orderItem;
  }

  async create(data: CreateOrderItemDto, user: CurrentUserWithRole) {
    const outlet = await this.db.query.outlets.findFirst({
      where: eq(outlets.id, data.outletId),
    });

    if (!outlet) {
      throw new NotFoundException(`Outlet with ID ${data.outletId} not found`);
    }

    // Validate tenant access via outlet (permission already checked by guard)
    await this.tenantAuth.validateTenantOperation(user, outlet.tenantId);

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

  async update(id: string, data: UpdateOrderItemDto, user: CurrentUserWithRole) {
    // findById already validates tenant access
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

  async remove(id: string, user: CurrentUserWithRole) {
    // findById already validates tenant access
    await this.findById(id, user);

    const [orderItem] = await this.db.delete(orderItems).where(eq(orderItems.id, id)).returning();

    return orderItem;
  }
}
