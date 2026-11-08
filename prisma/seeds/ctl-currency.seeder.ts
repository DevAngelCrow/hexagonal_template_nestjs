import { PrismaClient } from '../../generated/prisma/client.js';

export const seedCtlCurrency = async (tx: PrismaClient) => {
  console.log('Seeding ctl_currency data...');
  await tx.ctl_currency.upsert({
    where: { code: 'USD' },
    update: { name: 'Dólar Estadounidense', symbol: '$', active: true },
    create: {
      id: '00000000-0000-4000-8000-000000000101',
      code: 'USD',
      name: 'Dólar Estadounidense',
      symbol: '$',
      active: true,
    },
  });
};

