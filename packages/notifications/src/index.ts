export const notificationChannels = ["in_app", "email", "sms", "whatsapp"] as const;

export type NotificationChannel = (typeof notificationChannels)[number];
