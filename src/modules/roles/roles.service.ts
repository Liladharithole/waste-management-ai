import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prismaCore: PrismaCentralCoreService) {}

  /**
   * Lists all roles in the system.
   */
  async findAll() {
    return this.prismaCore.role.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Creates a new role.
   */
  async create(createRoleDto: CreateRoleDto) {
    const name = createRoleDto.name.toUpperCase();
    const { description } = createRoleDto;

    // Check if name is unique
    const existing = await this.prismaCore.role.findUnique({
      where: { name },
    });
    if (existing) {
      throw new ConflictException(`Role '${name}' already exists.`);
    }

    return this.prismaCore.role.create({
      data: {
        name,
        description,
      },
    });
  }

  /**
   * Updates an existing role definition.
   */
  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const existing = await this.prismaCore.role.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Role with ID ${id} not found.`);
    }

    const data: any = {};
    if (updateRoleDto.description !== undefined) {
      data.description = updateRoleDto.description;
    }

    if (updateRoleDto.name) {
      const name = updateRoleDto.name.toUpperCase();
      if (name !== existing.name) {
        const conflict = await this.prismaCore.role.findUnique({
          where: { name },
        });
        if (conflict) {
          throw new ConflictException(`Role '${name}' already exists.`);
        }
        data.name = name;
      }
    }

    return this.prismaCore.role.update({
      where: { id },
      data,
    });
  }

  /**
   * Deletes a role with active user assignment protection.
   */
  async delete(id: number) {
    const existing = await this.prismaCore.role.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Role with ID ${id} not found.`);
    }

    // Safety check: verify no users are currently assigned to this role
    const activeMappings = await this.prismaCore.userRole.findMany({
      where: { roleId: id },
      include: {
        user: true,
      },
    });

    if (activeMappings.length > 0) {
      const assignedUsers = activeMappings.map((m) => m.user.email);
      throw new ConflictException(
        `Cannot delete role because it is currently assigned to the following users: ${assignedUsers.join(', ')}. Please revoke this role from these users first.`,
      );
    }

    return this.prismaCore.role.delete({
      where: { id },
    });
  }

  /**
   * Assigns a role to a user.
   */
  async assign(assignRoleDto: AssignRoleDto) {
    const { userId, roleId } = assignRoleDto;

    // 1. Verify User exists
    const user = await this.prismaCore.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    // 2. Verify Role exists
    const role = await this.prismaCore.role.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found.`);
    }

    // 3. Check for existing mapping
    const existingMapping = await this.prismaCore.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });
    if (existingMapping) {
      throw new ConflictException('This role is already assigned to the specified user.');
    }

    // 4. Create mapping
    return this.prismaCore.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
  }

  /**
   * Revokes a role from a user.
   */
  async revoke(assignRoleDto: AssignRoleDto) {
    const { userId, roleId } = assignRoleDto;

    const existingMapping = await this.prismaCore.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });
    if (!existingMapping) {
      throw new NotFoundException('Specified role assignment not found for this user.');
    }

    return this.prismaCore.userRole.delete({
      where: {
        id: existingMapping.id,
      },
    });
  }
}
