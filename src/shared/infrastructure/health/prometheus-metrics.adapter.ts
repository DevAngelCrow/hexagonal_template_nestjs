import { Injectable } from '@nestjs/common';
import { MetricsPort } from '@/shared/application/ports/metrics.port';
import {
  authLoginTotal,
  authRegisterTotal,
  authPasswordResetTotal,
  storageFilesUploadedTotal,
} from './business-metrics';

@Injectable()
export class PrometheusMetricsAdapter implements MetricsPort {
  incrementLogin(result: 'success' | 'failure'): void {
    authLoginTotal.inc({ result });
  }

  incrementRegister(): void {
    authRegisterTotal.inc();
  }

  incrementPasswordReset(step: 'requested' | 'completed'): void {
    authPasswordResetTotal.inc({ step });
  }

  incrementStorageFileUpload(provider: string): void {
    storageFilesUploadedTotal.inc({ provider });
  }
}
