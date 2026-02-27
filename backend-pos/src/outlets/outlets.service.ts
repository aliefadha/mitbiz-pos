import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { eq, and, like, desc, sql, SQL } from 'drizzle-orm';
import { outlets } from '@/db/schema';
import { tenants } from '@/db/schema';
import { CreateOutletDto, UpdateOutletDto, OutletQueryDto } from './dto';
import { DB_CONNECTION } from '@/db/db.module';
import type { DrizzleDB } from '@/db/type';
import type { CurrentUserType } from '@/common/decorators/current-user.decorator';

@Injectable()
export class OutletsService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) {}

  async findAll(query: OutletQueryDto, user: CurrentUserType) {
    const { page = 1, limit = 10, search, isActive, tenantId } = query;
    const offset = (page - 1) * limit;

    let effectiveTenantId = tenantId;
    if (!effectiveTenantId && (user.role === 'owner' || user.role === 'cashier')) {
      const userTenant = await this.db.query.tenants.findFirst({
        where: eq(tenants.userId, user.id),
      });
      if (userTenant) {
        effectiveTenantId = userTenant.id;
      }
    }

    const conditions: SQL<unknown>[] = [];

    if (isActive !== undefined) {
      conditions.push(eq(outlets.isActive, isActive));
    }

    if (effectiveTenantId) {
      conditions.push(eq(outlets.tenantId, effectiveTenantId));
    }

    if (search) {
      conditions.push(like(outlets.nama, `%${search}%`));
    }

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(outlets)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(outlets.createdAt)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(outlets)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
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

  async findById(id: string, user: CurrentUserType) {
    const outlet = await this.db.query.outlets.findFirst({
      where: eq(outlets.id, id),
      with: {
        tenant: true,
      },
    });

    if (!outlet) {
      throw new NotFoundException(`Outlet with ID ${id} not found`);
    }

    // Check ownership for owner/cashier
    if (user.role === 'owner' || user.role === 'cashier') {
      const userTenant = await this.db.query.tenants.findFirst({
        where: eq(tenants.userId, user.id),
      });
      if (userTenant && outlet.tenantId !== userTenant.id) {
        throw new ForbiddenException('You do not have access to this outlet');
      }
    }

    return outlet;
  }

  async create(data: CreateOutletDto, user: CurrentUserType) {
    // Verify tenant exists and user has access
    const tenant = await this.db.query.tenants.findFirst({
      where: eq(tenants.id, data.tenantId),
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${data.tenantId} not found`);
    }

    // Check ownership for owner
    if (user.role === 'owner' && tenant.userId !== user.id) {
      throw new ForbiddenException('You do not have permission to create outlets in this tenant');
    }

    const existing = await this.db.query.outlets.findFirst({
      where: eq(outlets.kode, data.kode),
    });

    if (existing) {
      throw new ConflictException(`Outlet with kode ${data.kode} already exists`);
    }

    const [outlet] = await this.db.insert(outlets).values(data).returning();

    return outlet;
  }

  async update(id: string, data: UpdateOutletDto, user: CurrentUserType) {
    const existingOutlet = await this.findById(id, user);

    // Verify ownership again
    if (user.role === 'owner') {
      const userTenant = await this.db.query.tenants.findFirst({
        where: eq(tenants.userId, user.id),
      });
      if (userTenant && existingOutlet.tenantId !== userTenant.id) {
        throw new ForbiddenException('You do not have permission to update this outlet');
      }
    }

    if (data.kode && data.kode !== existingOutlet.kode) {
      const kodeExists = await this.db.query.outlets.findFirst({
        where: eq(outlets.kode, data.kode),
      });

      if (kodeExists) {
        throw new ConflictException(`Outlet with kode ${data.kode} already exists`);
      }
    }

    const [outlet] = await this.db
      .update(outlets)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(outlets.id, id))
      .returning();

    return outlet;
  }

  async remove(id: string, user: CurrentUserType) {
    const outlet = await this.findById(id, user);

    // Verify ownership
    if (user.role === 'owner') {
      const userTenant = await this.db.query.tenants.findFirst({
        where: eq(tenants.userId, user.id),
      });
      if (userTenant && outlet.tenantId !== userTenant.id) {
        throw new ForbiddenException('You do not have permission to delete this outlet');
      }
    }

    const [deletedOutlet] = await this.db.delete(outlets).where(eq(outlets.id, id)).returning();

    return deletedOutlet;
  }
}
