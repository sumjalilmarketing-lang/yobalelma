export const notificationChannels = ["in_app", "email", "sms", "whatsapp"] as const;

export type NotificationChannel = (typeof notificationChannels)[number];

export const deliveryNotificationProviders = {
  email: "sandbox",
  in_app: "supabase_in_app",
  sms: "sandbox",
  whatsapp: "sandbox",
} as const satisfies Record<NotificationChannel, string>;

export function isExternalDeliveryProviderSandbox(channel: NotificationChannel) {
  return channel !== "in_app" && deliveryNotificationProviders[channel] === "sandbox";
}

export type NotificationMessage = { idempotencyKey: string; channel: Exclude<NotificationChannel, "in_app">; recipient: string; locale: string; templateKey: string; variables: Record<string, string> };
export type NotificationReceipt = { providerReference: string; acceptedAt: string };
export interface NotificationProvider { readonly id: string; readonly channel: NotificationMessage["channel"]; send(message: NotificationMessage): Promise<NotificationReceipt>; }
export type NotificationTransport = (message: NotificationMessage) => Promise<NotificationReceipt>;

export class ExternalNotificationProvider implements NotificationProvider {
  constructor(readonly id: string, readonly channel: NotificationMessage["channel"], private readonly transport?: NotificationTransport) {}
  async send(message: NotificationMessage) {
    validateMessage(message, this.channel);
    if (!this.transport) throw new Error("NOTIFICATION_PROVIDER_ACCESS_REQUIRED");
    const receipt = await this.transport(message);
    if (!receipt.providerReference || !Number.isFinite(Date.parse(receipt.acceptedAt))) throw new Error("NOTIFICATION_PROVIDER_INVALID_RECEIPT");
    return receipt;
  }
}

export function notificationRetryDelayMs(attempt: number) {
  if (!Number.isInteger(attempt) || attempt < 1) throw new Error("INVALID_NOTIFICATION_ATTEMPT");
  return Math.min(15 * 60_000, 30_000 * 2 ** Math.min(attempt - 1, 5));
}

function validateMessage(message: NotificationMessage, channel: NotificationMessage["channel"]) {
  if (message.channel !== channel) throw new Error("NOTIFICATION_CHANNEL_MISMATCH");
  if (!/^[A-Za-z0-9:_-]{8,160}$/u.test(message.idempotencyKey)) throw new Error("INVALID_NOTIFICATION_IDEMPOTENCY_KEY");
  if (!/^[a-z]{2}(?:-[A-Z]{2})?$/u.test(message.locale)) throw new Error("INVALID_NOTIFICATION_LOCALE");
  if (!/^[a-z0-9_.-]{3,120}$/u.test(message.templateKey)) throw new Error("INVALID_NOTIFICATION_TEMPLATE");
  if (!message.recipient.trim()) throw new Error("INVALID_NOTIFICATION_RECIPIENT");
}
