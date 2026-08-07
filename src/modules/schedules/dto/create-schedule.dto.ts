import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScheduleFrequency } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class CreateScheduleDto {
  @ApiProperty({ example: 'Morning Organic Pickup', description: 'Schedule name or title' })
  @IsString()
  @IsNotEmpty({ message: 'Schedule name is required' })
  name!: string;

  @ApiProperty({
    example: 1,
    description: 'ID of the site (residential society / commercial complex)',
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty({ message: 'Site ID is required' })
  siteId!: number;

  @ApiPropertyOptional({ example: 3, description: 'Optional specific building/tower ID' })
  @IsOptional()
  @IsInt()
  @Min(1)
  buildingId?: number;

  @ApiPropertyOptional({ example: 10, description: 'Assigned driver/collector employee user ID' })
  @IsOptional()
  @IsInt()
  @Min(1)
  assignedEmployeeId?: number;

  @ApiProperty({ example: 1, description: 'ID of the waste category' })
  @IsInt()
  @Min(1)
  @IsNotEmpty({ message: 'Waste category ID is required' })
  wasteCategoryId!: number;

  @ApiPropertyOptional({
    enum: ScheduleFrequency,
    default: ScheduleFrequency.CUSTOM_DAYS,
    description: 'Recurrence frequency',
  })
  @IsEnum(ScheduleFrequency)
  @IsOptional()
  frequency?: ScheduleFrequency;

  @ApiProperty({
    example: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
    description: 'Days of week for collection',
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ message: 'Days of week are required' })
  daysOfWeek!: string[];

  @ApiProperty({ example: '07:00', description: 'Start time in HH:mm 24-hour format' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:mm 24-hour format (e.g. 07:00)',
  })
  @IsNotEmpty({ message: 'Start time is required' })
  startTime!: string;

  @ApiProperty({ example: '09:00', description: 'End time in HH:mm 24-hour format' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in HH:mm 24-hour format (e.g. 09:00)',
  })
  @IsNotEmpty({ message: 'End time is required' })
  endTime!: string;

  @ApiPropertyOptional({ example: true, default: true, description: 'Active toggle status' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
