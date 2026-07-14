import type { Metadata } from "next";
import { headers } from "next/headers";
import { LocalizationProvider } from "@/components/i18n/localization-provider";
import {
  detectCountryFromHeaders,
  resolveLocaleSettings,
} from "@/lib/i18n/config";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yobalelma User App",
  description: "Chaque voyage devient une livraison.",
  applicationName: "Yobalelma User App",
  icons: { icon: "/brand/yobalelma-mark.svg" }
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const settings = resolveLocaleSettings({
    acceptLanguage: requestHeaders.get("accept-language"),
    countryHeader: detectCountryFromHeaders(requestHeaders),
    timeZone:
      requestHeaders.get("x-vercel-ip-timezone") ??
      requestHeaders.get("x-timezone"),
  });

  return (
    <html lang={settings.locale} dir={settings.direction} suppressHydrationWarning>
      <body>
        <LocalizationProvider initialSettings={settings}>{children}</LocalizationProvider>
      </body>
    </html>
  );
}
