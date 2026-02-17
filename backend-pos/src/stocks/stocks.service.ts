import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { eq, and, desc, sql, SQL } from 'drizzle-orm';
import { productStocks } from '../db/schema/stock-schema';
import { products } from '../db/schema/product-schema';
import { outlets } from '../db/schema/outlet-schema';
import { tenants } from '../db/schema/tenant-schema';
import { CreateStockDto, UpdateStockDto, StockQueryDto } from './dto';
import { DB_CONNECTION } from '../db/db.module';
import type { DrizzleDB } from '../db/type';
import type { CurrentUserType } from '../common/decorators/current-user.decorator';

@Injectable()
export class StocksService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) {}

  async findAll(query: StockQueryDto, user: CurrentUserType) {
    const { page = 1, limit = 10, productId, outletId } = query;
    const offset = (page - 1) * limit;

    // Get user's tenant ID if owner or cashier
    let effectiveTenantId: number | undefined;
    if (user.role === 'owner' || user.role === 'cashier') {
      const userTenant = await this.db.query.tenants.findFirst({
        where: eq(tenants.userId, user.id),
      });
      if (userTenant) {
        effectiveTenantId = userTenant.id;
      }
    }

    // Build base conditions
    const conditions: SQL<unknown>[] = [];

    if (productId) {
      conditions.push(eq(productStocks.productId, productId));
    }

    if (outletId) {
      conditions.push(eq(productStocks.outletId, outletId));
    }

    // If owner/cashier, filter by tenant via product or outlet
    if (effectiveTenantId) {
      // For owner/cashier, we need to join with products or outlets to filter by tenant
      const productIdsInTenant = await this.db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.tenantId, effectiveTenantId));

      const productIdList = productIdsInTenant.map((p) => p.id);

      if (productIdList.length === 0) {
        return {
          data: [],
          meta: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        };
      }

      conditions.push(
        sql`${productStocks.productId} IN (${sql.join(
          productIdList.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const queryResult = await Promise.all([
      this.db
        .select()
        .from(productStocks)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(productStocks.updatedAt)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(productStocks)
        .where(whereClause),
    ]);

    const total = Number(queryResult[1][0]?.count || 0);

    return {
      data: queryResult[0],
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number, user: CurrentUserType) {
    const stock = await this.db.query.productStocks.findFirst({
      where: eq(productStocks.id, id),
      with: {
        product: true,
        outlet: true,
      },
    });

    if (!stock) {
      throw new NotFoundException(`Stock with ID ${id} not found`);
    }

    // Check ownership for owner/cashier via product's tenant
    if (user.role === 'owner' || user.role === 'cashier') {
      const userTenant = await this.db.query.tenants.findFirst({
        where: eq(tenants.userId, user.id),
      });
      if (userTenant && stock.product.tenantId !== userTenant.id) {
        throw new ForbiddenException('You do not have access to this stock');
      }
    }

    return stock;
  }

  async findByProductAndOutlet(productId: number, outletId: number) {
    const stock = await this.db.query.productStocks.findFirst({
      where: and(
        eq(productStocks.productId, productId),
        eq(productStocks.outletId, outletId),
      ),
      with: {
        product: true,
        outlet: true,
      },
    });

    return stock;
  }

  async create(data: CreateStockDto, user: CurrentUserType) {
    // Verify product exists and user has access
    const product = await this.db.query.products.findFirst({
      where: eq(products.id, data.productId),
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID ${data.productId} not found`,
      );
    }

    // Check ownership for owner
    if (user.role === 'owner') {
      const userTenant = await this.db.query.tenants.findFirst({
        where: eq(tenants.userId, user.id),
      });
      if (userTenant && product.tenantId !== userTenant.id) {
        throw new ForbiddenException(
          'You do not have permission to create stock for this product',
        );
      }
    }

    // Verify outlet exists and belongs to same tenant
    const outlet = await this.db.query.outlets.findFirst({
      where: eq(outlets.id, data.outletId),
    });

    if (!outlet) {
      throw new NotFoundException(`Outlet with ID ${data.outletId} not found`);
    }

    if (outlet.tenantId !== product.tenantId) {
      throw new ForbiddenException(
        'Outlet does not belong to the same tenant as the product',
      );
    }

    const existingStock = await this.findByProductAndOutlet(
      data.productId,
      data.outletId,
    );

    if (existingStock) {
      throw new ConflictException(
        `Stock for product ${data.productId} at outlet ${data.outletId} already exists`,
      );
    }

    const [stock] = await this.db
      .insert(productStocks)
      .values(data)
      .returning();

    return stock;
  }

  async update(id: number, data: UpdateStockDto, user: CurrentUserType) {
    const existingStock = await this.findById(id, user);

    // Verify ownership again
    if (user.role === 'owner') {
      const userTenant = await this.db.query.tenants.findFirst({
        where: eq(tenants.userId, user.id),
      });
      if (userTenant && existingStock.product.tenantId !== userTenant.id) {
        throw new ForbiddenException(
          'You do not have permission to update this stock',
        );
      }
    }

    const [stock] = await this.db
      .update(productStocks)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(productStocks.id, id))
      .returning();

    return stock;
  }

  async remove(id: number, user: CurrentUserType) {
    const stock = await this.findById(id, user);

    // Verify ownership
    if (user.role === 'owner') {
      const userTenant = await this.db.query.tenants.findFirst({
        where: eq(tenants.userId, user.id),
      });
      if (userTenant && stock.product.tenantId !== userTenant.id) {
        throw new ForbiddenException(
          'You do not have permission to delete this stock',
        );
      }
    }

    const [deletedStock] = await this.db
      .delete(productStocks)
      .where(eq(productStocks.id, id))
      .returning();

    return deletedStock;
  }

  async adjustQuantity(id: number, adjustment: number, user: CurrentUserType) {
    const stock = await this.findById(id, user);
    const newQuantity = stock.quantity + adjustment;

    if (newQuantity < 0) {
      throw new Error('Insufficient stock');
    }

    // Verify ownership for owner
    if (user.role === 'owner') {
      const userTenant = await this.db.query.tenants.findFirst({
        where: eq(tenants.userId, user.id),
      });
      if (userTenant && stock.product.tenantId !== userTenant.id) {
        throw new ForbiddenException(
          'You do not have permission to adjust this stock',
        );
      }
    }

    const [updatedStock] = await this.db
      .update(productStocks)
      .set({
        quantity: newQuantity,
        updatedAt: new Date(),
      })
      .where(eq(productStocks.id, id))
      .returning();

    return updatedStock;
  }
}
