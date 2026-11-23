import { PrismaClient } from 'generated/prisma/client';

export const seedCtlProviderStorage = async (tx: PrismaClient) => {
  console.log('Seeding ctl_provider_storage data ...');
  const providers = [
    {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'LOCAL',
      code: 'LOCAL',
      description: 'Almacenamiento en Disco Local',
      active: true,
    },
    {
      id: '00000000-0000-4000-8000-000000000002',
      name: 'S3',
      code: 'S3',
      description: 'Almacenamiento S3 Compatible (Cloudflare R2, AWS S3, MinIO)',
      active: true,
    },
  ];

  for (const provider of providers) {
    await tx.ctl_provider_storage.upsert({
      where: { name: provider.name },
      update: {
        code: provider.code,
        description: provider.description,
        active: provider.active,
      },
      create: provider,
    });
  }
};
