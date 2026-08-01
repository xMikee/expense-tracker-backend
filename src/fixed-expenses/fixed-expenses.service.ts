import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ExpensesService } from '../expenses/expenses.service';
import { CreateFixedExpenseDto, UpdateFixedExpenseDto } from './dto/fixed-expense.dto';
import { ExpenseType } from '@prisma/client';

@Injectable()
export class FixedExpensesService {
  private readonly logger = new Logger(FixedExpensesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly expensesService: ExpensesService,
  ) {}

  create(userId: string, dto: CreateFixedExpenseDto) {
    return this.prisma.fixedExpense.create({
      data: {
        userId,
        name: dto.name,
        amount: dto.amount,
        category: dto.category,
        subcategory: dto.subcategory,
        dayOfMonth: dto.dayOfMonth,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        notes: dto.notes,
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.fixedExpense.findMany({
      where: { userId },
      orderBy: { dayOfMonth: 'asc' },
    });
  }

  async update(userId: string, id: string, dto: UpdateFixedExpenseDto) {
    const result = await this.prisma.fixedExpense.updateMany({
      where: { id, userId },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
    if (result.count === 0) {
      throw new NotFoundException('Spesa fissa non trovata');
    }
    return this.prisma.fixedExpense.findFirstOrThrow({ where: { id, userId } });
  }

  /** Stoppa una spesa fissa senza cancellarne lo storico */
  async deactivate(userId: string, id: string) {
    const result = await this.prisma.fixedExpense.updateMany({
      where: { id, userId },
      data: { active: false, endDate: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundException('Spesa fissa non trovata');
    }
    return this.prisma.fixedExpense.findFirstOrThrow({ where: { id, userId } });
  }

  async remove(userId: string, id: string) {
    const result = await this.prisma.fixedExpense.deleteMany({ where: { id, userId } });
    if (result.count === 0) {
      throw new NotFoundException('Spesa fissa non trovata');
    }
  }

  /**
   * Cron giornaliero: per ogni spesa fissa attiva il cui dayOfMonth coincide
   * con oggi, genera automaticamente la Expense corrispondente (se non già creata).
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async generateDueFixedExpenses() {
    const today = new Date();
    const dayOfMonth = today.getDate();

    const dueFixedExpenses = await this.prisma.fixedExpense.findMany({
      where: {
        active: true,
        dayOfMonth,
        startDate: { lte: today },
        OR: [{ endDate: null }, { endDate: { gte: today } }],
      },
    });

    for (const fixed of dueFixedExpenses) {
      // evita doppioni se il cron gira più volte lo stesso giorno
      const alreadyGenerated = await this.prisma.expense.findFirst({
        where: {
          fixedExpenseId: fixed.id,
          date: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
          },
        },
      });
      if (alreadyGenerated) continue;

      await this.expensesService.create(fixed.userId, {
        amount: Number(fixed.amount),
        description: fixed.name,
        category: fixed.category,
        subcategory: fixed.subcategory ?? undefined,
        type: ExpenseType.FIXED,
        source: 'auto-fixed',
      });

      this.logger.log(`Generata spesa fissa "${fixed.name}" per utente ${fixed.userId}`);
    }
  }
}
