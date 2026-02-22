import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Be_Vietnam_Pro } from "next/font/google";

const beVietnamProBody = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
  display: "swap"
});

const beVietnamProHeading = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "WeaveCarbon",
  description: "Carbon footprint management for textile products"
};

export default async function RootLayout({
  children


}: Readonly<{children: React.ReactNode;}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html data-scroll-behavior="smooth" lang={locale} suppressHydrationWarning>
      <body
        className={`${beVietnamProBody.variable} ${beVietnamProHeading.variable} antialiased`}>

        <AuthProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <LanguageProvider>
              {children}
              <Toaster />
            </LanguageProvider>
          </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>);

}
