import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { categories } from '@/db/schema/category-schema';
import { discountProducts } from '@/db/schema/discount-schema';
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
import { SQL, and, desc, eq, like, sql } from 'drizzle-orm';
import { CreateProductDto, ProductQueryDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(DB_CONNECTION) private db: DrizzleDB,
    private readonly tenantAuth: TenantAuthService,
  ) {}

  async findAll(query: ProductQueryDto, user: CurrentUserWithRole) {
    const { page = 1, limit = 10, search, isActive, tenantId, categoryId, outletId } = query;
    const offset = (page - 1) * limit;

    // Validate that query tenantId matches user's allowed tenant
    if (tenantId) {
      await this.tenantAuth.validateQueryTenantId(user, tenantId);
    }

    // Get effective tenant ID for the user (for filtering if no tenantId provided)
    const effectiveTenantId = await this.tenantAuth.getEffectiveTenantId(user);

    const conditions: SQL<unknown>[] = [];

    if (isActive !== undefined) {
      conditions.push(eq(products.isActive, isActive));
    }

    // Use query tenantId if provided, otherwise use effective tenant (for non-global roles)
    const filterTenantId = tenantId || effectiveTenantId;
    if (filterTenantId) {
      conditions.push(eq(products.tenantId, filterTenantId));
    }

    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }

    if (search) {
      conditions.push(like(products.nama, `%${search}%`));
    }

    const stockCondition = outletId ? eq(productStocks.outletId, outletId) : undefined;

    const tenantCondition = filterTenantId ? eq(products.tenantId, filterTenantId) : undefined;

    const [data, totalResult, statsResult] = await Promise.all([
      this.db
        .select()
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(productStocks, and(eq(products.id, productStocks.productId), stockCondition))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(products.createdAt)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
      this.db
        .select({
          total: sql<number>`count(*)`,
          active: sql<number>`sum(case when ${products.isActive} = true then 1 else 0 end)`,
        })
        .from(products)
        .where(tenantCondition),
    ]);

    const productsMap = new Map<string, number>();
    data.forEach((row) => {
      const current = productsMap.get(row.products.id) ?? 0;
      productsMap.set(row.products.id, current + (row.product_stocks?.quantity ?? 0));
    });

    const productsWithCategory = data.map((row) => ({
      ...row.products,
      stock: productsMap.get(row.products.id) ?? 0,
      category: row.categories
        ? {
            id: row.categories.id,
            nama: row.categories.nama,
            deskripsi: row.categories.deskripsi,
            isActive: row.categories.isActive,
            createdAt: row.categories.createdAt,
            updatedAt: row.categories.updatedAt,
          }
        : null,
    }));

    const total = Number(totalResult[0]?.count || 0);
    const totalProduk = Number(statsResult[0]?.total || 0);
    const produkAktif = Number(statsResult[0]?.active || 0);

    return {
      data: productsWithCategory,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        totalProduk,
        produkAktif,
      },
    };
  }

  async findById(id: string, user: CurrentUserWithRole) {
    const product = await this.db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        tenant: true,
        category: true,
        discountProducts: {
          with: {
            discount: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check tenant access (permission already checked by guard)
    const hasAccess = await this.tenantAuth.canAccessTenant(user, product.tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this product');
    }

    return product;
  }

  async create(data: CreateProductDto, user: CurrentUserWithRole) {
    // Validate tenant access (permission already checked by guard)
    await this.tenantAuth.validateTenantOperation(user, data.tenantId);

    if (data.categoryId) {
      const category = await this.db.query.categories.findFirst({
        where: eq(categories.id, data.categoryId),
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${data.categoryId} not found`);
      }

      // Verify category belongs to same tenant
      if (category.tenantId !== data.tenantId) {
        throw new ForbiddenException('Category does not belong to this tenant');
      }
    }

    const existingSku = await this.db.query.products.findFirst({
      where: and(eq(products.sku, data.sku), eq(products.tenantId, data.tenantId)),
    });

    if (existingSku) {
      throw new ConflictException(`Product with SKU ${data.sku} already exists in this tenant`);
    }

    const [product] = await this.db.insert(products).values(data).returning();

    return product;
  }

  async update(id: string, data: UpdateProductDto, user: CurrentUserWithRole) {
    const { discountIds, ...productData } = data;
    const existingProduct = await this.findById(id, user);

    if (data.sku && data.sku !== existingProduct.sku) {
      const skuExists = await this.db.query.products.findFirst({
        where: and(eq(products.sku, data.sku), eq(products.tenantId, existingProduct.tenantId)),
      });

      if (skuExists) {
        throw new ConflictException(`Product with SKU ${data.sku} already exists in this tenant`);
      }
    }

    if (data.categoryId && data.categoryId !== existingProduct.categoryId) {
      const category = await this.db.query.categories.findFirst({
        where: eq(categories.id, data.categoryId),
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${data.categoryId} not found`);
      }

      // Verify category belongs to same tenant
      if (category.tenantId !== existingProduct.tenantId) {
        throw new ForbiddenException('Category does not belong to this tenant');
      }
    }

    const [product] = await this.db
      .update(products)
      .set({
        ...productData,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    // Update discount associations if discountIds provided
    if (discountIds !== undefined) {
      // Delete existing associations
      await this.db.delete(discountProducts).where(eq(discountProducts.productId, id));

      // Insert new associations
      if (discountIds.length > 0) {
        await this.db.insert(discountProducts).values(
          discountIds.map((discountId) => ({
            discountId,
            productId: id,
          })),
        );
      }
    }

    return product;
  }

  async remove(id: string, user: CurrentUserWithRole) {
    await this.findById(id, user);

    const [product] = await this.db.delete(products).where(eq(products.id, id)).returning();

    return product;
  }
}
