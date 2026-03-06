import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { getProductIdsByTenant } from '@/common/utils/tenant-filter';
import { DB_CONNECTION } from '@/db/db.module';
import { outlets } from '@/db/schema/outlet-schema';
import { products } from '@/db/schema/product-schema';
import { productStocks } from '@/db/schema/stock-schema';
import type { DrizzleDB } from '@/db/type';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SQL, and, desc, eq, sql } from 'drizzle-orm';
import { CreateStockDto, StockQueryDto, UpdateStockDto } from './dto';

@Injectable()
export class StocksService {
  constructor(
    @Inject(DB_CONNECTION) private db: DrizzleDB,
    private readonly tenantAuth: TenantAuthService,
  ) {}

  async findAll(query: StockQueryDto, user: CurrentUserWithRole) {
    const { page = 1, limit = 10, productId, outletId, tenantId } = query;
    const offset = (page - 1) * limit;

    // Validate that query tenantId matches user's allowed tenant
    if (tenantId) {
      await this.tenantAuth.validateQueryTenantId(user, tenantId);
    }

    // Get effective tenant ID for the user (for filtering if no tenantId provided)
    const effectiveTenantId = await this.tenantAuth.getEffectiveTenantId(user);

    const conditions: SQL<unknown>[] = [];

    if (productId) {
      conditions.push(eq(productStocks.productId, productId));
    }

    if (outletId) {
      conditions.push(eq(productStocks.outletId, outletId));
    }

    // Filter by tenant - use query tenantId if provided, otherwise use effective tenant
    const filterTenantId = tenantId || effectiveTenantId;
    if (filterTenantId) {
      const productIdList = await getProductIdsByTenant(this.db, filterTenantId);

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
      this.db.query.productStocks.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [desc(productStocks.updatedAt)],
        with: {
          outlet: true,
        },
      }),
      this.db.select({ count: sql<number>`count(*)` }).from(productStocks).where(whereClause),
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

  async findById(id: string, user: CurrentUserWithRole) {
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

    // Check tenant access via product's tenant (permission already checked by guard)
    const hasAccess = await this.tenantAuth.canAccessTenant(user, stock.product.tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this stock');
    }

    return stock;
  }

  async findByProductAndOutlet(productId: string, outletId: string) {
    const stock = await this.db.query.productStocks.findFirst({
      where: and(eq(productStocks.productId, productId), eq(productStocks.outletId, outletId)),
      with: {
        product: true,
        outlet: true,
      },
    });

    return stock;
  }

  async create(data: CreateStockDto, user: CurrentUserWithRole) {
    // Verify product exists
    const product = await this.db.query.products.findFirst({
      where: eq(products.id, data.productId),
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${data.productId} not found`);
    }

    // Validate tenant access via product's tenant (permission already checked by guard)
    await this.tenantAuth.validateTenantOperation(user, product.tenantId);

    // Verify outlet exists and belongs to same tenant
    const outlet = await this.db.query.outlets.findFirst({
      where: eq(outlets.id, data.outletId),
    });

    if (!outlet) {
      throw new NotFoundException(`Outlet with ID ${data.outletId} not found`);
    }

    if (outlet.tenantId !== product.tenantId) {
      throw new ForbiddenException('Outlet does not belong to the same tenant as the product');
    }

    const existingStock = await this.findByProductAndOutlet(data.productId, data.outletId);

    if (existingStock) {
      throw new ConflictException(`Stock telah dibuat`);
    }

    const [stock] = await this.db.insert(productStocks).values(data).returning();

    return stock;
  }

  async update(id: string, data: UpdateStockDto, user: CurrentUserWithRole) {
    // findById already validates tenant access via product's tenant
    await this.findById(id, user);

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

  async remove(id: string, user: CurrentUserWithRole) {
    // findById already validates tenant access via product's tenant
    await this.findById(id, user);

    const [deletedStock] = await this.db
      .delete(productStocks)
      .where(eq(productStocks.id, id))
      .returning();

    return deletedStock;
  }

  async adjustQuantity(id: string, adjustment: number, user: CurrentUserWithRole) {
    // findById already validates tenant access via product's tenant
    const stock = await this.findById(id, user);
    const newQuantity = stock.quantity + adjustment;

    if (newQuantity < 0) {
      throw new Error('Insufficient stock');
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
