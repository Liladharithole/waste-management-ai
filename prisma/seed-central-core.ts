import 'dotenv/config';
import { PrismaClient } from '@prisma/client-central-core';
import { createMariaDbAdapter } from '../src/prisma/create-mariadb-adapter';
import { PERMISSIONS } from './permissions';

const databaseUrl = process.env.CENTRAL_CORE_DATABASE_URL;
if (!databaseUrl) {
  throw new Error('CENTRAL_CORE_DATABASE_URL is not set');
}

const adapter = createMariaDbAdapter(databaseUrl);
const prisma = new PrismaClient({ adapter });

const ROLES = [
  { name: 'SUPER_ADMIN', description: 'Super Admin with system-wide access' },
  {
    name: 'ORGANIZATION_ADMIN',
    description: 'Administrator for a specific organization or tenant',
  },
  {
    name: 'ORGANIZATION_MANAGER',
    description: 'Logistics and operations manager for an organization',
  },
  { name: 'WORKER_COLLECTOR', description: 'Field workers responsible for collecting waste' },
  {
    name: 'RESIDENT',
    description: 'Citizen or residential account using waste management services',
  },
  { name: 'DRIVER', description: 'Waste collection truck and vehicle drivers' },
  { name: 'SUPERVISOR', description: 'Route and staff supervisor' },
  { name: 'SUB_SUPERVISOR', description: 'Assistant supervisor for field operations' },
  { name: 'VENDOR', description: 'Third-party waste processing or equipment vendors' },
  { name: 'GOVERNMENT', description: 'Municipal and government oversight accounts' },
  { name: 'GENERAL_USER', description: 'General/standard application users' },
];

/**
 * Seeds user roles into the database (idempotent).
 */
async function seedRoles(): Promise<void> {
  console.log('👥 Seeding roles...');
  for (const role of ROLES) {
    const upserted = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: {
        name: role.name,
        description: role.description,
        createdBy: 'SYSTEM',
      },
    });
    console.log(`✔️ Upserted role: ${upserted.name}`);
  }
}

/**
 * Seeds fine-grained system permissions into the database (idempotent).
 */
async function seedPermissions(): Promise<void> {
  console.log('🔒 Seeding permissions...');
  for (const perm of PERMISSIONS) {
    const upserted = await prisma.permission.upsert({
      where: { uuid: perm.uuid },
      update: {
        name: perm.name,
        description: perm.description,
      },
      create: {
        uuid: perm.uuid,
        name: perm.name,
        description: perm.description,
        createdBy: 'SYSTEM',
      },
    });
    console.log(`✔️ Upserted permission: ${upserted.name}`);
  }
}

/**
 * Dynamically maps all available permissions to the SUPER_ADMIN role (idempotent).
 */
async function seedSuperAdminPermissions(): Promise<void> {
  console.log('🔑 Assigning all permissions to SUPER_ADMIN role...');

  // 1. Fetch SUPER_ADMIN role
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'SUPER_ADMIN' },
  });
  if (!superAdminRole) {
    throw new Error('SUPER_ADMIN role not found in database');
  }

  // 2. Fetch all permissions dynamically
  const allPermissions = await prisma.permission.findMany();

  // 3. Map each permission to the role in junction table
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      },
      update: {}, // No updates needed if mapping already exists
      create: {
        roleId: superAdminRole.id,
        permissionId: perm.id,
        createdBy: 'SYSTEM',
      },
    });
  }

  console.log(
    `✔️ Successfully mapped all ${allPermissions.length} permissions to SUPER_ADMIN role.`,
  );
}

async function main() {
  console.log('🌱 Starting central core database seeding...');

  await seedRoles();
  await seedPermissions();
  await seedSuperAdminPermissions();

  console.log('🏁 Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding central core database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
