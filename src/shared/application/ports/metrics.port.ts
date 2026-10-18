export abstract class MetricsPort {
  abstract incrementLogin(result: 'success' | 'failure'): void;
  abstract incrementRegister(): void;
  abstract incrementPasswordReset(step: 'requested' | 'completed'): void;
  abstract incrementStorageFileUpload(provider: string): void;
}
