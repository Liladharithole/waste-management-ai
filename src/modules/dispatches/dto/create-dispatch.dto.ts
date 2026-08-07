import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateDispatchDto {
  @ApiProperty({ example: 1, description: 'Pickup Route Schedule ID (WasteSchedule)' })
  @IsInt()
  @Min(1)
  scheduleId!: number;

  @ApiProperty({ example: 1, description: 'Assigned Fleet Vehicle ID (WasteVehicle)' })
  @IsInt()
  @Min(1)
  vehicleId!: number;

  @ApiProperty({ example: 5, description: 'Assigned Primary Driver Employee ID' })
  @IsInt()
  @Min(1)
  driverEmployeeId!: number;

  @ApiPropertyOptional({ example: 8, description: 'Assigned Helper Employee ID (Optional)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  helperEmployeeId?: number;

  @ApiProperty({ example: '2026-08-08', description: 'Shift Date (YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty()
  dispatchDate!: string;

  @ApiPropertyOptional({ example: 'MORNING', description: 'Shift Name (MORNING, EVENING, NIGHT)' })
  @IsOptional()
  @IsString()
  shiftName?: string;

  @ApiPropertyOptional({
    example: 'Morning pickup route for Zone A',
    description: 'Dispatch remarks',
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}
