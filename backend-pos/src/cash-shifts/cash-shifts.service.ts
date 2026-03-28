import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { user as userTable } from '@/db/schema/auth-schema';
import { cashShifts } from '@/db/schema/cash-shift-schema';
import { orders } from '@/db/schema/order-schema';
import { outlets } from '@/db/schema/outlet-schema';
import type { DrizzleDB } from '@/db/type';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SQL, and, desc, eq, inArray, like, sql } from 'drizzle-orm';
import { CashShiftQueryDto, CreateCashShiftDto, UpdateCashShiftDto } from './dto';

@Injectable()
export class CashShiftsService {
  constructor(
    @Inject(DB_CONNECTION) private db: DrizzleDB,
    private readonly tenantAuth: TenantAuthService,
  ) {}

  async findAll(query: CashShiftQueryDto, user: CurrentUserWithRole) {
    const { page = 1, limit = 10, search, status, tenantId, outletId, cashierId } = query;
    const offset = (page - 1) * limit;

    // Validate that query tenantId matches user's allowed tenant
    if (tenantId) {
      await this.tenantAuth.validateQueryTenantId(user, tenantId);
    }

    // Get effective tenant ID for the user (for filtering if no tenantId provided)
    const effectiveTenantId = await this.tenantAuth.getEffectiveTenantId(user);

    const conditions: SQL<unknown>[] = [];

    if (status) {
      conditions.push(eq(cashShifts.status, status));
    }

    // Use query tenantId if provided, otherwise use effective tenant (for non-global roles)
    const filterTenantId = tenantId || effectiveTenantId;
    if (filterTenantId) {
      conditions.push(eq(cashShifts.tenantId, filterTenantId));
    }

    if (outletId) {
      conditions.push(eq(cashShifts.outletId, outletId));
    }

    if (cashierId) {
      conditions.push(eq(cashShifts.cashierId, cashierId));
    }

    // If user has outletId assigned, automatically filter to show only their shifts
    if (user.outletId && !cashierId) {
      conditions.push(eq(cashShifts.cashierId, user.id));
    }

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(cashShifts)
        .leftJoin(outlets, eq(cashShifts.outletId, outlets.id))
        .leftJoin(userTable, eq(cashShifts.cashierId, userTable.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(cashShifts.createdAt)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(cashShifts)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
    ]);

    const cashShiftsWithOutlet = data.map((row) => ({
      ...row.cash_shifts,
      outlet: row.outlets
        ? {
            id: row.outlets.id,
            nama: row.outlets.nama,
            alamat: row.outlets.alamat,
            isActive: row.outlets.isActive,
            createdAt: row.outlets.createdAt,
            updatedAt: row.outlets.updatedAt,
          }
        : null,
      cashier: row.user
        ? {
            id: row.user.id,
            name: row.user.name,
            email: row.user.email,
          }
        : null,
    }));

    const total = Number(totalResult[0]?.count || 0);

    return {
      data: cashShiftsWithOutlet,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, user: CurrentUserWithRole) {
    const cashShift = await this.db.query.cashShifts.findFirst({
      where: eq(cashShifts.id, id),
      with: {
        outlet: true,
        cashier: true,
      },
    });

    if (!cashShift) {
      throw new NotFoundException(`Cash Shift with ID ${id} not found`);
    }

    // Check tenant access (permission already checked by guard)
    const hasAccess = await this.tenantAuth.canAccessTenant(user, cashShift.tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this cash shift');
    }

    return cashShift;
  }

  async findOpenShift(outletId: string, user: CurrentUserWithRole) {
    // Check if user has access to this outlet's tenant
    const outlet = await this.db.query.outlets.findFirst({
      where: eq(outlets.id, outletId),
    });

    if (!outlet) {
      throw new NotFoundException(`Outlet with ID ${outletId} not found`);
    }

    const hasAccess = await this.tenantAuth.canAccessTenant(user, outlet.tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this outlet');
    }

    const cashShift = await this.db.query.cashShifts.findFirst({
      where: and(eq(cashShifts.outletId, outletId), eq(cashShifts.status, 'buka')),
      with: {
        outlet: true,
        cashier: true,
      },
    });

    return cashShift || null;
  }

  async findMyOpenShift(user: CurrentUserWithRole) {
    const cashShift = await this.db
      .select({
        id: cashShifts.id,
        tenantId: cashShifts.tenantId,
        outletId: cashShifts.outletId,
        cashierId: cashShifts.cashierId,
        jumlahBuka: cashShifts.jumlahBuka,
        jumlahTutup: cashShifts.jumlahTutup,
        jumlahExpected: cashShifts.jumlahExpected,
        selisih: cashShifts.selisih,
        status: cashShifts.status,
        openedAt: cashShifts.openedAt,
        closedAt: cashShifts.closedAt,
        catatan: cashShifts.catatan,
        createdAt: cashShifts.createdAt,
        updatedAt: cashShifts.updatedAt,
        outlet: {
          id: outlets.id,
          nama: outlets.nama,
        },
      })
      .from(cashShifts)
      .leftJoin(outlets, eq(cashShifts.outletId, outlets.id))
      .where(and(eq(cashShifts.cashierId, user.id), eq(cashShifts.status, 'buka')))
      .limit(1);

    if (!cashShift.length) {
      return null;
    }

    const shift = cashShift[0];

    return shift;
  }

  async findCashiersStatus(cashierIds: string[], user: CurrentUserWithRole) {
    if (!cashierIds.length) return [];

    const effectiveTenantId = await this.tenantAuth.getEffectiveTenantId(user);
    if (!effectiveTenantId) return [];

    // If user has outletId assigned, only return their own shift status
    const targetCashierIds = user.outletId ? [user.id] : cashierIds;

    const openShifts = await this.db
      .select({
        id: cashShifts.id,
        cashierId: cashShifts.cashierId,
        status: cashShifts.status,
        outletId: cashShifts.outletId,
        jumlahBuka: cashShifts.jumlahBuka,
        openedAt: cashShifts.openedAt,
        outletName: outlets.nama,
      })
      .from(cashShifts)
      .leftJoin(outlets, eq(cashShifts.outletId, outlets.id))
      .where(
        and(
          eq(cashShifts.tenantId, effectiveTenantId),
          eq(cashShifts.status, 'buka'),
          inArray(cashShifts.cashierId, targetCashierIds),
        ),
      );

    return openShifts;
  }

  async findCashiersForCurrentUser(user: CurrentUserWithRole) {
    const effectiveTenantId = await this.tenantAuth.getEffectiveTenantId(user);
    if (!effectiveTenantId) return [];

    const users = await this.db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        emailVerified: userTable.emailVerified,
        image: userTable.image,
        createdAt: userTable.createdAt,
        updatedAt: userTable.updatedAt,
        roleId: userTable.roleId,
        outletId: userTable.outletId,
      })
      .from(userTable)
      .where(eq(userTable.tenantId, effectiveTenantId));

