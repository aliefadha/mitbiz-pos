import { randomUUID } from 'node:crypto';
import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { discountProducts, discounts } from '@/db/schema/discount-schema';
import { outlets } from '@/db/schema/outlet-schema';
import { products } from '@/db/schema/product-schema';
import { tenants } from '@/db/schema/tenant-schema';
import type { DrizzleDB } from '@/db/type';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SQL, and, asc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { CreateDiscountDto, DiscountQueryDto, UpdateDiscountDto } from './dto';

@Injectable()
export class DiscountsService {
  constructor(
    @Inject(DB_CONNECTION) private db: DrizzleDB,
    private readonly tenantAuth: TenantAuthService,
  ) {}

  async findAll(query: DiscountQueryDto, user: CurrentUserWithRole) {
    const { page = 1, limit = 10, search, isActive = true, tenantId, outletId } = query;
    const offset = (page - 1) * limit;

    // Validate that query tenantId matches user's allowed tenant
    if (tenantId) {
      await this.tenantAuth.validateQueryTenantId(user, tenantId);
    }

    // Get effective tenant ID for the user (for filtering if no tenantId provided)
    const effectiveTenantId = await this.tenantAuth.getEffectiveTenantId(user);

    const conditions: SQL<unknown>[] = [];

    if (isActive !== undefined) {
      conditions.push(eq(discounts.isActive, isActive));
    }

    // Use query tenantId if provided, otherwise use effective tenant (for non-global roles)
    const filterTenantId = tenantId || effectiveTenantId;
    if (filterTenantId) {
      conditions.push(eq(discounts.tenantId, filterTenantId));
    }

    if (search) {
      conditions.push(ilike(discounts.nama, `%${search}%`));
    }

    if (outletId) {
      conditions.push(eq(discounts.outletId, outletId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(discounts)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(asc(discounts.createdAt)),
      this.db.select({ count: sql<number>`count(*)` }).from(discounts).where(whereClause),
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
    // Step 1: minimal existence check
    const discount = await this.db
      .select({ tenantId: discounts.tenantId })
      .from(discounts)
      .where(eq(discounts.id, id))
      .limit(1);

    if (!discount || discount.length === 0) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    // Step 2: tenant access check (permission already checked by guard)
    const hasAccess = await this.tenantAuth.canAccessTenant(user, discount[0].tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this discount');
    }

    // Step 3: enriched query with explicit joins
    const result = await this.db
      .select({
        id: discounts.id,
        tenantId: discounts.tenantId,
        outletId: discounts.outletId,
        nama: discounts.nama,
        rate: discounts.rate,
        scope: discounts.scope,
        level: discounts.level,
        isActive: discounts.isActive,
        createdAt: discounts.createdAt,
        updatedAt: discounts.updatedAt,
        tenantIdRef: tenants.id,
        tenantNama: tenants.nama,
        tenantSlug: tenants.slug,
        tenantIsActive: tenants.isActive,
        tenantCreatedAt: tenants.createdAt,
        tenantUpdatedAt: tenants.updatedAt,
        outletIdRef: outlets.id,
        outletNama: outlets.nama,
        outletKode: outlets.kode,
        outletIsActive: outlets.isActive,
        outletCreatedAt: outlets.createdAt,
        outletUpdatedAt: outlets.updatedAt,
      })
      .from(discounts)
      .leftJoin(tenants, eq(discounts.tenantId, tenants.id))
      .leftJoin(outlets, eq(discounts.outletId, outlets.id))
      .where(eq(discounts.id, id))
      .limit(1);

    const row = result[0];

    // Query associated products separately
    const productRows = await this.db
      .select({
        id: products.id,
        tenantId: products.tenantId,
        sku: products.sku,
        nama: products.nama,
        deskripsi: products.deskripsi,
        categoryId: products.categoryId,
        hargaBeli: products.hargaBeli,
        hargaJual: products.hargaJual,
        unit: products.unit,
        minStockLevel: products.minStockLevel,
        enableMinStock: products.enableMinStock,
        enableStockTracking: products.enableStockTracking,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(discountProducts)
      .innerJoin(products, eq(discountProducts.productId, products.id))
      .where(eq(discountProducts.discountId, id));

    return {
      id: row.id,
      tenantId: row.tenantId,
      outletId: row.outletId,
      nama: row.nama,
      rate: row.rate,
      scope: row.scope,
      level: row.level,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
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
      outlet: row.outletIdRef
        ? {
            id: row.outletIdRef,
            nama: row.outletNama,
            kode: row.outletKode,
            isActive: row.outletIsActive,
            createdAt: row.outletCreatedAt,
            updatedAt: row.outletUpdatedAt,
          }
        : null,
      products: productRows,
    };
  }

  async create(data: CreateDiscountDto, user: CurrentUserWithRole): Promise<void> {
    const { productIds, ...discountData } = data;

    // Validate tenant access (permission already checked by guard)
    await this.tenantAuth.validateTenantOperation(user, data.tenantId);

    const id = randomUUID();
    await this.db.insert(discounts).values({ ...discountData, id });

    // Insert into join table if productIds provided
    if (productIds && productIds.length > 0) {
      await this.db.insert(discountProducts).values(
        productIds.map((productId) => ({
          discountId: id,
          productId,
        })),
      );
    }
  }

  async update(id: string, data: UpdateDiscountDto, user: CurrentUserWithRole): Promise<void> {
    const { productIds, ...discountData } = data;
    // findById already validates tenant access
    await this.findById(id, user);

    await this.db
      .update(discounts)
      .set({
        ...discountData,
        updatedAt: new Date(),
      })
      .where(eq(discounts.id, id));

    // Update product associations if productIds provided
    if (productIds !== undefined) {
      // Delete existing associations
      await this.db.delete(discountProducts).where(eq(discountProducts.discountId, id));

      // Insert new associations
      if (productIds.length > 0) {
        await this.db.insert(discountProducts).values(
          productIds.map((productId) => ({
            discountId: id,
            productId,
          })),
        );
      }
    }
  }

  async remove(id: string, user: CurrentUserWithRole): Promise<void> {
    await this.findById(id, user);

    await this.db
      .update(discounts)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(discounts.id, id));
  }
}
