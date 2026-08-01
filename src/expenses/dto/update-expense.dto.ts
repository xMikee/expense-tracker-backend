import { IsEnum, IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';
import { ExpenseType } from '@prisma/client';

export class UpdateExpenseDto {
  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  subcategory?: string;

  @IsOptional()
  @IsEnum(ExpenseType)
  type?: ExpenseType;

  @IsOptional()
  @IsDateString()
  date?: string;
}
