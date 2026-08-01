import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { ExpensesModule } from './expenses/expenses.module';
import { FixedExpensesModule } from './fixed-expenses/fixed-expenses.module';
import { IncomesModule } from './incomes/incomes.module';
import { BudgetModule } from './budget/budget.module';
import { TelegramModule } from './telegram/telegram.module';
import { LlmModule } from './llm/llm.module';
import { WebsocketModule } from './websocket/websocket.module';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports/reports.module';
import { AuthMiddleware } from './auth/auth.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(), // abilita i @Cron (es. generazione spese fisse)
    PrismaModule,
    LlmModule,
    WebsocketModule,
    ExpensesModule,
    FixedExpensesModule,
    IncomesModule,
    BudgetModule,
    TelegramModule,
    UsersModule,
    ReportsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude({ path: 'users', method: RequestMethod.POST })
      .forRoutes('*');
  }
}
