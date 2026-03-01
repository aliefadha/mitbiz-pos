import type { CurrentUserType } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { categories } from '@/db/schema/category-schema';
import { products } from '@/db/schema/product-schema';
import { tenants } from '@/db/schema/tenant-schema';
import type { DrizzleDB } from '@/db/type';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SQL, and, count, desc, eq, inArray, like, sql } from 'drizzle-orm';
import { CategoryQueryDto, CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) {}

  async findAll(query: CategoryQueryDto) {
    const { page = 1, limit = 10, search, isActive, tenantId } = query;
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [];

    if (isActive !== undefined) {
      conditions.push(eq(categories.isActive, isActive));
    }

    if (tenantId) {
      conditions.push(eq(categories.tenantId, tenantId));
    }

    if (search) {
      conditions.push(like(categories.nama, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const productCountSubquery = this.db
      .select({
        categoryId: products.categoryId,
        count: count().as('count'),
      })
      .from(products)
      .where(
        and(tenantId ? eq(products.tenantId, tenantId) : undefined, eq(products.isActive, true)),
      )
      .groupBy(products.categoryId)
      .as('product_counts');

    const [data, totalResult] = await Promise.all([
      this.db
        .select({
          id: categories.id,
          tenantId: categories.tenantId,
          nama: categories.nama,
          deskripsi: categories.deskripsi,
          isActive: categories.isActive,
          createdAt: categories.createdAt,
          updatedAt: categories.updatedAt,
          productsCount: sql<number>`COALESCE(${productCountSubquery.count}, 0)`,
        })
        .from(categories)
        .leftJoin(productCountSubquery, eq(categories.id, productCountSubquery.categoryId))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(categories.createdAt)),
      this.db.select({ count: sql<number>`count(*)` }).from(categories).where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return {
      data: data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, user: CurrentUserType) {
    const category = await this.db.query.categories.findFirst({
      where: eq(categories.id, id),
      with: {
        tenant: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check ownership for owner/cashier
    if (user.role === 'owner' || user.role === 'cashier') {
      const userTenants = await this.db.query.tenants.findMany({
        where: eq(tenants.userId, user.id),
      });
      const userTenantIds = userTenants.map((t) => t.id);
      if (userTenantIds.length > 0 && !userTenantIds.includes(category.tenantId)) {
        throw new ForbiddenException('You do not have access to this category');
      }
    }

    return category;
  }

  async create(data: CreateCategoryDto, user: CurrentUserType) {
    // Verify tenant exists and user has access
    const tenant = await this.db.query.tenants.findFirst({
      where: eq(tenants.id, data.tenantId),
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${data.tenantId} not found`);
    }

    // Check ownership for owner
    if (user.role === 'owner' && tenant.userId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to create categories in this tenant',
      );
    }

    const [category] = await this.db.insert(categories).values(data).returning();

    return category;
  }

  async update(id: string, data: UpdateCategoryDto, user: CurrentUserType) {
    const existingCategory = await this.findById(id, user);

    // Verify ownership again
    if (user.role === 'owner') {
      const userTenants = await this.db.query.tenants.findMany({
        where: eq(tenants.userId, user.id),
      });
      const userTenantIds = userTenants.map((t) => t.id);
      if (userTenantIds.length > 0 && !userTenantIds.includes(existingCategory.tenantId)) {
        throw new ForbiddenException('You do not have permission to update this category');
      }
    }

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

  async remove(id: string, user: CurrentUserType) {
    const category = await this.findById(id, user);

    // Verify ownership
    if (user.role === 'owner') {
      const userTenants = await this.db.query.tenants.findMany({
        where: eq(tenants.userId, user.id),
      });
      const userTenantIds = userTenants.map((t) => t.id);
      if (userTenantIds.length > 0 && !userTenantIds.includes(category.tenantId)) {
        throw new ForbiddenException('You do not have permission to delete this category');
      }
    }

    const [deletedCategory] = await this.db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();

    return deletedCategory;
  }
}
