import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ExpensesService } from '../expenses/expenses.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly expensesService: ExpensesService,
    private readonly telegramService: TelegramService,
  ) {}

  /**
   * Alle 7:00 del giorno 1 di ogni mese, invia via Telegram il riepilogo
   * budget vs reale del mese appena concluso a ogni utente collegato.
   */
  @Cron('0 7 1 * *')
  async sendMonthlyReports() {
    const now = new Date();
    const previousMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    await this.sendReportsFor(previousMonth);
  }

  async sendReportsFor(referenceDate: Date) {
    const users = await this.prisma.user.findMany({ where: { telegramChatId: { not: null } } });

    for (const user of users) {
      const summary = await this.expensesService.getMonthSummary(user.id, referenceDate);
      const message = this.formatReport(referenceDate, summary);
      await this.telegramService.sendMessage(user.telegramChatId as string, message);
      this.logger.log(`Report mensile inviato a ${user.email}`);
    }
  }

  private formatReport(month: Date, summary: Awaited<ReturnType<ExpensesService['getMonthSummary']>>) {
    const monthLabel = month.toLocaleDateString('it-IT', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    return [
      `📊 Riepilogo ${monthLabel}`,
      '',
      `Entrate totali: €${summary.totalIncome.toFixed(2)}`,
      `Spese fisse: €${summary.actual.fixed.toFixed(2)} (budget €${summary.budget.fixed.toFixed(2)}, delta €${summary.delta.fixed.toFixed(2)})`,
      `Spese variabili: €${summary.actual.variable.toFixed(2)} (budget €${summary.budget.variable.toFixed(2)}, delta €${summary.delta.variable.toFixed(2)})`,
      `Disponibile dopo le spese: €${summary.availableAfterSpending.toFixed(2)}`,
    ].join('\n');
  }
}
