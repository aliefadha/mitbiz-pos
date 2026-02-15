import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { eq, and, like, desc, sql, SQL } from 'drizzle-orm';
import { products } from '../db/schema/product-schema';
import { tenants } from '../db/schema/tenant-schema';
import { categories } from '../db/schema/category-schema';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto';
import { DB_CONNECTION } from '../db/db.module';
import type { DrizzleDB } from '../db/type';

@Injectable()
export class ProductsService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) {}

  async findAll(query: ProductQueryDto) {
    const { page = 1, limit = 10, search, isActive, tenantId, categoryId, tipe } = query;
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [];

    if (isActive !== undefined) {
      conditions.push(eq(products.isActive, isActive));
    }

    if (tenantId) {
      conditions.push(eq(products.tenantId, tenantId));
    }

    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }

    if (tipe) {
      const tipeValue = tipe as 'barang' | 'jasa' | 'digital';
      conditions.push(eq(products.tipe, tipeValue));
    }

    if (search) {
      conditions.push(like(products.nama, `%${search}%`));
    }

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(products)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(products.createdAt)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(products)
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
    const product = await this.db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        tenant: true,
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async create(data: CreateProductDto) {
    const tenantExists = await this.db.query.tenants.findFirst({
      where: eq(tenants.id, data.tenantId),
    });

    if (!tenantExists) {
      throw new NotFoundException(`Tenant with ID ${data.tenantId} not found`);
    }

    if (data.categoryId) {
      const categoryExists = await this.db.query.categories.findFirst({
        where: eq(categories.id, data.categoryId),
      });

      if (!categoryExists) {
        throw new NotFoundException(`Category with ID ${data.categoryId} not found`);
      }
    }

    const existingSku = await this.db.query.products.findFirst({
      where: eq(products.sku, data.sku),
    });

    if (existingSku) {
      throw new ConflictException(`Product with SKU ${data.sku} already exists`);
    }

    const [product] = await this.db
      .insert(products)
      .values({
        ...data,
        hargaJual: data.hargaJual,
      })
      .returning();

    return product;
  }

  async update(id: number, data: UpdateProductDto) {
    const existingProduct = await this.findById(id);

    if (data.sku && data.sku !== existingProduct.sku) {
      const skuExists = await this.db.query.products.findFirst({
        where: eq(products.sku, data.sku),
      });

      if (skuExists) {
        throw new ConflictException(
          `Product with SKU ${data.sku} already exists`,
        );
      }
    }

    if (data.categoryId && data.categoryId !== existingProduct.categoryId) {
      const categoryExists = await this.db.query.categories.findFirst({
        where: eq(categories.id, data.categoryId),
      });

      if (!categoryExists) {
        throw new NotFoundException(`Category with ID ${data.categoryId} not found`);
      }
    }

    const [product] = await this.db
      .update(products)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    return product;
  }

  async remove(id: number) {
    await this.findById(id);

    const [product] = await this.db
      .delete(products)
      .where(eq(products.id, id))
      .returning();

    return product;
  }
}
