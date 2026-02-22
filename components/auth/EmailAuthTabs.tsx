"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, User, Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import { useTranslations } from "next-intl";

interface EmailAuthTabsProps {
  userType: "b2b" | "b2c";
  activeTab: string;
  setActiveTab: (tab: string) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  fullName: string;
  setFullName: (name: string) => void;
  companyName: string;
  setCompanyName: (name: string) => void;
  businessType: "" | "shop_online" | "brand" | "factory";
  setBusinessType: (type: "" | "shop_online" | "brand" | "factory") => void;
  errors: {
    email?: string;
    password?: string;
    name?: string;
    companyName?: string;
    businessType?: string;
  };
  isLoading: boolean;
  onLogin: (e: React.FormEvent) => void;
  onSignUp: (e: React.FormEvent) => void;
}

export default function EmailAuthTabs({
  userType,
  activeTab,
  setActiveTab,
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  companyName,
  setCompanyName,
  businessType,
  setBusinessType,
  errors,
  isLoading,
  onLogin,
  onSignUp
}: EmailAuthTabsProps) {
  const t = useTranslations("auth");
  const tOnboarding = useTranslations("onboarding");
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">{t("login")}</TabsTrigger>
        <TabsTrigger value="signup">{t("signup")}</TabsTrigger>
      </TabsList>

      <TabsContent value="login" className="mt-4">
        <form onSubmit={onLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">{t("email")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="login-email"
                type="email"
                placeholder="email@example.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading} />
              
            </div>
            {errors.email &&
            <p className="text-sm text-destructive">{errors.email}</p>
            }
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password">{t("password")}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading} />
              
            </div>
            {errors.password &&
            <p className="text-sm text-destructive">{errors.password}</p>
            }
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t("loading") : t("loginButton")}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="signup" className="mt-4">
        <form onSubmit={onSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-name">{t("fullName")}</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="signup-name"
                type="text"
                placeholder={t("fullNamePlaceholder")}
                className="pl-10"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading} />
              
            </div>
            {errors.name &&
            <p className="text-sm text-destructive">{errors.name}</p>
            }
          </div>

          {userType === "b2b" &&
          <>
              <div className="space-y-2">
                <Label htmlFor="signup-company">{tOnboarding("companyName")}</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                  id="signup-company"
                  type="text"
                  placeholder={tOnboarding("companyNamePlaceholder")}
                  className="pl-10"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={isLoading} />

                </div>
                {errors.companyName &&
              <p className="text-sm text-destructive">{errors.companyName}</p>
              }
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-business-type">
                  {tOnboarding("businessType")}
                </Label>
                <Select
                value={businessType}
                onValueChange={(value: "shop_online" | "brand" | "factory") =>
                setBusinessType(value)
                }
                disabled={isLoading}>

                  <SelectTrigger id="signup-business-type">
                    <SelectValue
                    placeholder={tOnboarding("businessType")} />

                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shop_online">
                      {tOnboarding("shopOnline")}
                    </SelectItem>
                    <SelectItem value="brand">{tOnboarding("brand")}</SelectItem>
                    <SelectItem value="factory">
                      {tOnboarding("factory")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.businessType &&
              <p className="text-sm text-destructive">{errors.businessType}</p>
              }
              </div>
            </>
          }

          <div className="space-y-2">
            <Label htmlFor="signup-email">{t("email")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="signup-email"
                type="email"
                placeholder="email@example.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading} />
              
            </div>
            {errors.email &&
            <p className="text-sm text-destructive">{errors.email}</p>
            }
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-password">{t("password")}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="signup-password"
                type="password"
                placeholder="••••••••"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading} />
              
            </div>
            {errors.password &&
            <p className="text-sm text-destructive">{errors.password}</p>
            }
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t("loading") : t("signupButton")}
          </Button>
        </form>
      </TabsContent>
    </Tabs>);

}