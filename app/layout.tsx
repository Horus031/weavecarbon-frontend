import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { LanguageProvider } from "@/contexts/LanguageContext";

export const metadata: Metadata = {
  title: "WeaveCarbon",
  description: "Carbon footprint management for textile products",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html data-scroll-behavior="smooth" lang={locale} suppressHydrationWarning>
      <body className={`antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LanguageProvider>
            {children}
            <Toaster />
          </LanguageProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
