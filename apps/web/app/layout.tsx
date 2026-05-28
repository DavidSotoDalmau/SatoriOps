import type { Metadata } from "next";
import "./globals.css";
import { getLocale } from "@/lib/i18n-server";

export const metadata: Metadata = {
  title: "SatoriOps",
  description: "Security-first cybersecurity conference operations platform.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className="dark">
      <body>{children}</body>
    </html>
  );
}
