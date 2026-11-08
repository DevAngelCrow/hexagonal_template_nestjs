import { PrismaClient } from '../../generated/prisma/client.js';

export const seedCtlPaymentMethod = async (tx: PrismaClient) => {
  console.log('Seeding ctl_payment_method data...');
  const paymentMethods = [
    {
      id: '00000000-0000-4000-8000-000000000201',
      code: 'CASH',
      name: 'Efectivo',
      description: 'Cobro en efectivo',
      active: true,
    },
    {
      id: '00000000-0000-4000-8000-000000000202',
      code: 'TRANSFER',
      name: 'Transferencia Bancaria / Zelle',
      description: 'Transferencia electrónica o Zelle',
      active: true,
    },
    {
      id: '00000000-0000-4000-8000-000000000203',
      code: 'CARD',
      name: 'Tarjeta de Crédito / Débito',
      description: 'Cobro vía POS o pasarela de pago',
      active: true,
    },
    {
      id: '00000000-0000-4000-8000-000000000204',
      code: 'CHECK',
      name: 'Cheque',
      description: 'Cheque bancario',
      active: true,
    },
  ];

  for (const pm of paymentMethods) {
    await tx.ctl_payment_method.upsert({
      where: { code: pm.code },
      update: pm,
      create: pm,
    });
  }
};

