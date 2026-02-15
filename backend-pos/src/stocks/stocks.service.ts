import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { eq, and, desc, sql, SQL } from 'drizzle-orm';
import { productStocks } from '../db/schema/stock-schema';
import { products } from '../db/schema/product-schema';
import { outlets } from '../db/schema/outlet-schema';
import { CreateStockDto, UpdateStockDto, StockQueryDto } from './dto';
import { DB_CONNECTION } from '../db/db.module';
import type { DrizzleDB } from '../db/type';

@Injectable()
export class StocksService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) {}

  async findAll(query: StockQueryDto) {
    const { page = 1, limit = 10, productId, outletId } = query;
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [];

    if (productId) {
      conditions.push(eq(productStocks.productId, productId));
    }

    if (outletId) {
      conditions.push(eq(productStocks.outletId, outletId));
    }

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(productStocks)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(productStocks.updatedAt)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(productStocks)
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

  async create(data: CreateStockDto) {
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

  async update(id: number, data: UpdateStockDto) {
    await this.findById(id);

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

  async remove(id: number) {
    await this.findById(id);

    const [stock] = await this.db
      .delete(productStocks)
      .where(eq(productStocks.id, id))
      .returning();

    return stock;
  }

  async adjustQuantity(id: number, adjustment: number) {
    const stock = await this.findById(id);
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
