export const QUEUE_NAMES = {
  SEND_EMAIL_VERIFICATION: 'send-email-verification',
  SEND_PASSWORD_RESET: 'send-password-reset',
  SEND_EMAIL_CHANGE_CONFIRMATION: 'send-email-change-confirmation',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
