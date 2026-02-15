import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { eq, and, like, desc, sql, SQL } from 'drizzle-orm';
import { outlets } from '../db/schema';
import { tenants } from '../db/schema';
import { CreateOutletDto, UpdateOutletDto, OutletQueryDto } from './dto';
import { DB_CONNECTION } from '../db/db.module';
import type { DrizzleDB } from '../db/type';

@Injectable()
export class OutletsService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) {}

  async findAll(query: OutletQueryDto) {
    const { page = 1, limit = 10, search, isActive, tenantId } = query;
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [];

    if (isActive !== undefined) {
      conditions.push(eq(outlets.isActive, isActive));
    }

    if (tenantId) {
      conditions.push(eq(outlets.tenantId, tenantId));
    }

    if (search) {
      conditions.push(like(outlets.name, `%${search}%`));
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

  async findById(id: number) {
    const outlet = await this.db.query.outlets.findFirst({
      where: eq(outlets.id, id),
      with: {
        tenant: true,
      },
    });

    if (!outlet) {
      throw new NotFoundException(`Outlet with ID ${id} not found`);
    }

    return outlet;
  }

  async create(data: CreateOutletDto) {
    const tenantExists = await this.db.query.tenants.findFirst({
      where: eq(tenants.id, data.tenantId),
    });

    if (!tenantExists) {
      throw new NotFoundException(`Tenant with ID ${data.tenantId} not found`);
    }

    const existing = await this.db.query.outlets.findFirst({
      where: eq(outlets.kode, data.kode),
    });

    if (existing) {
      throw new ConflictException(
        `Outlet with kode ${data.kode} already exists`,
      );
    }

    const [outlet] = await this.db
      .insert(outlets)
      .values(data)
      .returning();

    return outlet;
  }

  async update(id: number, data: UpdateOutletDto) {
    const existingOutlet = await this.findById(id);

    if (data.kode && data.kode !== existingOutlet.kode) {
      const kodeExists = await this.db.query.outlets.findFirst({
        where: eq(outlets.kode, data.kode),
      });

      if (kodeExists) {
        throw new ConflictException(
          `Outlet with kode ${data.kode} already exists`,
        );
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

  async remove(id: number) {
    await this.findById(id);

    const [outlet] = await this.db
      .delete(outlets)
      .where(eq(outlets.id, id))
      .returning();

    return outlet;
  }
}
