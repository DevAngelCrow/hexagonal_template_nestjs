import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentMethodController } from '@/modules/catalogs/infrastructure/controllers/payment-method.controller';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { ConflictException } from '@/shared/domain/exceptions/conflict-exception';

describe('PaymentMethodController', () => {
  let controller: PaymentMethodController;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        ctl_payment_method: {
          findUnique: vi.fn(),
          findFirst: vi.fn(),
          findMany: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
        },
        ctl_status: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'st-1',
              name: 'Activo',
              description: 'Estado activo',
              code: 'AC',
              active: true,
              state_color: '#d1fae5',
              text_color: '#065f46',
              id_category_status: 'cat-st-1',
              ctl_category_status: {
                id: 'cat-st-1',
                name: 'ESTADO_BOOLEANO',
                code: 'BL',
                active: true,
              },
            },
            {
              id: 'st-2',
              name: 'Inactivo',
              description: 'Estado inactivo',
              code: 'INA',
              active: false,
              state_color: '#fee2e2',
              text_color: '#991b1b',
              id_category_status: 'cat-st-1',
              ctl_category_status: {
                id: 'cat-st-1',
                name: 'ESTADO_BOOLEANO',
                code: 'BL',
                active: true,
              },
            },
          ]),
        },
      },
    };

    controller = new PaymentMethodController(mockPrisma);
  });

  describe('getAll', () => {
    it('should return list of payment methods with mapped status', async () => {
      mockPrisma.client.ctl_payment_method.findMany.mockResolvedValue([
        {
          id: 'pm-1',
          code: 'CASH',
          name: 'Efectivo',
          description: 'Pago en efectivo',
          active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const res = await controller.getAll();
      expect(res.data).toHaveLength(1);
      expect(res.data[0].code).toBe('CASH');
      expect(res.data[0].name).toBe('Efectivo');
      expect(res.data[0].status).toBeDefined();
      expect(res.data[0].status?.name).toBe('Activo');
    });
  });

  describe('create', () => {
    it('should throw ConflictException if code already exists', async () => {
      mockPrisma.client.ctl_payment_method.findFirst.mockResolvedValueOnce({
        id: 'existing-id',
        code: 'CASH',
      });

      await expect(
        controller.create({
          code: 'CASH',
          name: 'Efectivo',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create payment method when code and name are unique', async () => {
      mockPrisma.client.ctl_payment_method.findFirst.mockResolvedValue(null);
      mockPrisma.client.ctl_payment_method.create.mockResolvedValue({
        id: 'new-uuid',
        code: 'SINPE',
        name: 'SINPE Móvil',
        description: 'Transferencia móvil inmediata',
        active: true,
      });

      const res = await controller.create({
        code: 'sinpe',
        name: 'SINPE Móvil',
        description: 'Transferencia móvil inmediata',
      });

      expect(res.data.id).toBe('new-uuid');
      expect(res.data.code).toBe('SINPE');
      expect(res.data.name).toBe('SINPE Móvil');
    });
  });

  describe('toggleStatus', () => {
    it('should toggle active status from true to false', async () => {
      mockPrisma.client.ctl_payment_method.findFirst.mockResolvedValue({
        id: 'pm-1',
        active: true,
      });
      mockPrisma.client.ctl_payment_method.update.mockResolvedValue({
        id: 'pm-1',
        active: false,
      });

      const res = await controller.toggleStatus('pm-1');
      expect(res.data.active).toBe(false);
      expect(mockPrisma.client.ctl_payment_method.update).toHaveBeenCalledWith({
        where: { id: 'pm-1' },
        data: { active: false },
      });
    });

    it('should throw NotFoundException if payment method does not exist', async () => {
      mockPrisma.client.ctl_payment_method.findFirst.mockResolvedValue(null);

      await expect(controller.toggleStatus('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if payment method does not exist', async () => {
      mockPrisma.client.ctl_payment_method.findFirst.mockResolvedValue(null);

      await expect(controller.delete('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should soft delete payment method', async () => {
      mockPrisma.client.ctl_payment_method.findFirst.mockResolvedValue({
        id: 'pm-2',
        code: 'TEMP',
        name: 'Temporal',
      });
      mockPrisma.client.ctl_payment_method.update.mockResolvedValue({
        id: 'pm-2',
        active: false,
      });

      const res = await controller.delete('pm-2');
      expect(res.data.id).toBe('pm-2');
      expect(mockPrisma.client.ctl_payment_method.update).toHaveBeenCalled();
    });
  });
});

