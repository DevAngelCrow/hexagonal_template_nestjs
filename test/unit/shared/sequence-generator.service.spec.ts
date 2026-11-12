import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SequenceGeneratorService } from '@/shared/infrastructure/services/sequence-generator.service';
import { PrismaService } from '@/shared/infrastructure/db/prisma.service';
import { DatabaseException } from '@/shared/infrastructure/exceptions/database.exception';

describe('SequenceGeneratorService', () => {
  let service: SequenceGeneratorService;
  let mockPrisma: {
    client: {
      $queryRawUnsafe: ReturnType<typeof vi.fn>;
      $executeRawUnsafe: ReturnType<typeof vi.fn>;
      ctl_document_prefix: {
        findFirst: ReturnType<typeof vi.fn>;
      };
    };
  };

  beforeEach(() => {
    mockPrisma = {
      client: {
        $queryRawUnsafe: vi.fn(),
        $executeRawUnsafe: vi.fn(),
        ctl_document_prefix: {
          findFirst: vi.fn(),
        },
      },
    };

    service = new SequenceGeneratorService(
      mockPrisma as unknown as PrismaService,
    );
  });

  describe('next', () => {
    it('should format and return sequential serial number with current year', async () => {
      const year = new Date().getFullYear();
      mockPrisma.client.$queryRawUnsafe.mockResolvedValueOnce([
        {
          current_value: 5,
          prefix: 'DOC',
          current_year: year,
          reset_yearly: true,
          padding: 4,
          separator: '-',
        },
      ]);

      const result = await service.next('DOCUMENT');

      expect(result).toBe(`DOC-${year}-0005`);
      expect(mockPrisma.client.$queryRawUnsafe).toHaveBeenCalled();
    });

    it('should format without year if reset_yearly is false', async () => {
      mockPrisma.client.$queryRawUnsafe.mockResolvedValueOnce([
        {
          current_value: 42,
          prefix: 'AST',
          current_year: null,
          reset_yearly: false,
          padding: 6,
          separator: '-',
        },
      ]);

      const result = await service.next('ASSET');

      expect(result).toBe('AST-000042');
    });

    it('should auto-seed default DOCUMENT prefix if not found on first update and retry', async () => {
      const year = new Date().getFullYear();
      mockPrisma.client.$queryRawUnsafe.mockResolvedValueOnce([]);
      mockPrisma.client.$executeRawUnsafe.mockResolvedValueOnce(1);
      mockPrisma.client.$queryRawUnsafe.mockResolvedValueOnce([
        {
          current_value: 1,
          prefix: 'DOC',
          current_year: year,
          reset_yearly: true,
          padding: 4,
          separator: '-',
        },
      ]);

      const result = await service.next('DOCUMENT');

      expect(result).toBe(`DOC-${year}-0001`);
      expect(mockPrisma.client.$executeRawUnsafe).toHaveBeenCalled();
    });

    it('should throw DatabaseException if prefix cannot be found or initialized', async () => {
      mockPrisma.client.$queryRawUnsafe.mockResolvedValue([]);

      await expect(service.next('UNKNOWN_CODE')).rejects.toThrow(
        DatabaseException,
      );
    });
  });

  describe('peek', () => {
    it('should return projected next number without executing update query', async () => {
      const year = new Date().getFullYear();
      mockPrisma.client.ctl_document_prefix.findFirst.mockResolvedValueOnce({
        prefix: 'FOLIO',
        current_value: 8,
        current_year: year,
        reset_yearly: true,
        padding: 4,
        separator: '-',
      });

      const result = await service.peek('FOLIO');

      expect(result).toBe(`FOLIO-${year}-0009`);
      expect(mockPrisma.client.$queryRawUnsafe).not.toHaveBeenCalled();
    });

    it('should project reset to 1 if new year has started', async () => {
      const currentYear = new Date().getFullYear();
      mockPrisma.client.ctl_document_prefix.findFirst.mockResolvedValueOnce({
        prefix: 'DOC',
        current_value: 120,
        current_year: currentYear - 1,
        reset_yearly: true,
        padding: 4,
        separator: '-',
      });

      const result = await service.peek('DOCUMENT');

      expect(result).toBe(`DOC-${currentYear}-0001`);
    });
  });
});
