"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/apiClient";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Save, X, Zap, User, KeyRound } from "lucide-react";
import { toast } from "sonner";

interface CompanyData {
  id: string;
  name: string;
  business_type: "shop_online" | "brand" | "factory";
  target_markets: string[] | null;
  current_plan: string;
}

interface UsageLimits {
  productsUsed: number;
  productsLimit: number;
  membersUsed: number;
  membersLimit: number;
  apiCallsUsed: number;
  apiCallsLimit: number;
}

const SystemSettings: React.FC = () => {
  const t = useTranslations("settings.system");
  const { user } = useAuth();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [usageLimits, setUsageLimits] = useState<UsageLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const companyId = user?.company_id || null;
  const createdDateLabel = t("notUpdated");

  const [formData, setFormData] = useState({
    name: "",
    business_type: "brand" as "shop_online" | "brand" | "factory",
  });

  const businessTypeLabel =
    company?.business_type === "brand"
      ? t("businessTypeBrand")
      : company?.business_type === "factory"
        ? t("businessTypeFactory")
        : company?.business_type === "shop_online"
          ? t("businessTypeShop")
          : t("notUpdated");

  useEffect(() => {
    const fetchCompany = async () => {
      if (!companyId) {
        setLoading(false);
        return;
      }

      try {
        const [companyResult, usageResult] = await Promise.allSettled([
          api.get<CompanyData>(`/companies/${companyId}`),
          api.get<UsageLimits>(`/companies/${companyId}/usage-limits`),
        ]);

        if (companyResult.status === "fulfilled") {
          const data = companyResult.value;
          setCompany(data);
          setFormData((prev) => ({
            ...prev,
            name: data.name,
            business_type: data.business_type,
          }));
        } else {
          setCompany(null);
        }

        if (usageResult.status === "fulfilled") {
          setUsageLimits(usageResult.value);
        } else {
          setUsageLimits(null);
        }
      } catch (error) {
        console.error("Error fetching company:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [companyId]);

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit <= 0) return 0;
    return Math.min(100, Math.max(0, (used / limit) * 100));
  };

  const handleSave = async () => {
    if (!companyId) return;

    setSaving(true);
    try {
      await api.patch(`/companies/${companyId}`, {
        name: formData.name,
        business_type: formData.business_type,
      });

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
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {t("personalInfo")}
              </CardTitle>
              <CardDescription>{t("personalInfoDesc")}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" type="button">
                <KeyRound className="w-4 h-4" />
                {t("changePassword")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t("fullName")}</Label>
              <Input value={user?.full_name?.trim() || t("notUpdated")} disabled />
            </div>
            <div className="space-y-2">
              <Label>{t("email")}</Label>
              <Input value={user?.email?.trim() || t("noEmail")} disabled />
            </div>
            <div className="space-y-2">
              <Label>{t("accountCreated")}</Label>
              <Input value={createdDateLabel} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {t("companyInfo")}
              </CardTitle>
              <CardDescription>{t("companyInfoDesc")}</CardDescription>
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
                    <SelectItem value="shop_online">
                      {t("businessTypeShop")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                  {businessTypeLabel}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            {t("usageLimits")}
          </CardTitle>
          <CardDescription>{t("usageLimitsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-muted-foreground">{t("products")}</Label>
                <span className="text-sm font-medium">
                  {usageLimits
                    ? `${usageLimits.productsUsed} / ${usageLimits.productsLimit}`
                    : t("notUpdated")}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${getUsagePercentage(
                      usageLimits?.productsUsed || 0,
                      usageLimits?.productsLimit || 0,
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-muted-foreground">{t("members")}</Label>
                <span className="text-sm font-medium">
                  {usageLimits
                    ? `${usageLimits.membersUsed} / ${usageLimits.membersLimit}`
                    : t("notUpdated")}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${getUsagePercentage(
                      usageLimits?.membersUsed || 0,
                      usageLimits?.membersLimit || 0,
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-muted-foreground">{t("apiCalls")}</Label>
                <span className="text-sm font-medium">
                  {usageLimits
                    ? `${usageLimits.apiCallsUsed.toLocaleString()} / ${usageLimits.apiCallsLimit.toLocaleString()}`
                    : t("notUpdated")}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${getUsagePercentage(
                      usageLimits?.apiCallsUsed || 0,
                      usageLimits?.apiCallsLimit || 0,
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-medium">{t("upgradeTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("upgradeDesc")}</p>
            </div>
            <Button>{t("upgradeNow")}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;
