import {
  IsString,
  IsNumber,
  IsEnum,
  IsNotEmpty,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { SUBJECT_TYPES } from '../assignment.schema';

export class CreateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  instructions: string;

  @IsEnum(SUBJECT_TYPES)
  subject: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  wordLimit?: number;

  @IsEnum(['strict', 'loose'])
  markingMode: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  totalMarks: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  passingMarks: number;
}