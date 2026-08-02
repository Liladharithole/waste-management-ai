import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaCentralCoreService } from '../../../prisma-central-core/prisma-central-core.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prismaCore: PrismaCentralCoreService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Get required permissions from metadata
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // If no permissions are specified, allow access
    }

    // 2. Get user info from request (must run AFTER JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      return false;
    }

    // 3. Bypass checks if user is SUPER_ADMIN
    if (user.roles?.includes('SUPER_ADMIN')) {
      return true;
    }

    // 4. Query DB to check if user has any role mapping containing the required permissions
    const hasPermission = await this.prismaCore.rolePermission.findFirst({
      where: {
        role: {
          userRoles: {
            some: { userId: user.sub },
          },
        },
        permission: {
          name: { in: requiredPermissions },
        },
      },
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have the required permissions to perform this action',
      );
    }

    return true;
  }
}
