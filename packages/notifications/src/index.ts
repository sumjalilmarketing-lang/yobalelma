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
