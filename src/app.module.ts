import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { ExpensesModule } from './expenses/expenses.module';
import { FixedExpensesModule } from './fixed-expenses/fixed-expenses.module';
import { BudgetModule } from './budget/budget.module';
import { TelegramModule } from './telegram/telegram.module';
import { LlmModule } from './llm/llm.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(), // abilita i @Cron (es. generazione spese fisse)
    PrismaModule,
    LlmModule,
    WebsocketModule,
    ExpensesModule,
    FixedExpensesModule,
    BudgetModule,
    TelegramModule,
  ],
})
export class AppModule {}
