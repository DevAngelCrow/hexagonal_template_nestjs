import { Injectable, Logger } from '@nestjs/common';
import { SequenceGeneratorPort } from '@/shared/application/ports/sequence-generator.port';
import { PrismaService } from '@/shared/infrastructure/db/prisma.service';
import { DatabaseException } from '@/shared/infrastructure/exceptions/database.exception';

interface DocumentPrefixRawRow {
  current_value: number;
  prefix: string;
  current_year: number | null;
  reset_yearly: boolean;
  padding: number;
  separator: string;
}

export interface DefaultPrefixConfig {
  prefix: string;
  name: string;
  description: string;
  entityTarget: string;
}

/**
 * Mapa extensible de prefijos por defecto para auto-inicialización idempotente.
 * Cada módulo de negocio puede registrar sus códigos específicos vía seeders en
 * `ctl_document_prefix` o ampliando esta configuración en la aplicación derivada.
 */
const DEFAULT_PREFIX_CONFIGS: Readonly<Record<string, DefaultPrefixConfig>> = {
  DOCUMENT: {
    prefix: 'DOC',
    name: 'Serie General de Documentos',
    description:
      'Prefijo y correlativo genérico configurable para numeración secuencial de documentos',
    entityTarget: 'ctl_document_prefix',
  },
};

function getDefaultPrefixConfig(code: string): DefaultPrefixConfig | undefined {
  const normalized = code.toUpperCase();
  if (
    !Object.prototype.hasOwnProperty.call(DEFAULT_PREFIX_CONFIGS, normalized)
  ) {
    return undefined;
  }
  return DEFAULT_PREFIX_CONFIGS[normalized];
}

@Injectable()
export class SequenceGeneratorService implements SequenceGeneratorPort {
  private readonly logger = new Logger(SequenceGeneratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async next(code: string): Promise<string> {
    try {
      const year = new Date().getFullYear();
      let row = await this.executeUpdateReturning(code, year);

      if (!row) {
        // Self-healing: if the row was not found, attempt to auto-seed default definition and retry
        await this.ensurePrefixExists(code, year);
        row = await this.executeUpdateReturning(code, year);
      }

      if (!row) {
        throw new DatabaseException(
          `No se encontró el prefijo de documento con código '${code}' o está inactivo.`,
          'SequenceGenerator.next',
        );
      }

      return this.format(
        row.prefix,
        row.current_value,
        row.padding,
        row.separator,
        row.current_year,
        row.reset_yearly,
      );
    } catch (error: unknown) {
      if (error instanceof DatabaseException) throw error;
      const detail = error instanceof Error ? error.message : String(error);
      throw new DatabaseException(
        `Error generando correlativo para '${code}': ${detail}`,
        'SequenceGenerator.next',
      );
    }
  }

  async peek(code: string): Promise<string> {
    try {
      const year = new Date().getFullYear();
      let row = await this.prisma.client.ctl_document_prefix.findFirst({
        where: { code, active: true, deleted_at: null },
      });

      if (!row) {
        await this.ensurePrefixExists(code, year);
        row = await this.prisma.client.ctl_document_prefix.findFirst({
          where: { code, active: true, deleted_at: null },
        });
      }

      if (!row) {
        throw new DatabaseException(
          `No se encontró el prefijo de documento con código '${code}' o está inactivo.`,
          'SequenceGenerator.peek',
        );
      }

      let nextValue: number;
      let yearToUse = row.current_year ?? year;

      if (row.reset_yearly && (!row.current_year || row.current_year < year)) {
        nextValue = 1;
        yearToUse = year;
      } else {
        nextValue = row.current_value + 1;
      }

      return this.format(
        row.prefix,
        nextValue,
        row.padding,
        row.separator,
        yearToUse,
        row.reset_yearly,
      );
    } catch (error: unknown) {
      if (error instanceof DatabaseException) throw error;
      const detail = error instanceof Error ? error.message : String(error);
      throw new DatabaseException(
        `Error proyectando correlativo para '${code}': ${detail}`,
        'SequenceGenerator.peek',
      );
    }
  }

  private async executeUpdateReturning(
    code: string,
    year: number,
  ): Promise<DocumentPrefixRawRow | null> {
    const updateSql = `
      UPDATE "ctl_document_prefix"
      SET
        "current_value" = CASE
          WHEN "reset_yearly" = true AND ("current_year" IS NULL OR "current_year" < $2) THEN 1
          ELSE "current_value" + 1
        END,
        "current_year" = CASE
          WHEN "reset_yearly" = true THEN $2
          ELSE "current_year"
        END,
        "updated_at" = NOW()
      WHERE "code" = $1 AND "active" = true AND "deleted_at" IS NULL
      RETURNING "current_value", "prefix", "current_year", "reset_yearly", "padding", "separator";
    `;

    const rows = await this.prisma.client.$queryRawUnsafe<
      DocumentPrefixRawRow[]
    >(updateSql, code, year);

    return rows && rows.length > 0 ? rows[0] : null;
  }

  private async ensurePrefixExists(code: string, year: number): Promise<void> {
    const config = getDefaultPrefixConfig(code);
    if (!config) {
      this.logger.warn(
        `No existe configuración por defecto para el código de prefijo: ${code}`,
      );
      return;
    }

    const insertSql = `
      INSERT INTO "ctl_document_prefix" (
        "id", "code", "prefix", "name", "description", "entity_target",
        "current_year", "current_value", "padding", "reset_yearly", "separator", "active", "created_at", "updated_at"
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, 0, 4, true, '-', true, NOW(), NOW()
      ) ON CONFLICT ("code") DO NOTHING;
    `;

    await this.prisma.client.$executeRawUnsafe(
      insertSql,
      code.toUpperCase(),
      config.prefix,
      config.name,
      config.description,
      config.entityTarget,
      year,
    );
  }

  private format(
    prefix: string,
    currentValue: number,
    padding: number,
    separator: string,
    currentYear: number | null,
    resetYearly: boolean,
  ): string {
    const parts: string[] = [prefix];
    if (resetYearly && currentYear) {
      parts.push(String(currentYear));
    }
    parts.push(String(currentValue).padStart(padding, '0'));
    return parts.join(separator);
  }
}
