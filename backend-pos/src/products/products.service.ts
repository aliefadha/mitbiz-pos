import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { eq, and, like, desc, sql, SQL } from 'drizzle-orm';
import { products } from '@/db/schema/product-schema';
import { tenants } from '@/db/schema/tenant-schema';
import { outlets } from '@/db/schema/outlet-schema';
import { categories } from '@/db/schema/category-schema';
import { productStocks } from '@/db/schema/stock-schema';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto';
import { DB_CONNECTION } from '@/db/db.module';
import type { DrizzleDB } from '@/db/type';
import type { CurrentUserType } from '@/common/decorators/current-user.decorator';

@Injectable()
export class ProductsService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) {}

  async findAll(query: ProductQueryDto) {
    const { page = 1, limit = 10, search, isActive, tenantId, categoryId, tipe, outletId } = query;
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
      const tipeValue = tipe;
      conditions.push(eq(products.tipe, tipeValue));
    }

    if (search) {
      conditions.push(like(products.nama, `%${search}%`));
    }

    const stockCondition = outletId ? eq(productStocks.outletId, outletId) : undefined;

    const [data, totalResult] = await Promise.all([
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

    return {
      data: productsWithCategory,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, user: CurrentUserType) {
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

    // Check ownership for owner/cashier
    if (user.role === 'owner' || user.role === 'cashier') {
      const userTenants = await this.db.query.tenants.findMany({
        where: eq(tenants.userId, user.id),
      });
      const userTenantIds = userTenants.map((t) => t.id);
      if (userTenantIds.length > 0 && !userTenantIds.includes(product.tenantId)) {
        throw new ForbiddenException('You do not have access to this product');
      }
    }

    return product;
  }

  async create(data: CreateProductDto, user: CurrentUserType) {
    // Verify tenant exists and user has access
    const tenant = await this.db.query.tenants.findFirst({
      where: eq(tenants.id, data.tenantId),
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${data.tenantId} not found`);
    }

    // Check ownership for owner
    if (user.role === 'owner' && tenant.userId !== user.id) {
      throw new ForbiddenException('You do not have permission to create products in this tenant');
    }

    // Check access for cashier
    if (user.role === 'cashier') {
      const userOutlet = await this.db.query.outlets.findFirst({
        where: eq(outlets.id, user.outletId!),
      });
      if (!userOutlet || userOutlet.tenantId !== data.tenantId) {
        throw new ForbiddenException(
          'You do not have permission to create products in this tenant',
        );
      }
    }

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

  async update(id: string, data: UpdateProductDto, user: CurrentUserType) {
    const existingProduct = await this.findById(id, user);

    if (data.sku && data.sku !== existingProduct.sku) {
      const skuExists = await this.db.query.products.findFirst({
        where: eq(products.sku, data.sku),
      });

      if (skuExists) {
        throw new ConflictException(`Product with SKU ${data.sku} already exists`);
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
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    return product;
  }

  async remove(id: string, user: CurrentUserType) {
    await this.findById(id, user);

    const [product] = await this.db.delete(products).where(eq(products.id, id)).returning();

    return product;
  }
}
