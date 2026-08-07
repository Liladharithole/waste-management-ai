import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResidentPortalService } from './resident-portal.service';
import { FileResidentComplaintDto } from './dto/file-resident-complaint.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Resident Self-Service Portal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('resident-portal')
export class ResidentPortalController {
  constructor(private readonly residentPortalService: ResidentPortalService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get authenticated resident profile & property address details' })
  async getProfile(@CurrentUser('id') userId: number) {
    return await this.residentPortalService.getMyResidentProfile(userId);
  }

  @Get('collections')
  @ApiOperation({ summary: 'Get paginated waste pickup history for resident unit' })
  async getCollections(
    @CurrentUser('id') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.residentPortalService.getMyCollectionHistory(
      userId,
      Number(page),
      Number(limit),
    );
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get paginated monthly waste billing invoices for resident unit' })
  async getInvoices(
    @CurrentUser('id') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.residentPortalService.getMyInvoices(userId, Number(page), Number(limit));
  }

  @Post('complaints')
  @ApiOperation({ summary: 'Resident files a new waste complaint with optional photo proof' })
  @ApiResponse({ status: 201, description: 'Complaint submitted successfully.' })
  async fileComplaint(
    @CurrentUser('id') userId: number,
    @CurrentUser('email') email: string,
    @Body() dto: FileResidentComplaintDto,
  ) {
    return await this.residentPortalService.fileComplaint(userId, dto, email);
  }

  @Get('complaints')
  @ApiOperation({ summary: 'Get list of past complaints filed by resident' })
  async getComplaints(
    @CurrentUser('id') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.residentPortalService.getMyComplaints(userId, Number(page), Number(limit));
  }
}
