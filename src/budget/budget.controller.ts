import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { BudgetService } from './budget.service';

@Controller('budget')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post('allocation')
  setAllocation(@Req() req, @Body() dto: any) {
    return this.budgetService.setAllocation(req.userId, dto);
  }

  @Get('allocation')
  getAllocation(@Req() req, @Query('month') month: string) {
    return this.budgetService.getAllocation(req.userId, new Date(month));
  }
}
