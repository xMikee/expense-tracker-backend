import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncomeDto, UpdateIncomeDto } from './dto/income.dto';

@Injectable()
export class IncomesService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateIncomeDto) {
    return this.prisma.income.create({
      data: {
        userId,
        source: dto.source,
        amount: dto.amount,
        recurring: dto.recurring ?? false,
        date: dto.date ? new Date(dto.date) : new Date(),
      },
    });
  }

  findAll(userId: string, from?: Date, to?: Date) {
    return this.prisma.income.findMany({
      where: {
        userId,
        date: { gte: from, lte: to },
      },
      orderBy: { date: 'desc' },
    });
  }

  async update(userId: string, id: string, dto: UpdateIncomeDto) {
    const result = await this.prisma.income.updateMany({
      where: { id, userId },
      data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
    });
    if (result.count === 0) {
      throw new NotFoundException('Entrata non trovata');
    }
    return this.prisma.income.findFirstOrThrow({ where: { id, userId } });
  }

  async remove(userId: string, id: string) {
    const result = await this.prisma.income.deleteMany({ where: { id, userId } });
    if (result.count === 0) {
      throw new NotFoundException('Entrata non trovata');
    }
  }
}
