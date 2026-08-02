import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaCore: PrismaCentralCoreService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registers a new user and assigns them the default GENERAL_USER role.
   */
  async register(registerDto: RegisterDto) {
    const { email, password, firstName, middleName, lastName } = registerDto;

    // 1. Check if user already exists
    const existingUser = await this.prismaCore.user.findFirst({
      where: { email, deletedAt: null },
    });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // 2. Fetch default role (GENERAL_USER)
    const defaultRole = await this.prismaCore.role.findUnique({
      where: { name: 'GENERAL_USER' },
    });
    if (!defaultRole) {
      throw new InternalServerErrorException('Default role GENERAL_USER not found');
    }

    // 3. Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Create user and role mapping in a database transaction
    const newUser = await this.prismaCore.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          middleName,
          lastName,
          status: 'ACTIVE',
          createdBy: 'SYSTEM',
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: defaultRole.id,
          createdBy: 'SYSTEM',
        },
      });

      return user;
    });

    // 5. Return user profile info without the password hash
    return {
      id: newUser.id,
      uuid: newUser.uuid,
      email: newUser.email,
      firstName: newUser.firstName,
      middleName: newUser.middleName,
      lastName: newUser.lastName,
      status: newUser.status,
      createdAt: newUser.createdAt,
    };
  }

  /**
   * Validates user credentials, logs the login attempt, and returns JWT tokens.
   */
  async login(loginDto: LoginDto, meta?: RequestMeta) {
    const { email, password } = loginDto;

    // 1. Find user by email including their roles
    const user = await this.prismaCore.user.findFirst({
      where: { email, deletedAt: null },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Verify password hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Get roles names
    const roles = user.userRoles.map((ur) => ur.role.name);

    // 4. Generate JWT payload
    const payload = {
      sub: user.id,
      uuid: user.uuid,
      email: user.email,
      roles,
    };

    // 5. Sign tokens
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: (process.env.JWT_ACCESS_EXPIRY || '1h') as any,
    });

    // Generate a secure random 64-character hex string for the refresh token
    const refreshTokenString = crypto.randomBytes(32).toString('hex');

    // 6. Persist refresh token details in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Default 7 days expiry

    await this.prismaCore.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenString,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        deviceName: loginDto.deviceName,
        expiresAt,
      },
    });

    // 7. Return tokens and profile response
    return {
      accessToken,
      refreshToken: refreshTokenString,
      user: {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
      },
    };
  }

  /**
   * Refreshes a user's session with a valid refresh token.
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    // 1. Look up the token in the database, including the user and their roles
    const storedToken = await this.prismaCore.refreshToken.findUnique({
      where: { token: refreshTokenDto.refreshToken },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    // 2. Validate token existence and active state
    if (!storedToken || storedToken.user.deletedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // 3. Extract user roles
    const roles = storedToken.user.userRoles.map((ur) => ur.role.name);

    // 4. Generate new Access Token payload
    const payload = {
      sub: storedToken.user.id,
      uuid: storedToken.user.uuid,
      email: storedToken.user.email,
      roles,
    };

    // 5. Sign new access token
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: (process.env.JWT_ACCESS_EXPIRY || '15m') as any,
    });

    // 6. Update last used timestamp in background
    await this.prismaCore.refreshToken.update({
      where: { id: storedToken.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      accessToken,
    };
  }

  /**
   * Logs a user out by revoking their refresh token.
   */
  async logout(logoutDto: LogoutDto) {
    const storedToken = await this.prismaCore.refreshToken.findUnique({
      where: { token: logoutDto.refreshToken },
    });

    if (storedToken) {
      // Set revokedAt timestamp to mark token as inactive
      await this.prismaCore.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
    }

    return {
      message: 'Logged out successfully',
    };
  }

  /**
   * Logs a user out from ALL active devices by revoking all their refresh tokens.
   */
  async logoutAll(userId: number) {
    await this.prismaCore.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      message: 'Logged out successfully from all devices',
    };
  }

  /**
   * Resets a user's password using a valid reset token (idempotent, stateless).
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    // 1. Decode the token statelessly to extract email
    const decoded: unknown = this.jwtService.decode(token);
    const decodedEmail =
      decoded && typeof decoded === 'object' && 'email' in decoded
        ? (decoded as { email: string }).email
        : null;
    if (!decodedEmail) {
      throw new BadRequestException('Invalid or malformed reset token');
    }

    // 2. Fetch the user by email
    const user = await this.prismaCore.user.findFirst({
      where: { email: decodedEmail, deletedAt: null },
    });
    if (!user) {
      throw new BadRequestException('Invalid or malformed reset token');
    }

    // 3. Verify the signature statelessly using the dynamic secret key
    const secret =
      (process.env.JWT_SECRET || 'super-secret-key-change-me-in-production') + user.passwordHash;
    try {
      this.jwtService.verify(token, { secret });
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // 4. Hash the new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // 5. Update user password and revoke all active refresh tokens in a transaction
    await this.prismaCore.$transaction([
      this.prismaCore.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
      }),
      this.prismaCore.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return {
      message: 'Password has been reset successfully. All active sessions have been logged out.',
    };
  }

  /**
   * Updates an authenticated user's password after verifying their old password.
   */
  async updatePassword(userId: number, updatePasswordDto: UpdatePasswordDto) {
    const { oldPassword, newPassword } = updatePasswordDto;

    // 1. Fetch user by ID
    const user = await this.prismaCore.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 2. Verify current password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Incorrect current password');
    }

    // 3. Hash the new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // 4. Update password and revoke refresh tokens in a transaction
    await this.prismaCore.$transaction([
      this.prismaCore.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
      }),
      this.prismaCore.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return {
      message: 'Password updated successfully. All active sessions have been logged out.',
    };
  }

  /**
   * Generates a stateless reset token and emails it to the user.
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // 1. Fetch user by email
    const user = await this.prismaCore.user.findFirst({
      where: { email, deletedAt: null },
    });

    // Security Best Practice: If user doesn't exist, return success anyway to prevent email harvesting
    if (!user) {
      return {
        message: 'If the email address exists in our system, a password reset link has been sent.',
      };
    }

    // 2. Generate a short-lived token signed with a secret combined with the password hash (expires in 1 hour)
    const secret =
      (process.env.JWT_SECRET || 'super-secret-key-change-me-in-production') + user.passwordHash;
    const resetToken = this.jwtService.sign(
      { email: user.email },
      {
        secret,
        expiresIn: '1h',
      },
    );

    // 3. Construct reset link
    const frontendUrl = process.env.CORS_ORIGIN;
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    // 4. Send Email using Nodemailer
    const mailSent = await this.sendResetEmail(user.email, user.firstName, resetLink);

    return {
      message: 'If the email address exists in our system, a password reset link has been sent.',
      // Temporarily return token in dev environment for easy testing without SMTP set up
      ...(process.env.NODE_ENV !== 'production' && {
        _debugToken: resetToken,
        _debugLink: resetLink,
        _emailStatus: mailSent ? 'sent' : 'mocked (logged to console)',
      }),
    };
  }

  /**
   * Helper to send emails via Nodemailer.
   */
  private async sendResetEmail(email: string, name: string, resetLink: string): Promise<boolean> {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || '"Waste Management AI" <noreply@wastemanagement.com>';

    // If SMTP is not fully configured, log to console as fallback
    if (!host || !user || !pass) {
      console.warn(
        '⚠️ SMTP credentials not fully configured in .env. Logging password reset link to console:',
      );
      console.log(`--------------------------------------------------`);
      console.log(`To: ${email}`);
      console.log(`Hello ${name},`);
      console.log(`You requested a password reset. Click below to reset:`);
      console.log(resetLink);
      console.log(`--------------------------------------------------`);
      return false;
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });

      await transporter.sendMail({
        from,
        to: email,
        subject: 'Reset Your Password - Waste Management AI',
        html: `
          <h3>Hello ${name},</h3>
          <p>We received a request to reset your password. Click the link below to set a new password:</p>
          <a href="${resetLink}" target="_blank">Reset Password</a>
          <br/><br/>
          <p>This link will expire in 1 hour. If you did not request this, you can ignore this email.</p>
        `,
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to send password reset email via Nodemailer:', error);
      return false;
    }
  }
}
