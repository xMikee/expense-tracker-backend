import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface SetAllocationDto {
  month: string; // "2026-08-01"
  fixedPct: number;
  variablePct: number;
  investPct: number;
  taxPct: number;
  liquidityPct: number;
}

@Injectable()
export class BudgetService {
  constructor(private readonly prisma: PrismaService) {}

  async setAllocation(userId: string, dto: SetAllocationDto) {
    const total = dto.fixedPct + dto.variablePct + dto.investPct + dto.taxPct + dto.liquidityPct;
    if (Math.round(total) !== 100) {
      throw new BadRequestException(`Le percentuali devono sommare a 100 (attuale: ${total})`);
    }

    const monthStart = new Date(dto.month);
    monthStart.setDate(1);

    return this.prisma.budgetAllocation.upsert({
      where: { userId_month: { userId, month: monthStart } },
      update: { ...dto, month: monthStart },
      create: { userId, ...dto, month: monthStart },
    });
  }

  async getAllocation(userId: string, month: Date) {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    return this.prisma.budgetAllocation.findUnique({
      where: { userId_month: { userId, month: monthStart } },
    });
  }
}
