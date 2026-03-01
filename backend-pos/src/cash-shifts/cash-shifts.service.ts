import type { CurrentUserType } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { user } from '@/db/schema/auth-schema';
import { cashShifts } from '@/db/schema/cash-shift-schema';
import { orders } from '@/db/schema/order-schema';
import { outlets } from '@/db/schema/outlet-schema';
import { tenants } from '@/db/schema/tenant-schema';
import type { DrizzleDB } from '@/db/type';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SQL, and, desc, eq, like, sql } from 'drizzle-orm';
import { CashShiftQueryDto, CreateCashShiftDto, UpdateCashShiftDto } from './dto';

@Injectable()
export class CashShiftsService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) {}

  async findAll(query: CashShiftQueryDto) {
    const { page = 1, limit = 10, search, status, tenantId, outletId } = query;
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [];

    if (status) {
      conditions.push(eq(cashShifts.status, status));
    }

    if (tenantId) {
      conditions.push(eq(cashShifts.tenantId, tenantId));
    }

    if (outletId) {
      conditions.push(eq(cashShifts.outletId, outletId));
    }

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(cashShifts)
        .leftJoin(outlets, eq(cashShifts.outletId, outlets.id))
        .leftJoin(user, eq(cashShifts.cashierId, user.id))
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

  async findById(id: string, user: CurrentUserType) {
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

    if (user.role === 'owner' || user.role === 'cashier') {
      const userTenants = await this.db.query.tenants.findMany({
        where: eq(tenants.userId, user.id),
      });
      const userTenantIds = userTenants.map((t) => t.id);
      if (userTenantIds.length > 0 && !userTenantIds.includes(cashShift.tenantId)) {
        throw new ForbiddenException('You do not have access to this cash shift');
      }
    }

    return cashShift;
  }

  async findOpenShift(outletId: string, user: CurrentUserType) {
    const cashShift = await this.db.query.cashShifts.findFirst({
      where: and(eq(cashShifts.outletId, outletId), eq(cashShifts.status, 'buka')),
      with: {
        outlet: true,
        cashier: true,
      },
    });

    return cashShift || null;
  }

  async create(data: CreateCashShiftDto, user: CurrentUserType) {
    if (user.role === 'owner') {
      const userTenants = await this.db.query.tenants.findMany({
        where: eq(tenants.userId, user.id),
      });
      const userTenantIds = userTenants.map((t) => t.id);
      if (!userTenantIds.includes(data.tenantId)) {
        throw new ForbiddenException(
          'You do not have permission to create cash shifts in this tenant',
        );
      }
    }

    if (user.role === 'cashier' && user.outletId) {
      const userOutlet = await this.db.query.outlets.findFirst({
        where: eq(outlets.id, user.outletId),
      });
      if (!userOutlet || userOutlet.tenantId !== data.tenantId) {
        throw new ForbiddenException(
          'You do not have permission to create cash shifts in this tenant',
        );
      }
    }

    const tenant = await this.db.query.tenants.findFirst({
      where: eq(tenants.id, data.tenantId),
    });

    const outlet = await this.db.query.outlets.findFirst({
      where: eq(outlets.id, data.outletId),
    });

    if (!tenant || !outlet) {
      throw new NotFoundException('Tenant or Outlet not found');
    }

    const openShift = await this.db.query.cashShifts.findFirst({
      where: and(eq(cashShifts.outletId, data.outletId), eq(cashShifts.status, 'buka')),
    });

    if (openShift) {
      throw new ForbiddenException('There is already an open cash shift for this outlet');
    }

    const [cashShift] = await this.db
      .insert(cashShifts)
      .values({
        ...data,
        cashierId: user.id,
        jumlahTutup: '0',
        jumlahExpected: '0',
        selisih: '0',
      })
      .returning();

    return cashShift;
  }

  async update(id: string, data: UpdateCashShiftDto, user: CurrentUserType) {
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

  async remove(id: string, user: CurrentUserType) {
    const existingCashShift = await this.findById(id, user);

    if (existingCashShift.status === 'buka') {
      throw new ForbiddenException('Cannot delete an open cash shift');
    }

    const [cashShift] = await this.db.delete(cashShifts).where(eq(cashShifts.id, id)).returning();

    return cashShift;
  }
}
