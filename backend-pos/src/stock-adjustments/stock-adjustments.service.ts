import {
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { eq, and, desc, sql, SQL } from 'drizzle-orm';
import { stockAdjustments } from '../db/schema/stock-adjustment-schema';
import { products } from '../db/schema/product-schema';
import { outlets } from '../db/schema/outlet-schema';
import { productStocks } from '../db/schema/stock-schema';
import { CreateStockAdjustmentDto, StockAdjustmentQueryDto } from './dto';
import { DB_CONNECTION } from '../db/db.module';
import type { DrizzleDB } from '../db/type';

@Injectable()
export class StockAdjustmentsService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) {}

  async findAll(query: StockAdjustmentQueryDto) {
    const { page = 1, limit = 10, productId, outletId, adjustedBy } = query;
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [];

    if (productId) {
      conditions.push(eq(stockAdjustments.productId, productId));
    }

    if (outletId) {
      conditions.push(eq(stockAdjustments.outletId, outletId));
    }

    if (adjustedBy) {
      conditions.push(eq(stockAdjustments.adjustedBy, adjustedBy));
    }

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(stockAdjustments)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(stockAdjustments.createdAt)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(stockAdjustments)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number) {
    const adjustment = await this.db.query.stockAdjustments.findFirst({
      where: eq(stockAdjustments.id, id),
      with: {
        product: true,
        outlet: true,
        user: true,
      },
    });

    if (!adjustment) {
      throw new NotFoundException(`Stock adjustment with ID ${id} not found`);
    }

    return adjustment;
  }

  async create(data: CreateStockAdjustmentDto) {
    const productExists = await this.db.query.products.findFirst({
      where: eq(products.id, data.productId),
    });

    if (!productExists) {
      throw new NotFoundException(`Product with ID ${data.productId} not found`);
    }

    const outletExists = await this.db.query.outlets.findFirst({
      where: eq(outlets.id, data.outletId),
    });

    if (!outletExists) {
      throw new NotFoundException(`Outlet with ID ${data.outletId} not found`);
    }

    const [adjustment] = await this.db
      .insert(stockAdjustments)
      .values(data)
      .returning();

    const existingStock = await this.db.query.productStocks.findFirst({
      where: and(
        eq(productStocks.productId, data.productId),
        eq(productStocks.outletId, data.outletId),
      ),
    });

    if (existingStock) {
      await this.db
        .update(productStocks)
        .set({
          quantity: existingStock.quantity + data.quantity,
          updatedAt: new Date(),
        })
        .where(eq(productStocks.id, existingStock.id));
    } else {
      await this.db.insert(productStocks).values({
        productId: data.productId,
        outletId: data.outletId,
        quantity: data.quantity,
      });
    }

    return adjustment;
  }
}
