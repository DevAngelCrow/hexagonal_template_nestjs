import {
  CategoryStatus,
  BooleanStatus,
} from '../../domain/enums/boolean-status';
import { BooleanStatusData } from '../interfaces/boolean-status-data.interface';
import { TransactionClient } from 'generated/prisma/internal/prismaNamespace';
import { PrismaService } from '../db/prisma.service';

export class GetBooleanStatusCatalogService {
  static async getStatus(tx: TransactionClient | PrismaService) {
    const prismaTx = 'client' in tx ? tx.client : tx;
    const statuses = await prismaTx.ctl_status.findMany({
      where: {
        ctl_category_status: {
          name: CategoryStatus.NAME,
          code: CategoryStatus.CODE,
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        code: true,
        active: true,
        state_color: true,
        text_color: true,
        id_category_status: true,
        ctl_category_status: {
          select: {
            id: true,
            name: true,
            description: true,
            code: true,
            active: true,
          },
        },
      },
    });

    const mapStatus = new Map<string, BooleanStatusData>();
    statuses.forEach((status) => {
      const key = status.code?.toLocaleLowerCase();
      if (!key) return;
      if (
        key === BooleanStatus.ACTIVE.toLowerCase() ||
        key === BooleanStatus.INACTIVE.toLowerCase()
      ) {
        mapStatus.set(key, {
          id: status.id,
          name: status.name,
          description: status.description,
          code: status.code,
          active: status.active,
          state_color: status.state_color,
          text_color: status.text_color,
          id_category_status: status.id_category_status,
          ctl_category_status: status.ctl_category_status,
        });
      }
    });
    return mapStatus;
  }
}
