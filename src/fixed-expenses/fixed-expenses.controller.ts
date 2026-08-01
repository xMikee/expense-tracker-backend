import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { FixedExpensesService } from './fixed-expenses.service';
import { CreateFixedExpenseDto, UpdateFixedExpenseDto } from './dto/fixed-expense.dto';

@Controller('fixed-expenses')
export class FixedExpensesController {
  constructor(private readonly fixedExpensesService: FixedExpensesService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateFixedExpenseDto) {
    return this.fixedExpensesService.create(req.userId, dto);
  }

  @Get()
  findAll(@Req() req) {
    return this.fixedExpensesService.findAll(req.userId);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() dto: UpdateFixedExpenseDto) {
    return this.fixedExpensesService.update(req.userId, id, dto);
  }

  @Patch(':id/deactivate')
  deactivate(@Req() req, @Param('id') id: string) {
    return this.fixedExpensesService.deactivate(req.userId, id);
  }
}
