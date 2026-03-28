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
import { z } from 'zod';
import {
  AddItemToOpenBillDto,
  CloseOpenBillDto,
  CreateOpenBillDto,
  CreateOpenBillItemSchema,
  OpenBillQueryDto,
  UpdateOpenBillDto,
} from './dto';

@Injectable()
export class OpenBillsService {
  constructor(
    @Inject(DB_CONNECTION) private db: DrizzleDB,
    private readonly tenantAuth: TenantAuthService,
  ) {}

  async findAll(query: OpenBillQueryDto, user: CurrentUserWithRole) {
    const { page = 1, limit = 10, search, tenantId, outletId } = query;
    const offset = (page - 1) * limit;

    if (tenantId) {
      await this.tenantAuth.validateQueryTenantId(user, tenantId);
    }

    const effectiveTenantId = await this.tenantAuth.getEffectiveTenantId(user);

    const conditions: SQL<unknown>[] = [eq(orders.status, 'open')];

    if (tenantId) {
      conditions.push(eq(orders.tenantId, tenantId));
    } else if (effectiveTenantId) {
      conditions.push(eq(orders.tenantId, effectiveTenantId));
    }

    if (outletId) {
      conditions.push(eq(orders.outletId, outletId));
    }

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
        .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(orders.createdAt)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
    ]);

    const ordersMap = new Map<string, any>();

    for (const row of data) {
      const orderId = row.orders.id;
      if (!ordersMap.has(orderId)) {
        ordersMap.set(orderId, {
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
          orderItems: [],
        });
      }

      if (row.order_items && row.products) {
        ordersMap.get(orderId).orderItems.push({
          id: row.order_items.id,
          orderId: row.order_items.orderId,
          productId: row.order_items.productId,
          quantity: row.order_items.quantity,
          hargaSatuan: row.order_items.hargaSatuan,
          jumlahDiskon: row.order_items.jumlahDiskon,
          total: row.order_items.total,
          product: {
            id: row.products.id,
            sku: row.products.sku,
            nama: row.products.nama,
          },
        });
      }
    }

    const ordersWithRelations = Array.from(ordersMap.values());

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
      where: and(eq(orders.id, id), eq(orders.status, 'open')),
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
      throw new NotFoundException(`Open bill with ID ${id} not found`);
    }

    const hasAccess = await this.tenantAuth.canAccessTenant(user, order.tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this open bill');
    }

    return order;
  }

  async create(data: CreateOpenBillDto, user: CurrentUserWithRole) {
    await this.tenantAuth.validateTenantOperation(user, data.tenantId);

    const [outlet, tenant] = await Promise.all([
      this.db.query.outlets.findFirst({
        where: eq(outlets.id, data.outletId),
      }),
      this.db.query.tenants.findFirst({
        where: eq(tenants.id, data.tenantId),
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

    const openBillUuid = randomUUID().split('-')[0].toUpperCase();
    const tempOrderNumber = `OPEN-${openBillUuid}`;

    return await this.db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          tenantId: data.tenantId,
          outletId: data.outletId,
          cashierId: user.id,
          status: 'open',
          orderNumber: tempOrderNumber,
          notes: data.notes,
          nomorAntrian: data.nomorAntrian,
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
          const stocks =
            trackedItemsFiltered.length > 0
              ? await tx
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
              : [];
          const stockMap = new Map(stocks.map((s) => [s.productId, s]));

          for (const item of trackedItemsFiltered) {
            const stock = stockMap.get(item.productId);
            if (!stock) {
              throw new ForbiddenException(`No stock record found for product ${item.productId}`);
            }
            const availableQuantity = stock.quantity - stock.reservedQuantity;
            if (availableQuantity < item.quantity) {
              throw new ForbiddenException(
                `Insufficient stock for product ${item.productId}. Available: ${availableQuantity}`,
              );
            }
          }

          const stockUpdates: { id: string; quantity: number }[] = [];
          for (const item of trackedItemsFiltered) {
            const stock = stockMap.get(item.productId);
            if (stock) {
              stockUpdates.push({ id: stock.id, quantity: item.quantity });
            }
          }

          if (stockUpdates.length > 0) {
            for (const item of stockUpdates) {
              await tx
                .update(productStocks)
                .set({
                  reservedQuantity: sql`${productStocks.reservedQuantity} + ${item.quantity}`,
                })
                .where(eq(productStocks.id, item.id));
            }
          }
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

  async addItem(openBillId: string, item: AddItemToOpenBillDto, user: CurrentUserWithRole) {
    const openBill = await this.findById(openBillId, user);

    const product = await this.db.query.products.findFirst({
      where: eq(products.id, item.productId),
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.enableStockTracking) {
      const stock = await this.db.query.productStocks.findFirst({
        where: and(
          eq(productStocks.outletId, openBill.outletId),
          eq(productStocks.productId, item.productId),
        ),
      });

      if (!stock) {
        throw new ForbiddenException(`No stock record found for product ${product.nama}`);
      }

      const availableQuantity = stock.quantity - stock.reservedQuantity;
      if (availableQuantity < item.quantity) {
        throw new ForbiddenException(
          `Insufficient stock for product ${product.nama}. Available: ${availableQuantity}`,
        );
      }

      await this.db
        .update(productStocks)
        .set({ reservedQuantity: stock.reservedQuantity + item.quantity })
        .where(eq(productStocks.id, stock.id));
    }

    const [orderItem] = await this.db
      .insert(orderItems)
      .values({
        outletId: openBill.outletId,
        orderId: openBill.id,
        productId: item.productId,
        quantity: item.quantity,
        hargaSatuan: item.hargaSatuan,
        jumlahDiskon: item.jumlahDiskon || '0',
        total: item.total,
      })
      .returning();

    return orderItem;
  }

  async removeItem(openBillId: string, itemId: string, user: CurrentUserWithRole) {
    const openBill = await this.findById(openBillId, user);

    const item = await this.db.query.orderItems.findFirst({
      where: and(eq(orderItems.id, itemId), eq(orderItems.orderId, openBillId)),
      with: {
        product: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Order item not found');
    }

    if (item.product?.enableStockTracking) {
      const stock = await this.db.query.productStocks.findFirst({
        where: and(
          eq(productStocks.outletId, openBill.outletId),
          eq(productStocks.productId, item.productId),
        ),
      });

      if (stock) {
        await this.db
          .update(productStocks)
          .set({ reservedQuantity: stock.reservedQuantity - item.quantity })
          .where(eq(productStocks.id, stock.id));
      }
    }

    await this.db.delete(orderItems).where(eq(orderItems.id, itemId));

    return { success: true };
  }

  async update(openBillId: string, data: UpdateOpenBillDto, user: CurrentUserWithRole) {
    await this.findById(openBillId, user);

    const [order] = await this.db
      .update(orders)
      .set({
        notes: data.notes,
        nomorAntrian: data.nomorAntrian,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, openBillId))
      .returning();

    return order;
  }

  async replaceItems(
    openBillId: string,
    items: z.infer<typeof CreateOpenBillItemSchema>[],
    user: CurrentUserWithRole,
  ) {
    const openBill = await this.findById(openBillId, user);

    const existingItems = await this.db.query.orderItems.findMany({
      where: eq(orderItems.orderId, openBillId),
    });

    await this.db.transaction(async (tx) => {
      for (const item of existingItems) {
        if (item.productId) {
          const product = await tx.query.products.findFirst({
            where: eq(products.id, item.productId),
          });

          if (product?.enableStockTracking) {
            const stock = await tx.query.productStocks.findFirst({
              where: and(
                eq(productStocks.outletId, openBill.outletId),
                eq(productStocks.productId, item.productId),
              ),
            });

            if (stock) {
              await tx
                .update(productStocks)
                .set({ reservedQuantity: stock.reservedQuantity - item.quantity })
                .where(eq(productStocks.id, stock.id));
            }
          }
        }
      }

      await tx.delete(orderItems).where(eq(orderItems.orderId, openBillId));

      if (items.length > 0) {
        const productIds = items.map((item) => item.productId);
        const productData = await tx
          .select({
            id: products.id,
            enableStockTracking: products.enableStockTracking,
          })
          .from(products)
          .where(inArray(products.id, productIds));
        const productMap = new Map(productData.map((p) => [p.id, p]));

        const trackedItemsFiltered = items.filter(
          (item) => productMap.get(item.productId)?.enableStockTracking === true,
        );

        if (trackedItemsFiltered.length > 0) {
          const stocks =
            trackedItemsFiltered.length > 0
              ? await tx
                  .select()
                  .from(productStocks)
                  .where(
                    and(
                      eq(productStocks.outletId, openBill.outletId),
                      inArray(
                        productStocks.productId,
                        trackedItemsFiltered.map((i) => i.productId),
                      ),
                    ),
                  )
              : [];
          const stockMap = new Map(stocks.map((s) => [s.productId, s]));

          for (const item of trackedItemsFiltered) {
            const stock = stockMap.get(item.productId);
            if (!stock) {
              throw new ForbiddenException(`No stock record found for product ${item.productId}`);
            }
            const availableQuantity = stock.quantity - stock.reservedQuantity;
            if (availableQuantity < item.quantity) {
              throw new ForbiddenException(
                `Insufficient stock for product ${item.productId}. Available: ${availableQuantity}`,
              );
            }
          }

          for (const item of trackedItemsFiltered) {
            const stock = stockMap.get(item.productId);
            if (stock) {
              await tx
                .update(productStocks)
                .set({ reservedQuantity: stock.reservedQuantity + item.quantity })
                .where(eq(productStocks.id, stock.id));
            }
          }
        }

        const orderItemsData = items.map((item) => ({
          outletId: openBill.outletId,
          orderId: openBill.id,
          productId: item.productId,
          quantity: item.quantity,
          hargaSatuan: item.hargaSatuan,
          jumlahDiskon: item.jumlahDiskon || '0',
          total: item.total,
        }));

        await tx.insert(orderItems).values(orderItemsData);
      }
    });

    return this.findById(openBillId, user);
  }

  async close(openBillId: string, data: CloseOpenBillDto, user: CurrentUserWithRole) {
    const openBill = await this.findById(openBillId, user);

    const [outlet, tenant, openShift] = await Promise.all([
      this.db.query.outlets.findFirst({
        where: eq(outlets.id, openBill.outletId),
      }),
      this.db.query.tenants.findFirst({
        where: eq(tenants.id, openBill.tenantId),
      }),
      this.db.query.cashShifts.findFirst({
        where: and(
          eq(cashShifts.outletId, openBill.outletId),
          eq(cashShifts.cashierId, user.id),
          eq(cashShifts.status, 'buka'),
        ),
      }),
    ]);

    if (!openShift) {
      throw new ForbiddenException(
        'Tidak ada shift kasir yang terbuka. Silakan buka shift terlebih dahulu.',
      );
    }

    if (outlet?.tenantId !== openBill.tenantId) {
      throw new ForbiddenException('Outlet does not belong to the specified tenant');
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;
    const uuid = randomUUID().split('-')[0].toUpperCase();
    const orderNumber = `ORD-${tenant?.slug}-${outlet?.kode}-${dateStr}-${uuid}`;

    const openBillItems = await this.db.query.orderItems.findMany({
      where: eq(orderItems.orderId, openBillId),
    });

    await this.db.transaction(async (tx) => {
      const productIds = openBillItems.map((item) => item.productId).filter(Boolean);
      const stocks =
        productIds.length > 0
          ? await tx
              .select()
              .from(productStocks)
              .where(
                and(
                  eq(productStocks.outletId, openBill.outletId),
                  inArray(productStocks.productId, productIds),
                ),
              )
          : [];
      const stockMap = new Map(stocks.map((s) => [s.productId, s]));

      const stockUpdates: { id: string; quantity: number }[] = [];
      for (const item of openBillItems) {
        if (item.productId) {
          const stock = stockMap.get(item.productId);
          if (stock) {
            stockUpdates.push({ id: stock.id, quantity: item.quantity });
          }
        }
      }

      if (stockUpdates.length > 0) {
        for (const item of stockUpdates) {
          await tx
            .update(productStocks)
            .set({
              quantity: sql`${productStocks.quantity} - ${item.quantity}`,
              reservedQuantity: sql`${productStocks.reservedQuantity} - ${item.quantity}`,
            })
            .where(eq(productStocks.id, item.id));
        }
      }

      const [order] = await tx
        .update(orders)
        .set({
          status: 'complete',
          orderNumber,
          paymentMethodId: data.paymentMethodId,
          notes: data.notes ?? openBill.notes,
          cashShiftId: openShift.id,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, openBillId))
        .returning();

      return order;
    });
  }

  async cancel(openBillId: string, user: CurrentUserWithRole) {
    const openBill = await this.findById(openBillId, user);

    const openBillItems = await this.db.query.orderItems.findMany({
      where: eq(orderItems.orderId, openBillId),
    });

    await this.db.transaction(async (tx) => {
      const productIds = openBillItems.map((item) => item.productId).filter(Boolean);
      const stocks =
        productIds.length > 0
          ? await tx
              .select()
              .from(productStocks)
              .where(
                and(
                  eq(productStocks.outletId, openBill.outletId),
                  inArray(productStocks.productId, productIds),
                ),
              )
          : [];
      const stockMap = new Map(stocks.map((s) => [s.productId, s]));

      const stockUpdates: { id: string; quantity: number }[] = [];
      for (const item of openBillItems) {
        if (item.productId) {
          const stock = stockMap.get(item.productId);
          if (stock) {
            stockUpdates.push({ id: stock.id, quantity: item.quantity });
          }
        }
      }

      if (stockUpdates.length > 0) {
        for (const item of stockUpdates) {
          await tx
            .update(productStocks)
            .set({ reservedQuantity: sql`${productStocks.reservedQuantity} - ${item.quantity}` })
            .where(eq(productStocks.id, item.id));
        }
      }

      await tx
        .update(orders)
        .set({
          status: 'cancel',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, openBillId));
    });

    return { success: true };
  }
}
