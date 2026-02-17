import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { eq, and, like, desc, sql, SQL, count } from 'drizzle-orm';
import { categories } from '../db/schema/category-schema';
import { tenants } from '../db/schema/tenant-schema';
import { products } from '../db/schema/product-schema';
import { CreateCategoryDto, UpdateCategoryDto, CategoryQueryDto } from './dto';
import { DB_CONNECTION } from '../db/db.module';
import type { DrizzleDB } from '../db/type';
import type { CurrentUserType } from '../common/decorators/current-user.decorator';

@Injectable()
export class CategoriesService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) {}

  async findAll(query: CategoryQueryDto, user: CurrentUserType) {
    const { page = 1, limit = 10, search, isActive, tenantId } = query;
    const offset = (page - 1) * limit;

    // Get user's tenant ID if owner or cashier
    let effectiveTenantId = tenantId;
    if (user.role === 'owner' || user.role === 'cashier') {
      const userTenant = await this.db.query.tenants.findFirst({
        where: eq(tenants.userId, user.id),
      });
      if (userTenant) {
        effectiveTenantId = userTenant.id;
      }
    }

    const conditions: SQL<unknown>[] = [];

    if (isActive !== undefined) {
      conditions.push(eq(categories.isActive, isActive));
    }

    if (effectiveTenantId) {
      conditions.push(eq(categories.tenantId, effectiveTenantId));
    }

    if (search) {
      conditions.push(like(categories.nama, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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
            sql`${products.categoryId} IN (${sql.join(
              categoryIds.map((id) => sql`${id}`),
              sql`, `,
            )})`,
          ),
        )
        .groupBy(products.categoryId);

      productCounts = productCountResult.map((p) => ({
        categoryId: p.categoryId!,
        count: Number(p.count),
      }));
    }

    const dataWithProductCount = data.map((category) => ({
      ...category,
      productsCount:
        productCounts.find((p) => p.categoryId === category.id)?.count || 0,
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

  async findById(id: number, user: CurrentUserType) {
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
      const userTenant = await this.db.query.tenants.findFirst({
        where: eq(tenants.userId, user.id),
      });
      if (userTenant && category.tenantId !== userTenant.id) {
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

    const [category] = await this.db
      .insert(categories)
      .values(data)
      .returning();

    return category;
  }

  async update(id: number, data: UpdateCategoryDto, user: CurrentUserType) {
    const existingCategory = await this.findById(id, user);

    // Verify ownership again
    if (user.role === 'owner') {
      const userTenant = await this.db.query.tenants.findFirst({
        where: eq(tenants.userId, user.id),
      });
      if (userTenant && existingCategory.tenantId !== userTenant.id) {
        throw new ForbiddenException(
          'You do not have permission to update this category',
        );
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

  async remove(id: number, user: CurrentUserType) {
    const category = await this.findById(id, user);

    // Verify ownership
    if (user.role === 'owner') {
      const userTenant = await this.db.query.tenants.findFirst({
        where: eq(tenants.userId, user.id),
      });
      if (userTenant && category.tenantId !== userTenant.id) {
        throw new ForbiddenException(
          'You do not have permission to delete this category',
        );
      }
    }

    const [deletedCategory] = await this.db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();

    return deletedCategory;
  }
}
