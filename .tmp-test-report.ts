import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ReportsService } from './src/reports/reports.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const reportsService = app.get(ReportsService);
  await reportsService.sendReportsFor(new Date());
  await app.close();
}
run();
