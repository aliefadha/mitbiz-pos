import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { eq, and, like, desc, sql, SQL, or, ilike, count } from 'drizzle-orm';
import { tenants } from '../db/schema';
import { user } from '../db/schema';
import { outlets } from '../db/schema/outlet-schema';
import { categories } from '../db/schema/category-schema';
import { products } from '../db/schema/product-schema';
import { CreateTenantDto, UpdateTenantDto, TenantQueryDto } from './dto';
import { DB_CONNECTION } from '../db/db.module';
import type { DrizzleDB } from '../db/type';

@Injectable()
export class TenantsService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) {}

  async findAll(query: TenantQueryDto) {
    const { page = 1, limit = 10, search, isActive, userId } = query;
    const offset = (page - 1) * limit;

    const whereClause = and(
      isActive !== undefined ? eq(tenants.isActive, isActive) : undefined,
      userId ? eq(tenants.userId, userId) : undefined,
      search ? like(tenants.nama, `%${search}%`) : undefined,
    );

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(tenants)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(tenants.createdAt)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(tenants)
        .where(whereClause),
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

  async findBySlug(slug: string) {
    const tenant = await this.db.query.tenants.findFirst({
      where: eq(tenants.slug, slug),
      with: {
        user: true,
        outlets: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant tidak ditemukan`);
    }

    return tenant;
  }

  async create(data: CreateTenantDto) {
    if (data.userId) {
      const userExists = await this.db.query.user.findFirst({
        where: eq(user.id, data.userId),
      });

      if (!userExists) {
        throw new NotFoundException(`User tidak ditemukan`);
      }
    }

    const slugExists = await this.db.query.tenants.findFirst({
      where: eq(tenants.slug, data.slug),
    });

    if (slugExists) {
      throw new ConflictException(
        `Nama tenant sudah digunakan`,
      );
    }

    const nameExists = await this.db.query.tenants.findFirst({
      where: or(
        ilike(tenants.nama, data.nama),
        eq(tenants.nama, data.nama),
      ),
    });

    if (nameExists) {
      throw new ConflictException(
        `Nama tenant sudah digunakan`,
      );
    }

    const [tenant] = await this.db
      .insert(tenants)
      .values({
        ...data,
        settings: data.settings || {
          currency: 'IDR',
          timezone: 'Asia/Jakarta',
          taxRate: 0,
        },
      })
      .returning();

    return tenant;
  }

  async update(slug: string, data: UpdateTenantDto) {
    const existingTenant = await this.findBySlug(slug);

    if (data.slug && data.slug !== slug) {
      const slugExists = await this.db.query.tenants.findFirst({
        where: eq(tenants.slug, data.slug),
      });

      if (slugExists) {
        throw new ConflictException(
          `Nama tenant sudah digunakan`,
        );
      }
    }

    if (data.nama && data.nama !== existingTenant.nama) {
      const nameExists = await this.db.query.tenants.findFirst({
        where: or(
          ilike(tenants.nama, data.nama),
          eq(tenants.nama, data.nama),
        ),
      });

      if (nameExists) {
        throw new ConflictException(
          `Nama tenant sudah digunakan`,
        );
      }
    }

    const [tenant] = await this.db
      .update(tenants)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(tenants.slug, slug))
      .returning();

    return tenant;
  }

  async remove(slug: string) {
    await this.findBySlug(slug);

    const [tenant] = await this.db
      .delete(tenants)
      .where(eq(tenants.slug, slug))
      .returning();

    return tenant;
  }

  async getSummary(slug: string) {
    const tenant = await this.db.query.tenants.findFirst({
      where: eq(tenants.slug, slug),
      with: {
        user: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant tidak ditemukan`);
    }

    const [outletsResult, categoriesResult, productsResult] = await Promise.all([
      this.db.select({ count: count() }).from(outlets).where(eq(outlets.tenantId, tenant.id)),
      this.db.select({ count: count() }).from(categories).where(eq(categories.tenantId, tenant.id)),
      this.db.select({ count: count() }).from(products).where(eq(products.tenantId, tenant.id)),
    ]);

    return {
      outletsCount: Number(outletsResult[0]?.count || 0),
      categoriesCount: Number(categoriesResult[0]?.count || 0),
      productsCount: Number(productsResult[0]?.count || 0),
      user: tenant.user,
    };
  }
}
