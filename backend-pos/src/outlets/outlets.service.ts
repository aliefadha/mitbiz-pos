import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { outlets } from '@/db/schema';
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
import { SQL, and, desc, eq, ilike, sql } from 'drizzle-orm';
import { CreateOutletDto, OutletQueryDto, UpdateOutletDto } from './dto';

@Injectable()
export class OutletsService {
  constructor(
    @Inject(DB_CONNECTION) private db: DrizzleDB,
    private readonly tenantAuth: TenantAuthService,
  ) {}

  async findAll(query: OutletQueryDto, user: CurrentUserWithRole) {
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
      conditions.push(eq(outlets.isActive, isActive));
    }

    // Use query tenantId if provided, otherwise use effective tenant (for non-global roles)
    const filterTenantId = tenantId || effectiveTenantId;
    if (filterTenantId) {
      conditions.push(eq(outlets.tenantId, filterTenantId));
    }

    if (search) {
      conditions.push(ilike(outlets.nama, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const tenantCondition = filterTenantId ? eq(outlets.tenantId, filterTenantId) : undefined;

    const [data, totalResult, statsResult] = await Promise.all([
      this.db
        .select({
          id: outlets.id,
          tenantId: outlets.tenantId,
          nama: outlets.nama,
          kode: outlets.kode,
          alamat: outlets.alamat,
          noHp: outlets.noHp,
          isActive: outlets.isActive,
          createdAt: outlets.createdAt,
          updatedAt: outlets.updatedAt,
        })
        .from(outlets)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(outlets.createdAt)),
      this.db.select({ count: sql<number>`count(*)` }).from(outlets).where(whereClause),
      this.db
        .select({
          total: sql<number>`count(*)`,
          active: sql<number>`sum(case when ${outlets.isActive} = true then 1 else 0 end)`,
          inactive: sql<number>`sum(case when ${outlets.isActive} = false then 1 else 0 end)`,
        })
        .from(outlets)
        .where(tenantCondition),
    ]);

    const total = Number(totalResult[0]?.count || 0);
    const totalOutlet = Number(statsResult[0]?.total || 0);
    const outletAktif = Number(statsResult[0]?.active || 0);
    const outletNonaktif = Number(statsResult[0]?.inactive || 0);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        totalOutlet,
        outletAktif,
        outletNonaktif,
      },
    };
  }

  async findById(id: string, user: CurrentUserWithRole) {
    // Simple existence check first
    const outlet = await this.db
      .select({ tenantId: outlets.tenantId })
      .from(outlets)
      .where(eq(outlets.id, id))
      .limit(1);

    if (!outlet || outlet.length === 0) {
      throw new NotFoundException(`Outlet with ID ${id} not found`);
    }

    // Check tenant access (permission already checked by guard)
    const hasAccess = await this.tenantAuth.canAccessTenant(user, outlet[0].tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this outlet');
    }

    // Enriched query with joins
    const result = await this.db
      .select({
        id: outlets.id,
        tenantId: outlets.tenantId,
        nama: outlets.nama,
        kode: outlets.kode,
        alamat: outlets.alamat,
        noHp: outlets.noHp,
        isActive: outlets.isActive,
        createdAt: outlets.createdAt,
        updatedAt: outlets.updatedAt,
        tenantIdRef: tenants.id,
        tenantNama: tenants.nama,
        tenantSlug: tenants.slug,
        tenantIsActive: tenants.isActive,
        tenantCreatedAt: tenants.createdAt,
        tenantUpdatedAt: tenants.updatedAt,
      })
      .from(outlets)
      .leftJoin(tenants, eq(outlets.tenantId, tenants.id))
      .where(eq(outlets.id, id))
      .limit(1);

    const row = result[0];

    return {
      id: row.id,
      tenantId: row.tenantId,
      nama: row.nama,
      kode: row.kode,
      alamat: row.alamat,
      noHp: row.noHp,
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
    };
  }

  async create(data: CreateOutletDto, user: CurrentUserWithRole): Promise<void> {
    // Validate tenant access (permission already checked by guard)
    await this.tenantAuth.validateTenantOperation(user, data.tenantId);

    data.kode = data.kode.toUpperCase();

    const kodeExists = await this.db.query.outlets.findFirst({
      where: and(eq(outlets.kode, data.kode), eq(outlets.tenantId, data.tenantId)),
    });

    if (kodeExists) {
      throw new ConflictException(`Outlet with kode ${data.kode} already exists`);
    }

    await this.db.insert(outlets).values(data);
  }

  async update(id: string, data: UpdateOutletDto, user: CurrentUserWithRole): Promise<void> {
    // findById already validates tenant access
    const existingOutlet = await this.findById(id, user);

    if (data.kode) {
      data.kode = data.kode.toUpperCase();
    }

    if (data.kode && data.kode !== existingOutlet.kode) {
      const kodeExists = await this.db.query.outlets.findFirst({
        where: and(
          eq(outlets.kode, data.kode.toUpperCase()),
          eq(outlets.tenantId, existingOutlet.tenantId),
        ),
      });

      if (kodeExists) {
        throw new ConflictException(`Outlet with kode ${data.kode} already exists`);
      }
    }

    await this.db
      .update(outlets)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(outlets.id, id));
  }

  async remove(id: string, user: CurrentUserWithRole): Promise<void> {
    await this.findById(id, user);

    await this.db
      .update(outlets)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(outlets.id, id));
  }
}
