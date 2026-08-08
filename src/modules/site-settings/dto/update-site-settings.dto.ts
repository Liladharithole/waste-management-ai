import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateSiteSettingsDto {
  @ApiPropertyOptional({
    description: 'Custom High/Critical Priority Complaint SLA threshold in hours',
    example: 6,
    minimum: 1,
    maximum: 168,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(168)
  highPrioritySlaHours?: number;

  @ApiPropertyOptional({
    description: 'Custom Low/Medium Priority Complaint SLA threshold in hours',
    example: 12,
    minimum: 1,
    maximum: 336,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(336)
  lowPrioritySlaHours?: number;
}
