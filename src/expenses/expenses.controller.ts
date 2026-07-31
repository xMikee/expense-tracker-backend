import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

// NOTA: per ora userId è preso da un header/finto auth: da collegare
// a un vero sistema di autenticazione quando passerai multi-utente.
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(req.userId, dto);
  }

  @Get()
  findAll(@Req() req, @Query('from') from?: string, @Query('to') to?: string) {
    return this.expensesService.findAll(
      req.userId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('summary')
  getSummary(@Req() req, @Query('date') date?: string) {
    return this.expensesService.getMonthSummary(req.userId, date ? new Date(date) : new Date());
  }

  @Get('breakdown')
  getBreakdown(@Req() req, @Query('from') from: string, @Query('to') to: string) {
    return this.expensesService.byCategoryBreakdown(req.userId, new Date(from), new Date(to));
  }
}
