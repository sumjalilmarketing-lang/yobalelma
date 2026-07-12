import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yobalelma User App",
  description: "Chaque voyage devient une livraison.",
  applicationName: "Yobalelma User App",
  icons: { icon: "/brand/yobalelma-mark.svg" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
