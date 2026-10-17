import { seedCtlStatus } from './ctl-status.seeder.js';
import { seedCtlCountry } from './ctl-country.seeder.js';
import { seedCtlGeographicDivisionType } from './ctl-geographic-division-type.seeder.js';
import { seedCtlGeographicDivision } from './ctl-geographic-division.seeder.js';
import { seedCtlMaritalStatus } from './ctl-marital-status.seeder.js';
import { seedCtlGender } from './ctl-gender.seeder.js';
import { seedCtlDocumentType } from './ctl-document-type.seeder.js';
import { seedMntPeople } from './mnt-people.seeder.js';
import { seedCtlProviderStorage } from './ctl-provider-storage.seeder.js';
import { seedMntuser } from './mnt-user.seeder.js';
import { seedCtlCategoryPermissions } from './ctl-category-permissions.seeder.js';
import { seedCtlPermissions } from './ctl-permissions.seeder.js';
import { seedMntRol } from './mnt-rol.seeder.js';
import { seedRolPermissions } from './rol-permissions.seeder.js';
import { seedMntUserRol } from './mnt-user-rol.seeder.js';
import { seedMntRoute } from './mnt-route.seeder.js';
import { seedMntRoutePermissions } from './mnt-route-permissions.seeder.js';
import { seedMntAddress } from './mnt-address.seeder.js';
import { PrismaClient } from 'generated/prisma/client.js';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedCategoryStatus } from './ctl-category-status.seeder.js';

let connectionString = '';
if (process.env.NODE_ENV === 'production') {
  connectionString = process.env.DATABASE_DIRECT_URL!;
} else {
  connectionString = `${process.env.DB_PROVIDER}://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?schema=public`;
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const mainSeeder = async () => {
  console.log('Starting main seeder...');

  console.log('Database connected.');
  try {
    // Truncate all tables in reverse order of dependencies
    console.log('Truncating all tables...');
    const tables = [
      'mnt_address',
      'mnt_route_permissions',
      'mnt_route',
      'mnt_user_rol',
      'rol_permissions',
      'mnt_role',
      'ctl_permissions',
      'ctl_category_permissions',
      'mnt_session_refresh_token',
      'mnt_storage_files',
      'ctl_provider_storage',
      'mnt_email_verification_tokens',
      'mnt_user',
      'mnt_document',
      'mnt_people',
      'people_country',
      'ctl_document_type',
      'ctl_gender',
      'ctl_marital_status',
      'ctl_geographic_division',
      'ctl_geographic_division_type',
      'ctl_country',
      'ctl_status',
      'ctl_category_status',
    ];

    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`,
        );
      } catch (e: unknown) {
        console.log(`Failed to truncate ${table}, skipping...`, e);
      }
    }

    console.log('Seeding categories...');
    await seedCategoryStatus(prisma);
    console.log('Seeding statuses...');
    await seedCtlStatus(prisma);
    console.log('Seeding countries...');
    await seedCtlCountry(prisma);
    console.log('Seeding geographic division types...');
    await seedCtlGeographicDivisionType(prisma);
    console.log('Seeding geographic divisions...');
    await seedCtlGeographicDivision(prisma);
    console.log('Seeding marital statuses...');
    await seedCtlMaritalStatus(prisma);
    console.log('Seeding genders...');
    await seedCtlGender(prisma);
    console.log('Seeding document types...');
    await seedCtlDocumentType(prisma);
    console.log('Seeding people...');
    await seedMntPeople(prisma);
    console.log('Seeding provider storage...');
    await seedCtlProviderStorage(prisma);
    console.log('Seeding users...');
    await seedMntuser(prisma);
    console.log('Seeding category permissions...');
    await seedCtlCategoryPermissions(prisma);
    console.log('Seeding permissions...');
    await seedCtlPermissions(prisma);
    console.log('Seeding roles...');
    await seedMntRol(prisma);
    console.log('Seeding role permissions...');
    await seedRolPermissions(prisma);
    console.log('Seeding user roles...');
    await seedMntUserRol(prisma);
    console.log('Seeding routes...');
    await seedMntRoute(prisma);
    console.log('Seeding route permissions...');
    await seedMntRoutePermissions(prisma);
    console.log('Seeding addresses...');
    await seedMntAddress(prisma);
    console.log('Main seeder completed successfully.');
  } catch (error) {
    console.error('Error during main seeder execution:', error);
    throw error;
  }
};
mainSeeder()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
