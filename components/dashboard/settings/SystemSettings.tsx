"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Save, X, Server, Zap } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface CompanyData {
  id: string;
  name: string;
  business_type: "shop_online" | "brand" | "factory";
  target_markets: string[] | null;
  current_plan: string;
}

const SystemSettings: React.FC = () => {
  const t = useTranslations("settings.system");
  const { user } = useAuth();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const supabase = createClient();
  const isDemoTenant = user?.is_demo_user || false;
  const companyId = user?.company_id || null;

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    business_type: "brand" as "shop_online" | "brand" | "factory",
  });

  useEffect(() => {
    const fetchCompany = async () => {
      if (!companyId) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from("companies")
          .select("*")
          .eq("id", companyId)
          .maybeSingle();

        if (data) {
          setCompany(data);
          setFormData((prev) => ({
            ...prev,
            name: data.name,
            business_type: data.business_type,
          }));
        }
      } catch (error) {
        console.error("Error fetching company:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [companyId, supabase]);

  const handleSave = async () => {
    if (!companyId) return;

    setSaving(true);
    try {
      await supabase
        .from("companies")
        .update({
          name: formData.name,
          business_type: formData.business_type,
        })
        .eq("id", companyId);

      toast.success(t("updateSuccess"));
      setEditMode(false);
      setCompany((prev) =>
        prev
          ? {
              ...prev,
              name: formData.name,
              business_type: formData.business_type,
            }
          : null,
      );
    } catch (error) {
      console.error("Error saving company:", error);
      toast.error(t("updateError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {t("companyInfo")}
              </CardTitle>
              <CardDescription>
                {t("companyInfoDesc")}
              </CardDescription>
            </div>
            {!editMode ? (
              <Button variant="outline" onClick={() => setEditMode(true)}>
                {t("edit")}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setEditMode(false)}>
                  <X className="w-4 h-4 mr-1" /> {t("cancel")}
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-1" /> {t("save")}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("companyName")}</Label>
              {editMode ? (
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              ) : (
                <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                  {company?.name || t("notUpdated")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("businessType")}</Label>
              {editMode ? (
                <Select
                  value={formData.business_type}
                  onValueChange={(value: "shop_online" | "brand" | "factory") =>
                    setFormData((prev) => ({ ...prev, business_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brand">{t("businessTypeBrand")}</SelectItem>
                    <SelectItem value="factory">
                      {t("businessTypeFactory")}
                    </SelectItem>
                    <SelectItem value="shop_online">{t("businessTypeShop")}</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                  {company?.business_type === "brand" && t("businessTypeBrand")}
                  {company?.business_type === "factory" && t("businessTypeFactory")}
                  {company?.business_type === "shop_online" && t("businessTypeShop")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("servicePlan")}</Label>
              <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                {company?.current_plan?.toUpperCase() || "STARTER"}
              </p>
            </div>
          </div>

          {isDemoTenant && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-600">
              {t("demoWarning")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            {t("systemInfo")}
          </CardTitle>
          <CardDescription>
            {t("systemInfoDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <Label className="text-muted-foreground">{t("accountType")}</Label>
                <Badge
                  className={
                    isDemoTenant
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      : "bg-primary/10 text-primary border-primary/20"
                  }
                >
                  {isDemoTenant ? t("demo") : t("production")}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <Label className="text-muted-foreground">{t("createdDate")}</Label>
                <span className="text-sm">
                  {format(new Date("2024-01-15"), "dd/MM/yyyy")}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <Label className="text-muted-foreground">{t("apiVersion")}</Label>
                <span className="text-sm font-mono">v1.0.0</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <Label className="text-muted-foreground">{t("region")}</Label>
                <span className="text-sm">{t("asiaPacific")}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <Label className="text-muted-foreground">{t("status")}</Label>
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  {t("active")}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <Label className="text-muted-foreground">{t("uptime")}</Label>
                <span className="text-sm">99.9%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan & Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            {t("usageLimits")}
          </CardTitle>
          <CardDescription>
            {t("usageLimitsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-muted-foreground">{t("products")}</Label>
                <span className="text-sm font-medium">12 / 100</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "12%" }} />
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-muted-foreground">{t("members")}</Label>
                <span className="text-sm font-medium">3 / 5</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "60%" }} />
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-muted-foreground">{t("apiCalls")}</Label>
                <span className="text-sm font-medium">1,234 / 10,000</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: "12.34%" }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-medium">{t("upgradeTitle")}</p>
              <p className="text-sm text-muted-foreground">
                {t("upgradeDesc")}
              </p>
            </div>
            <Button>{t("upgradeNow")}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;