    if (user.outletId) {
      return users.filter((u) => u.id === user.id);
    }

    return users;
  }

  async create(data: CreateCashShiftDto, user: CurrentUserWithRole) {
    // Validate tenant access for creating cash shift
    await this.tenantAuth.validateTenantOperation(user, data.tenantId);

    // Verify outlet belongs to the same tenant
    const outlet = await this.db.query.outlets.findFirst({
      where: eq(outlets.id, data.outletId),
    });

    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }

    if (outlet.tenantId !== data.tenantId) {
      throw new ForbiddenException('Outlet does not belong to the specified tenant');
    }

    const openShift = await this.db.query.cashShifts.findFirst({
      where: and(
        eq(cashShifts.outletId, data.outletId),
        eq(cashShifts.cashierId, data.cashierId || user.id),
        eq(cashShifts.status, 'buka'),
      ),
    });

    if (openShift) {
      throw new ForbiddenException(
        'There is already an open cash shift for this user at this outlet',
      );
    }

    const [cashShift] = await this.db
      .insert(cashShifts)
      .values({
        ...data,
        cashierId: data.cashierId || user.id,
        jumlahTutup: '0',
        jumlahExpected: '0',
        selisih: '0',
      })
      .returning();

    return cashShift;
  }

  async update(id: string, data: UpdateCashShiftDto, user: CurrentUserWithRole) {
    // findById already validates tenant access
    const existingCashShift = await this.findById(id, user);

    if (existingCashShift.status === 'tutup') {
      throw new ForbiddenException('Cannot update a closed cash shift');
    }

    if (data.status === 'tutup') {
      const orderTotals = await this.db
        .select({ total: sql<string>`sum(${orders.total})` })
        .from(orders)
        .where(and(eq(orders.cashShiftId, id), eq(orders.status, 'complete')));

      const totalSales = orderTotals[0]?.total || '0';
      const openingAmount = parseFloat(existingCashShift.jumlahBuka || '0');
      const expectedAmount = openingAmount + parseFloat(totalSales);
      const closingAmount = data.jumlahTutup ? parseFloat(data.jumlahTutup) : 0;
      const selisih = closingAmount - expectedAmount;

      const [cashShift] = await this.db
        .update(cashShifts)
        .set({
          ...data,
          jumlahExpected: expectedAmount.toString(),
          selisih: selisih.toString(),
          closedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(cashShifts.id, id))
        .returning();

      return cashShift;
    }

    const [cashShift] = await this.db
      .update(cashShifts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(cashShifts.id, id))
      .returning();

    return cashShift;
  }

  async remove(id: string, user: CurrentUserWithRole) {
    // findById already validates tenant access
    const existingCashShift = await this.findById(id, user);

    if (existingCashShift.status === 'buka') {
      throw new ForbiddenException('Cannot delete an open cash shift');
    }

    const [cashShift] = await this.db.delete(cashShifts).where(eq(cashShifts.id, id)).returning();

    return cashShift;
  }
}
