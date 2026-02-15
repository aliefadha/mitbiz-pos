import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { eq, and, like, desc, sql, SQL, count } from 'drizzle-orm';
import { categories } from '../db/schema/category-schema';
import { tenants } from '../db/schema/tenant-schema';
import { products } from '../db/schema/product-schema';
import { CreateCategoryDto, UpdateCategoryDto, CategoryQueryDto } from './dto';
import { DB_CONNECTION } from '../db/db.module';
import type { DrizzleDB } from '../db/type';

@Injectable()
export class CategoriesService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) {}

  async findAll(query: CategoryQueryDto) {
    const { page = 1, limit = 10, search, isActive, tenantId } = query;
    const offset = (page - 1) * limit;

    const whereClause = and(
      isActive !== undefined ? eq(categories.isActive, isActive) : undefined,
      tenantId ? eq(categories.tenantId, tenantId) : undefined,
      search ? like(categories.nama, `%${search}%`) : undefined,
    );

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(categories)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(categories.createdAt)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(categories)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    const categoryIds = data.map((c) => c.id);
    let productCounts: { categoryId: number; count: number }[] = [];
    
    if (categoryIds.length > 0) {
      const productCountResult = await this.db
        .select({
          categoryId: products.categoryId,
          count: count(),
        })
        .from(products)
        .where(
          and(
            eq(products.isActive, true),
            sql`${products.categoryId} IN (${sql.join(categoryIds.map((id) => sql`${id}`), sql`, `)})`
          )
        )
        .groupBy(products.categoryId);

      productCounts = productCountResult.map((p) => ({
        categoryId: p.categoryId!,
        count: Number(p.count),
      }));
    }

    const dataWithProductCount = data.map((category) => ({
      ...category,
      productsCount: productCounts.find((p) => p.categoryId === category.id)?.count || 0,
    }));

    return {
      data: dataWithProductCount,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number) {
    const category = await this.db.query.categories.findFirst({
      where: eq(categories.id, id),
      with: {
        tenant: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async create(data: CreateCategoryDto) {
    const tenantExists = await this.db.query.tenants.findFirst({
      where: eq(tenants.id, data.tenantId),
    });

    if (!tenantExists) {
      throw new NotFoundException(`Tenant with ID ${data.tenantId} not found`);
    }

    const [category] = await this.db
      .insert(categories)
      .values(data)
      .returning();

    return category;
  }

  async update(id: number, data: UpdateCategoryDto) {
    await this.findById(id);

    const [category] = await this.db
      .update(categories)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();

    return category;
  }

  async remove(id: number) {
    await this.findById(id);

    const [category] = await this.db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();

    return category;
  }
}
