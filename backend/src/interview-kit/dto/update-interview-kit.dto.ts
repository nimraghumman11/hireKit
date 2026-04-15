import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ScorecardItemDto {
  competency: string;
  weight: number;
  score: number;
  notes: string;
}

export class UpdateInterviewKitDto {
  @ApiPropertyOptional({ type: [ScorecardItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScorecardItemDto)
  scorecard?: ScorecardItemDto[];
}

export class UpdateScorecardDto {
  @ApiPropertyOptional({ type: [ScorecardItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScorecardItemDto)
  scorecard: ScorecardItemDto[];
}
