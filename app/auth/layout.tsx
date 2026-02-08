import React from "react";
import { Leaf, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { getTranslations } from "next-intl/server";

interface AuthLayoutProps {
  children: React.ReactNode;
  userType?: "b2b" | "b2c" | null;
}

export default async function AuthLayout({
  children,
  userType,
}: AuthLayoutProps) {
  const t = await getTranslations("auth");
  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 flex flex-col p-4">
      {/* Navigation */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-muted transition-colors"
        >
          <Home className="w-5 h-5" />
        </Link>

        <LanguageToggle />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <span className="text-2xl font-display font-bold text-foreground">
                {t("welcome")}
              </span>
            </Link>
            <p className="mt-2 text-muted-foreground">{t("description")}</p>
          </div>

          {children}

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t("termsNotice")}
          </p>
        </div>
      </div>
    </div>
  );
}
