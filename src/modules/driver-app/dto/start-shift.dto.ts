import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class StartShiftDto {
  @ApiProperty({ example: 45210, description: 'Starting odometer reading in kilometers' })
  @IsInt()
  @Min(0)
  startOdometerKm!: number;

  @ApiPropertyOptional({ example: true, description: 'Vehicle safety inspection passed boolean' })
  @IsOptional()
  @IsBoolean()
  vehicleSafetyCheckPassed?: boolean;

  @ApiPropertyOptional({
    example: 'Brakes and tire pressure verified ok',
    description: 'Inspection notes',
  })
  @IsOptional()
  @IsString()
  inspectionNotes?: string;
}
