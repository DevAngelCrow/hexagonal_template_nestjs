import { PrismaClient } from 'generated/prisma/client';
import * as bcrypt from 'bcrypt';

export const seedMntuser = async (tx: PrismaClient) => {
  await tx.mnt_user.deleteMany();
  console.log('Seeding mnt_user data ...');

  const isProduction = process.env.NODE_ENV === 'production';
  const configuredPassword = process.env.SEED_ADMIN_PASSWORD?.trim();
  if (isProduction && !configuredPassword) {
    throw new Error(
      'SEED_ADMIN_PASSWORD environment variable is required when seeding in production',
    );
  }
  if (!configuredPassword) {
    console.warn(
      '[seedMntuser] SEED_ADMIN_PASSWORD is not set — using local development fallback password. Never use this default in production.',
    );
  }
  const adminPassword = configuredPassword || '$admin123';

  const people = await tx.mnt_people.findFirst({
    where: { id: '00000000-0000-4000-8000-000000000001' },
  });
  const status = await tx.ctl_status.findFirst({
    where: { code: 'AC', id: '00000000-0000-4000-8000-000000000001' },
  });
  if (!people || !status) {
    throw new Error('Please seed mnt_people and ctl_status first.');
  }
  await tx.mnt_user.createMany({
    data: [
      {
        id: '00000000-0000-4000-8000-000000000001',
        id_people: people.id,
        user_name: 'admin',
        password: await bcrypt.hash(adminPassword, 10),
        id_status: status.id,
        last_access: new Date(),
        is_validated: true,
        email_verified_at: new Date(),
      },
    ],
    skipDuplicates: true,
  });
};
