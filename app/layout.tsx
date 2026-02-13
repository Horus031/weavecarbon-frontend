import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { LanguageProvider } from "@/contexts/LanguageContext";
import WeaveyChat from "@/components/ui/WeaveyChat";
import { AuthProvider } from "@/contexts/AuthContext";
import LeafHero3D from "@/components/landing/LeafHero3D";

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
      <body className={`antialiased relative`}>
        <AuthProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <LanguageProvider>
              {children}
              <Toaster />
              <WeaveyChat variant="dashboard" />
            </LanguageProvider>
          </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
