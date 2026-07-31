import { IsEnum, IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';
import { ExpenseType } from '@prisma/client';

export class CreateExpenseDto {
  @IsNumber()
  amount: number;

  @IsString()
  description: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  subcategory?: string;

  @IsEnum(ExpenseType)
  type: ExpenseType;

  @IsOptional()
  @IsString()
  source?: string; // default "manual"

  @IsOptional()
  @IsDateString()
  date?: string; // default now
}
