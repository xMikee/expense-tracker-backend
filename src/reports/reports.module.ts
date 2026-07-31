import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ExpensesModule } from '../expenses/expenses.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [ExpensesModule, TelegramModule],
  providers: [ReportsService],
})
export class ReportsModule {}
