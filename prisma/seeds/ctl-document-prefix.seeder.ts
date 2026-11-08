import { PrismaClient } from '../../generated/prisma/client.js';

export const seedCtlDocumentPrefix = async (tx: PrismaClient) => {
  console.log('Seeding ctl_document_prefix data...');
  const currentYear = new Date().getFullYear();

  const prefixes = [
    {
      id: '00000000-0000-4000-8000-000000000701',
      code: 'RESERVATION',
      prefix: 'RES',
      name: 'Serie de Reservas',
      description: 'Prefijo y correlativo para contratos y órdenes de reserva de inventario',
      entity_target: 'mnt_reservation',
      current_year: currentYear,
      current_value: 0,
      padding: 4,
      reset_yearly: true,
      separator: '-',
      active: true,
    },
    {
      id: '00000000-0000-4000-8000-000000000702',
      code: 'INVOICE',
      prefix: 'FAC',
      name: 'Serie de Facturación Comercial',
      description: 'Prefijo y correlativo para facturas y comprobantes fiscales',
      entity_target: 'mnt_invoice',
      current_year: currentYear,
      current_value: 0,
      padding: 4,
      reset_yearly: true,
      separator: '-',
      active: true,
    },
    {
      id: '00000000-0000-4000-8000-000000000703',
      code: 'PAYMENT',
      prefix: 'PAY',
      name: 'Serie de Comprobantes de Pago',
      description: 'Prefijo y correlativo para recibos de abono y pagos de reservas',
      entity_target: 'mnt_payment',
      current_year: currentYear,
      current_value: 0,
      padding: 4,
      reset_yearly: true,
      separator: '-',
      active: true,
    },
    {
      id: '00000000-0000-4000-8000-000000000704',
      code: 'QUOTATION',
      prefix: 'COT',
      name: 'Serie de Cotizaciones / Presupuestos',
      description: 'Prefijo para cotizaciones emitidas antes de formalizar una reserva',
      entity_target: 'mnt_reservation',
      current_year: currentYear,
      current_value: 0,
      padding: 4,
      reset_yearly: true,
      separator: '-',
      active: true,
    },
    {
      id: '00000000-0000-4000-8000-000000000705',
      code: 'MAINTENANCE',
      prefix: 'MNT',
      name: 'Serie de Órdenes de Mantenimiento',
      description: 'Prefijo para tickets y órdenes de mantenimiento y reparación',
      entity_target: 'mnt_product_maintenance',
      current_year: currentYear,
      current_value: 0,
      padding: 4,
      reset_yearly: true,
      separator: '-',
      active: true,
    },
    {
      id: '00000000-0000-4000-8000-000000000706',
      code: 'INSPECTION',
      prefix: 'INS',
      name: 'Serie de Actas de Inspección',
      description: 'Prefijo para actas de inspección física y registro de daños',
      entity_target: 'mnt_reservation_inspection',
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

