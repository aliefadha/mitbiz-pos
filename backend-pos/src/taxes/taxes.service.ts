import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { eq, and, like, desc, sql, SQL, or } from 'drizzle-orm';
import { taxes } from '../db/schema/tax-schema';
import { tenants } from '../db/schema/tenant-schema';
import { CreateTaxDto, UpdateTaxDto, TaxQueryDto } from './dto';
import { DB_CONNECTION } from '../db/db.module';
import type { DrizzleDB } from '../db/type';
import type { CurrentUserType } from '../common/decorators/current-user.decorator';

@Injectable()
export class TaxesService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) {}

  async findAll(query: TaxQueryDto) {
    const { page = 1, limit = 10, search, isActive, tenantId } = query;
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [];

    if (isActive !== undefined) {
      conditions.push(eq(taxes.isActive, isActive));
    }

    if (tenantId) {
      conditions.push(eq(taxes.tenantId, tenantId));
    }

    if (search) {
      conditions.push(like(taxes.nama, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(taxes)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(taxes.createdAt)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(taxes)
        .where(whereClause),
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

  async findActiveForOutlet(tenantId: string, outletId: string) {
    const data = await this.db
      .select()
      .from(taxes)
      .where(
        and(
          eq(taxes.tenantId, tenantId),
          eq(taxes.isActive, true),
          or(eq(taxes.isGlobal, true), eq(taxes.outletId, outletId)),
        ),
      );

    return {
      data,
      meta: { total: data.length },
    };
  }

  async findById(id: string, user: CurrentUserType) {
    const tax = await this.db.query.taxes.findFirst({
      where: eq(taxes.id, id),
      with: {
        tenant: true,
      },
    });

    if (!tax) {
      throw new NotFoundException(`Tax with ID ${id} not found`);
    }

    if (user.role === 'owner' || user.role === 'cashier') {
      const userTenants = await this.db.query.tenants.findMany({
        where: eq(tenants.userId, user.id),
      });
      const userTenantIds = userTenants.map((t) => t.id);
      if (userTenantIds.length > 0 && !userTenantIds.includes(tax.tenantId)) {
        throw new ForbiddenException('You do not have access to this tax');
      }
    }

    return tax;
  }

  async create(data: CreateTaxDto, user: CurrentUserType) {
    const tenant = await this.db.query.tenants.findFirst({
      where: eq(tenants.id, data.tenantId),
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${data.tenantId} not found`);
    }

    if (user.role === 'owner' && tenant.userId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to create taxes in this tenant',
      );
    }

    const [tax] = await this.db.insert(taxes).values(data).returning();

    return tax;
  }

  async update(id: string, data: UpdateTaxDto, user: CurrentUserType) {
    const existingTax = await this.findById(id, user);

    if (user.role === 'owner') {
      const userTenants = await this.db.query.tenants.findMany({
        where: eq(tenants.userId, user.id),
      });
      const userTenantIds = userTenants.map((t) => t.id);
      if (
        userTenantIds.length > 0 &&
        !userTenantIds.includes(existingTax.tenantId)
      ) {
        throw new ForbiddenException(
          'You do not have permission to update this tax',
        );
      }
    }

    const [tax] = await this.db
      .update(taxes)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(taxes.id, id))
      .returning();

    return tax;
  }

  async remove(id: string, user: CurrentUserType) {
    const tax = await this.findById(id, user);

    if (user.role === 'owner') {
      const userTenants = await this.db.query.tenants.findMany({
        where: eq(tenants.userId, user.id),
      });
      const userTenantIds = userTenants.map((t) => t.id);
      if (userTenantIds.length > 0 && !userTenantIds.includes(tax.tenantId)) {
        throw new ForbiddenException(
          'You do not have permission to delete this tax',
        );
      }
    }

    const [deletedTax] = await this.db
      .delete(taxes)
      .where(eq(taxes.id, id))
      .returning();

    return deletedTax;
  }
}
