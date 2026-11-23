import { PrismaClient } from 'generated/prisma/client';

export const seedCtlDocumentPrefix = async (tx: PrismaClient) => {
  console.log('Seeding ctl_document_prefix data...');
  const currentYear = new Date().getFullYear();

  const prefixes = [
    {
      id: '00000000-0000-4000-8000-000000000701',
      code: 'DOCUMENT',
      prefix: 'DOC',
      name: 'Serie General de Documentos',
      description:
        'Prefijo y correlativo genérico configurable para numeración secuencial de documentos',
      entity_target: 'ctl_document_prefix',
      current_year: currentYear,
      current_value: 0,
      padding: 4,
      reset_yearly: true,
      separator: '-',
      active: true,
    },
  ];

  for (const p of prefixes) {
    await tx.ctl_document_prefix.upsert({
      where: { code: p.code },
      update: {
        prefix: p.prefix,
        name: p.name,
        description: p.description,
        entity_target: p.entity_target,
        padding: p.padding,
        reset_yearly: p.reset_yearly,
        separator: p.separator,
        active: p.active,
      },
      create: p,
    });
  }
};
