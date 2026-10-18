import { describe, it, expect, vi } from 'vitest';
import { PrometheusMetricsAdapter } from './prometheus-metrics.adapter';
import * as businessMetrics from './business-metrics';

describe('PrometheusMetricsAdapter', () => {
  const adapter = new PrometheusMetricsAdapter();

  it('should increment login metrics', () => {
    const incSpy = vi.spyOn(businessMetrics.authLoginTotal, 'inc');
    adapter.incrementLogin('success');
    expect(incSpy).toHaveBeenCalledWith({ result: 'success' });

    adapter.incrementLogin('failure');
    expect(incSpy).toHaveBeenCalledWith({ result: 'failure' });
  });

  it('should increment register metrics', () => {
    const incSpy = vi.spyOn(businessMetrics.authRegisterTotal, 'inc');
    adapter.incrementRegister();
    expect(incSpy).toHaveBeenCalled();
  });

  it('should increment password reset metrics', () => {
    const incSpy = vi.spyOn(businessMetrics.authPasswordResetTotal, 'inc');
    adapter.incrementPasswordReset('requested');
    expect(incSpy).toHaveBeenCalledWith({ step: 'requested' });
  });

  it('should increment storage file upload metrics', () => {
    const incSpy = vi.spyOn(businessMetrics.storageFilesUploadedTotal, 'inc');
    adapter.incrementStorageFileUpload('s3');
    expect(incSpy).toHaveBeenCalledWith({ provider: 's3' });
  });
});
