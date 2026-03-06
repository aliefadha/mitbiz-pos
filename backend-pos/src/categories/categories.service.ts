import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { categories } from '@/db/schema/category-schema';
import { products } from '@/db/schema/product-schema';
import type { DrizzleDB } from '@/db/type';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SQL, and, count, desc, eq, inArray, like, sql } from 'drizzle-orm';
import { CategoryQueryDto, CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(DB_CONNECTION) private db: DrizzleDB,
    private readonly tenantAuth: TenantAuthService,
  ) {}

  async findAll(query: CategoryQueryDto, user: CurrentUserWithRole) {
    const { page = 1, limit = 10, search, isActive, tenantId } = query;
    const offset = (page - 1) * limit;

    // Validate that query tenantId matches user's allowed tenant
    if (tenantId) {
      await this.tenantAuth.validateQueryTenantId(user, tenantId);
    }

    // Get effective tenant ID for the user (for filtering if no tenantId provided)
    const effectiveTenantId = await this.tenantAuth.getEffectiveTenantId(user);

    const conditions: SQL<unknown>[] = [];

    if (isActive !== undefined) {
      conditions.push(eq(categories.isActive, isActive));
    }

    // Use query tenantId if provided, otherwise use effective tenant (for non-global roles)
    const filterTenantId = tenantId || effectiveTenantId;
    if (filterTenantId) {
      conditions.push(eq(categories.tenantId, filterTenantId));
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

  async findById(id: string, user: CurrentUserWithRole) {
    const category = await this.db.query.categories.findFirst({
      where: eq(categories.id, id),
      with: {
        tenant: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check tenant access (permission already checked by guard)
    const hasAccess = await this.tenantAuth.canAccessTenant(user, category.tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this category');
    }

    return category;
  }

  async create(data: CreateCategoryDto, user: CurrentUserWithRole) {
    // Validate tenant access (permission already checked by guard)
    await this.tenantAuth.validateTenantOperation(user, data.tenantId);

    const [category] = await this.db.insert(categories).values(data).returning();

    return category;
  }

  async update(id: string, data: UpdateCategoryDto, user: CurrentUserWithRole) {
    // findById already validates tenant access
    const existingCategory = await this.findById(id, user);

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

  async remove(id: string, user: CurrentUserWithRole) {
    // findById already validates tenant access
    await this.findById(id, user);

    const [deletedCategory] = await this.db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();

    return deletedCategory;
  }
}
