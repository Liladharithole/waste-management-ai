import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ComplaintStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { CreateComplaintDto } from './create-complaint.dto';

export class UpdateComplaintDto extends PartialType(CreateComplaintDto) {
  @ApiPropertyOptional({ example: 10, description: 'Assigned employee/worker user ID' })
  @IsOptional()
  @IsInt()
  @Min(1)
  assignedEmployeeId?: number;

  @ApiPropertyOptional({ enum: ComplaintStatus, description: 'Updated complaint status' })
  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @ApiPropertyOptional({
    example: 'Collector re-visited unit and cleared waste bin',
    description: 'Notes explaining resolution',
  })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;

  @ApiPropertyOptional({
    example: 'https://storage.example.com/resolutions/res-01.jpg',
    description: 'Resolution photo proof',
  })
  @IsOptional()
  @IsString()
  resolutionPhotoUrl?: string;
}
