import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { categories } from '@/db/schema/category-schema';
import { products } from '@/db/schema/product-schema';
import { tenants } from '@/db/schema/tenant-schema';
import type { DrizzleDB } from '@/db/type';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SQL, and, count, desc, eq, ilike, sql } from 'drizzle-orm';
import { CategoryQueryDto, CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(DB_CONNECTION) private db: DrizzleDB,
    private readonly tenantAuth: TenantAuthService,
  ) {}

  async findAll(query: CategoryQueryDto, user: CurrentUserWithRole) {
    const { page = 1, limit = 10, search, isActive = true, tenantId } = query;
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
      conditions.push(ilike(categories.nama, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const productCountSubquery = this.db
      .select({
        categoryId: products.categoryId,
        count: count().as('count'),
      })
      .from(products)
      .where(
        and(
          filterTenantId ? eq(products.tenantId, filterTenantId) : undefined,
          eq(products.isActive, true),
        ),
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
          productsCount: sql<number>`COALESCE(${productCountSubquery.count}, 0)::integer`,
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
    // Simple existence check first
    const category = await this.db
      .select({ tenantId: categories.tenantId })
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!category || category.length === 0) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check tenant access (permission already checked by guard)
    const hasAccess = await this.tenantAuth.canAccessTenant(user, category[0].tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this category');
    }

    // Enriched query with joins
    const productCountSubquery = this.db
      .select({
        categoryId: products.categoryId,
        count: count().as('count'),
      })
      .from(products)
      .where(and(eq(products.categoryId, id), eq(products.isActive, true)))
      .groupBy(products.categoryId)
      .as('product_counts');

    const result = await this.db
      .select({
        id: categories.id,
        tenantId: categories.tenantId,
        nama: categories.nama,
        deskripsi: categories.deskripsi,
        isActive: categories.isActive,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        productsCount: sql<number>`COALESCE(${productCountSubquery.count}, 0)::integer`,
        tenantIdRef: tenants.id,
        tenantNama: tenants.nama,
        tenantSlug: tenants.slug,
        tenantIsActive: tenants.isActive,
        tenantCreatedAt: tenants.createdAt,
        tenantUpdatedAt: tenants.updatedAt,
      })
      .from(categories)
      .leftJoin(tenants, eq(categories.tenantId, tenants.id))
      .leftJoin(productCountSubquery, eq(categories.id, productCountSubquery.categoryId))
      .where(eq(categories.id, id))
      .limit(1);

    const row = result[0];

    return {
      id: row.id,
      tenantId: row.tenantId,
      nama: row.nama,
      deskripsi: row.deskripsi,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      productsCount: row.productsCount,
      tenant: row.tenantIdRef
        ? {
            id: row.tenantIdRef,
            nama: row.tenantNama,
            slug: row.tenantSlug,
            isActive: row.tenantIsActive,
            createdAt: row.tenantCreatedAt,
            updatedAt: row.tenantUpdatedAt,
          }
        : null,
    };
  }

  async create(data: CreateCategoryDto, user: CurrentUserWithRole): Promise<void> {
    // Validate tenant access (permission already checked by guard)
    await this.tenantAuth.validateTenantOperation(user, data.tenantId);

    await this.db.insert(categories).values(data);
  }

  async update(id: string, data: UpdateCategoryDto, user: CurrentUserWithRole): Promise<void> {
    // findById already validates tenant access
    await this.findById(id, user);

    await this.db
      .update(categories)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id));
  }

  async remove(id: string, user: CurrentUserWithRole): Promise<void> {
    await this.findById(id, user);

    await this.db
      .update(categories)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id));
  }
}
