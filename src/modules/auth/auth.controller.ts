import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import * as express from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully and default role GENERAL_USER assigned.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input payload validation failed.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict: Email address is already in use.',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.prismaFriendlyRegister(registerDto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password credentials' })
  @ApiResponse({
    status: 200,
    description:
      'Successfully authenticated. Returns access token, refresh token, and user profile information.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Invalid email or password.',
  })
  async login(@Body() loginDto: LoginDto, @Req() req: express.Request) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(loginDto, { ipAddress, userAgent });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh active user session using refresh token' })
  @ApiResponse({
    status: 200,
    description: 'New access token and refresh token generated successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Refresh token expired or invalid.',
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke refresh token and end active session' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged out and session revoked.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Refresh token invalid.',
  })
  async logout(@Body() logoutDto: LogoutDto) {
    return this.authService.logout(logoutDto);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out from all active devices.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Missing or invalid token.',
  })
  async logoutAll(@CurrentUser() user: { sub: number }) {
    return this.authService.logoutAll(user.sub);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using a valid reset token' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful. All active sessions revoked.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: Invalid or expired reset token.',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('update-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update password for an authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Password updated successfully. All active sessions revoked.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: Incorrect current password.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Missing or invalid token.',
  })
  async updatePassword(@CurrentUser() user: any, @Body() updatePasswordDto: UpdatePasswordDto) {
    return this.authService.updatePassword(user.sub, updatePasswordDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({
    status: 200,
    description:
      'Success message returned regardless of whether the email exists (prevent harvesting).',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: Invalid email parameter.',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  private async prismaFriendlyRegister(registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}
