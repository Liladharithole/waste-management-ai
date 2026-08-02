import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prismaCore: PrismaCentralCoreService) {}

  /**
   * Retrieves all permissions in the system.
   */
  async findAll() {
    return this.prismaCore.permission.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Creates a new permission.
   */
  async create(createPermissionDto: CreatePermissionDto) {
    const { name, description } = createPermissionDto;

    // Check if name is already in use
    const existing = await this.prismaCore.permission.findUnique({
      where: { name },
    });
    if (existing) {
      throw new ConflictException(`Permission '${name}' already exists.`);
    }

    return this.prismaCore.permission.create({
      data: {
        name,
        description,
      },
    });
  }

  /**
   * Deletes a permission from the database.
   */
  async delete(id: number) {
    const existing = await this.prismaCore.permission.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Permission with ID ${id} not found.`);
    }

    // Check if any roles are currently assigned to this permission
    const activeMappings = await this.prismaCore.rolePermission.findMany({
      where: { permissionId: id },
      include: {
        role: true,
      },
    });

    if (activeMappings.length > 0) {
      const assignedRoles = activeMappings.map((m) => m.role.name);
      throw new ConflictException(
        `Cannot delete permission because it is currently assigned to the following roles: ${assignedRoles.join(', ')}. Please revoke this permission from these roles first.`,
      );
    }

    return this.prismaCore.permission.delete({
      where: { id },
    });
  }

  /**
   * Maps a permission to a specific role.
   */
  async assign(assignPermissionDto: AssignPermissionDto) {
    const { roleId, permissionId } = assignPermissionDto;

    // 1. Verify Role exists
    const role = await this.prismaCore.role.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found.`);
    }

    // 2. Verify Permission exists
    const permission = await this.prismaCore.permission.findUnique({
      where: { id: permissionId },
    });
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${permissionId} not found.`);
    }

    // 3. Check for existing mapping
    const existingMapping = await this.prismaCore.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });
    if (existingMapping) {
      throw new ConflictException('This permission is already assigned to the specified role.');
    }

    // 4. Create mapping
    return this.prismaCore.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });
  }

  /**
   * Revokes a permission from a specific role.
   */
  async revoke(assignPermissionDto: AssignPermissionDto) {
    const { roleId, permissionId } = assignPermissionDto;

    const existingMapping = await this.prismaCore.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });
    if (!existingMapping) {
      throw new NotFoundException('Specified permission mapping not found for this role.');
    }

    return this.prismaCore.rolePermission.delete({
      where: {
        id: existingMapping.id,
      },
    });
  }
}
