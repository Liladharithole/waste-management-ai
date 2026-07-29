import 'dotenv/config';
import { PrismaClient } from '@prisma/client-central-core';
import { createMariaDbAdapter } from '../src/prisma/create-mariadb-adapter';

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

async function main() {
  console.log('🌱 Starting central core database seeding...');

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
