import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { LlmModule } from '../llm/llm.module';
import { ExpensesModule } from '../expenses/expenses.module';

@Module({
  imports: [LlmModule, ExpensesModule],
  providers: [TelegramService],
})
export class TelegramModule {}
