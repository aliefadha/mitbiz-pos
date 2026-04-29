import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { categories } from '@/db/schema/category-schema';
import { discountProducts, discounts } from '@/db/schema/discount-schema';
import { products } from '@/db/schema/product-schema';
import { productStocks } from '@/db/schema/stock-schema';
import { tenants } from '@/db/schema/tenant-schema';
import type { DrizzleDB } from '@/db/type';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SQL, and, asc, eq, ilike, sql } from 'drizzle-orm';
import { CreateProductDto, ProductQueryDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(DB_CONNECTION) private db: DrizzleDB,
    private readonly tenantAuth: TenantAuthService,
  ) {}

  async findAll(query: ProductQueryDto, user: CurrentUserWithRole) {
    const { page = 1, limit = 10, search, isActive = true, tenantId, categoryId, outletId } = query;
    const offset = (page - 1) * limit;

    if (tenantId) {
      await this.tenantAuth.validateQueryTenantId(user, tenantId);
    }

    const effectiveTenantId = await this.tenantAuth.getEffectiveTenantId(user);

    const conditions: SQL<unknown>[] = [];

    if (isActive !== undefined) {
      conditions.push(eq(products.isActive, isActive));
    }

    const filterTenantId = tenantId || effectiveTenantId;
    if (filterTenantId) {
      conditions.push(eq(products.tenantId, filterTenantId));
    }

    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }

    if (search) {
      conditions.push(ilike(products.nama, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const stockCondition = outletId ? eq(productStocks.outletId, outletId) : undefined;

    const stockSubquery = this.db
      .select({
        productId: productStocks.productId,
        totalQuantity: sql<number>`COALESCE(SUM(${productStocks.quantity}), 0)`.as(
          'total_quantity',
        ),
      })
      .from(productStocks)
      .where(stockCondition)
      .groupBy(productStocks.productId)
      .as('stock_totals');

    const tenantCondition = filterTenantId ? eq(products.tenantId, filterTenantId) : undefined;

    const [data, totalResult, statsResult] = await Promise.all([
      this.db
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
          stock: sql<number>`COALESCE(${stockSubquery.totalQuantity}, 0)::integer`,
          categoryIdRef: categories.id,
          categoryNama: categories.nama,
          categoryDeskripsi: categories.deskripsi,
          categoryIsActive: categories.isActive,
          categoryCreatedAt: categories.createdAt,
          categoryUpdatedAt: categories.updatedAt,
        })
        .from(products)
        .leftJoin(stockSubquery, eq(products.id, stockSubquery.productId))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(asc(products.createdAt)),
      this.db.select({ count: sql<number>`count(*)` }).from(products).where(whereClause),
      this.db
        .select({
          total: sql<number>`count(*)`,
          active: sql<number>`sum(case when ${products.isActive} = true then 1 else 0 end)`,
        })
        .from(products)
        .where(tenantCondition),
    ]);

    const productsWithCategory = data.map((row) => ({
      id: row.id,
      tenantId: row.tenantId,
      sku: row.sku,
      nama: row.nama,
      deskripsi: row.deskripsi,
      categoryId: row.categoryId,
      hargaBeli: row.hargaBeli,
      hargaJual: row.hargaJual,
      unit: row.unit,
      minStockLevel: row.minStockLevel,
      enableMinStock: row.enableMinStock,
      enableStockTracking: row.enableStockTracking,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      stock: row.stock,
      category: row.categoryIdRef
        ? {
            id: row.categoryIdRef,
            nama: row.categoryNama,
            deskripsi: row.categoryDeskripsi,
            isActive: row.categoryIsActive,
            createdAt: row.categoryCreatedAt,
            updatedAt: row.categoryUpdatedAt,
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
    const product = await this.db
      .select({ tenantId: products.tenantId })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product || product.length === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const hasAccess = await this.tenantAuth.canAccessTenant(user, product[0].tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this product');
    }

    const stockSubquery = this.db
      .select({
        productId: productStocks.productId,
        totalQuantity: sql<number>`COALESCE(SUM(${productStocks.quantity}), 0)`.as(
          'total_quantity',
        ),
      })
      .from(productStocks)
      .groupBy(productStocks.productId)
      .as('stock_totals');

    const result = await this.db
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
        stock: sql<number>`COALESCE(${stockSubquery.totalQuantity}, 0)::integer`,
        tenantIdRef: tenants.id,
        tenantNama: tenants.nama,
        tenantSlug: tenants.slug,
        tenantIsActive: tenants.isActive,
        tenantCreatedAt: tenants.createdAt,
        tenantUpdatedAt: tenants.updatedAt,
        categoryIdRef: categories.id,
        categoryNama: categories.nama,
        categoryDeskripsi: categories.deskripsi,
        categoryIsActive: categories.isActive,
        categoryCreatedAt: categories.createdAt,
        categoryUpdatedAt: categories.updatedAt,
      })
      .from(products)
      .leftJoin(tenants, eq(products.tenantId, tenants.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(stockSubquery, eq(products.id, stockSubquery.productId))
      .where(eq(products.id, id))
      .limit(1);

    const row = result[0];

    const discountRows = await this.db
      .select({
        id: discounts.id,
        nama: discounts.nama,
        rate: discounts.rate,
        scope: discounts.scope,
        level: discounts.level,
        isActive: discounts.isActive,
      })
      .from(discountProducts)
      .innerJoin(discounts, eq(discountProducts.discountId, discounts.id))
      .where(eq(discountProducts.productId, id));

    return {
      id: row.id,
      tenantId: row.tenantId,
      sku: row.sku,
      nama: row.nama,
      deskripsi: row.deskripsi,
      categoryId: row.categoryId,
      hargaBeli: row.hargaBeli,
      hargaJual: row.hargaJual,
      unit: row.unit,
      minStockLevel: row.minStockLevel,
      enableMinStock: row.enableMinStock,
      enableStockTracking: row.enableStockTracking,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      stock: row.stock,
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
      category: row.categoryIdRef
        ? {
            id: row.categoryIdRef,
            nama: row.categoryNama,
            deskripsi: row.categoryDeskripsi,
            isActive: row.categoryIsActive,
            createdAt: row.categoryCreatedAt,
            updatedAt: row.categoryUpdatedAt,
          }
        : null,
      discounts: discountRows,
    };
  }

  async create(data: CreateProductDto, user: CurrentUserWithRole): Promise<void> {
    await this.tenantAuth.validateTenantOperation(user, data.tenantId);

    if (data.categoryId) {
      const category = await this.db.query.categories.findFirst({
        where: eq(categories.id, data.categoryId),
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${data.categoryId} not found`);
      }

      if (category.tenantId !== data.tenantId) {
        throw new ForbiddenException('Category does not belong to this tenant');
      }
    }

    if (data.sku) {
      const existingSku = await this.db.query.products.findFirst({
        where: and(eq(products.sku, data.sku), eq(products.tenantId, data.tenantId)),
      });

      if (existingSku) {
        throw new ConflictException(`Product with SKU ${data.sku} already exists in this tenant`);
      }
    }

    await this.db.insert(products).values(data);
  }

  async update(id: string, data: UpdateProductDto, user: CurrentUserWithRole): Promise<void> {
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

      if (category.tenantId !== existingProduct.tenantId) {
        throw new ForbiddenException('Category does not belong to this tenant');
      }
    }

    await this.db
      .update(products)
      .set({
        ...productData,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    if (discountIds !== undefined) {
      await this.db.delete(discountProducts).where(eq(discountProducts.productId, id));

      if (discountIds.length > 0) {
        await this.db.insert(discountProducts).values(
          discountIds.map((discountId) => ({
            discountId,
            productId: id,
          })),
        );
      }
    }
  }

  async remove(id: string, user: CurrentUserWithRole): Promise<void> {
    await this.findById(id, user);

    await this.db
      .update(products)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));
  }
}
