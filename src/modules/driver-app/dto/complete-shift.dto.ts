import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CompleteShiftDto {
  @ApiProperty({ example: 45285, description: 'Final ending odometer reading in kilometers' })
  @IsInt()
  @Min(0)
  endOdometerKm!: number;

  @ApiPropertyOptional({
    example: 'Shift completed successfully with 15 stops',
    description: 'Driver shift summary notes',
  })
  @IsOptional()
  @IsString()
  shiftNotes?: string;
}
