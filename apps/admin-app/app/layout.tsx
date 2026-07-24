import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LocalizationProvider } from "@/components/i18n/localization-provider";
import { resolveLocaleSettings } from "@/lib/i18n/config";

export const metadata: Metadata = {
  applicationName: "Yobalelma Command",
  title: { default: "Centre de commandement | Yobalelma", template: "%s | Yobalelma Command" },
  description: "Pilotage des métiers, missions et workflows de Yobalelma.",
  icons: { icon: "/brand/yobalelma-mark.svg" },
};

export const viewport: Viewport = { themeColor: "#ff6600", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const initialSettings = resolveLocaleSettings({ country: "SN", locale: "fr", timeZone: "Africa/Dakar" });
  return <html lang="fr" suppressHydrationWarning><body data-yb-product="admin"><LocalizationProvider initialSettings={initialSettings}>{children}</LocalizationProvider></body></html>;
}
