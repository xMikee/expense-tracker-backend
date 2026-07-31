import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExpenseGateway } from '../websocket/expense.gateway';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseType } from '@prisma/client';
import { monthStartUTC, monthEndUTC } from '../common/date.util';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: ExpenseGateway,
  ) {}

  async create(userId: string, dto: CreateExpenseDto) {
    const expense = await this.prisma.expense.create({
      data: {
        userId,
        amount: dto.amount,
        description: dto.description,
        category: dto.category,
        subcategory: dto.subcategory,
        type: dto.type,
        source: dto.source ?? 'manual',
        date: dto.date ? new Date(dto.date) : new Date(),
      },
    });

    // notifica la dashboard in tempo reale
    this.gateway.emitNewExpense(expense);
    const summary = await this.getMonthSummary(userId, new Date());
    this.gateway.emitBudgetUpdate(summary);

    return expense;
  }

  async findAll(userId: string, from?: Date, to?: Date) {
    return this.prisma.expense.findMany({
      where: {
        userId,
        date: { gte: from, lte: to },
      },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Riepilogo del mese: totale entrate, budget allocato, spese reali,
   * scostamento per categoria e liquidità/investimento residuo.
   */
  async getMonthSummary(userId: string, referenceDate: Date) {
    const monthStart = monthStartUTC(referenceDate);
    const monthEnd = monthEndUTC(referenceDate);

    const [incomes, expenses, allocation] = await Promise.all([
      this.prisma.income.findMany({
        where: { userId, date: { gte: monthStart, lte: monthEnd } },
      }),
      this.prisma.expense.findMany({
        where: { userId, date: { gte: monthStart, lte: monthEnd } },
      }),
      this.prisma.budgetAllocation.findUnique({
        where: { userId_month: { userId, month: monthStart } },
      }),
    ]);

    const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);

    const spentFixed = expenses
      .filter((e) => e.type === ExpenseType.FIXED)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const spentVariable = expenses
      .filter((e) => e.type === ExpenseType.VARIABLE)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // se non esiste ancora un'allocazione per il mese, usa i default
    const alloc = allocation ?? {
      fixedPct: 30,
      variablePct: 20,
      investPct: 15,
      taxPct: 20,
      liquidityPct: 15,
    };

    const budget = {
      fixed: (totalIncome * alloc.fixedPct) / 100,
      variable: (totalIncome * alloc.variablePct) / 100,
      invest: (totalIncome * alloc.investPct) / 100,
      tax: (totalIncome * alloc.taxPct) / 100,
      liquidity: (totalIncome * alloc.liquidityPct) / 100,
    };

    return {
      month: monthStart,
      totalIncome,
      allocation: alloc,
      budget,
      actual: {
        fixed: spentFixed,
        variable: spentVariable,
      },
      delta: {
        fixed: budget.fixed - spentFixed, // positivo = sotto budget
        variable: budget.variable - spentVariable,
      },
      // quanto resta davvero libero da allocare a investimenti/liquidità
      // dopo aver tolto le spese reali (non solo quelle di budget)
      availableAfterSpending: totalIncome - spentFixed - spentVariable - budget.tax,
    };
  }

  async byCategoryBreakdown(userId: string, from: Date, to: Date) {
    const expenses = await this.prisma.expense.findMany({
      where: { userId, date: { gte: from, lte: to } },
    });

    const breakdown: Record<string, number> = {};
    for (const e of expenses) {
      breakdown[e.category] = (breakdown[e.category] ?? 0) + Number(e.amount);
    }
    return breakdown;
  }
}
