import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { LocalizationProvider } from "@/components/i18n/localization-provider";
import { detectCountryFromHeaders, resolveLocaleSettings } from "@/lib/i18n/config";
import { OfflineAgent } from "@collection-app/src/components/offline-agent";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Yobalelma Collection", title: "Yobalelma Collection", description: "Transport interne sécurisé entre points relais, hubs et infrastructures logistiques.",
  manifest: "/manifest.webmanifest", icons: { icon: "/brand/yobalelma-mark.svg" },
};
export const viewport: Viewport = { themeColor: "#ff6600", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const settings = resolveLocaleSettings({ acceptLanguage: requestHeaders.get("accept-language"), countryHeader: detectCountryFromHeaders(requestHeaders), timeZone: requestHeaders.get("x-vercel-ip-timezone") ?? requestHeaders.get("x-timezone") });
  return <html lang={settings.locale} dir={settings.direction} suppressHydrationWarning><body><LocalizationProvider initialSettings={settings}><OfflineAgent />{children}</LocalizationProvider></body></html>;
}
