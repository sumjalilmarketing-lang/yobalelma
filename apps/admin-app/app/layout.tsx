import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Yobalelma Command",
  title: { default: "Centre de commandement | Yobalelma", template: "%s | Yobalelma Command" },
  description: "Pilotage des métiers, missions et workflows de Yobalelma.",
  icons: { icon: "/brand/yobalelma-mark.svg" },
};

export const viewport: Viewport = { themeColor: "#ff6600", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr" suppressHydrationWarning><body>{children}</body></html>;
}
