import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateIncomeDto {
  @IsString()
  source: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsDateString()
  date?: string; // default now

  @IsOptional()
  @IsBoolean()
  recurring?: boolean; // default false
}

export class UpdateIncomeDto {
  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsBoolean()
  recurring?: boolean;
}
