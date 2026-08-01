import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { IncomesService } from './incomes.service';
import { CreateIncomeDto, UpdateIncomeDto } from './dto/income.dto';

@Controller('incomes')
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateIncomeDto) {
    return this.incomesService.create(req.userId, dto);
  }

  @Get()
  findAll(@Req() req, @Query('from') from?: string, @Query('to') to?: string) {
    return this.incomesService.findAll(
      req.userId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() dto: UpdateIncomeDto) {
    return this.incomesService.update(req.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Req() req, @Param('id') id: string) {
    return this.incomesService.remove(req.userId, id);
  }
}
