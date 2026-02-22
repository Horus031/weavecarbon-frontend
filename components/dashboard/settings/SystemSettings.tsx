"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { api, authTokenStore, isApiError } from "@/lib/apiClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription } from
"@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import { Building2, Save, X, Zap, User, KeyRound } from "lucide-react";
import { toast } from "sonner";

interface CompanyData {
  id: string;
  name: string;
  business_type: "shop_online" | "brand" | "factory";
  target_markets: string[] | null;
  current_plan: string;
}

interface AccountData {
  profile?: {
    created_at?: string;
  } | null;
  company?: CompanyData | null;
}

interface UsageLimits {
  productsUsed: number;
  productsLimit: number;
  membersUsed: number;
  membersLimit: number;
  apiCallsUsed: number;
  apiCallsLimit: number;
}

interface SubscriptionData {
  current_plan?: string;
  subscription?: {
    current_plan?: string;
  };
  limits?: {
    products?: number;
    members?: number;
    api_calls_per_month?: number;
  };
  usage?: {
    products?: number;
    products_count?: number;
    products_limit?: number;
    members?: number;
    members_count?: number;
    members_limit?: number;
    api_calls_this_month?: number;
    api_calls_used?: number;
    api_calls_limit?: number;
  };
}

const ACCOUNT_ENDPOINT_ENABLED =
process.env.NEXT_PUBLIC_ACCOUNT_ENDPOINT !== "0";

const isEndpointUnavailableError = (error: unknown) => {
  if (isApiError(error)) {
    return error.status === 404 || error.status === 501;
  }
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("not found") ||
    message.includes("route") ||
    message.includes("not implemented"));
};

const SystemSettings: React.FC = () => {
  const t = useTranslations("settings.system");
  const { user, updateUser, refreshUser } = useAuth();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [accountCreatedAt, setAccountCreatedAt] = useState<string | null>(null);
  const [usageLimits, setUsageLimits] = useState<UsageLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [personalEditMode, setPersonalEditMode] = useState(false);
  const [personalSaving, setPersonalSaving] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const createdDateLabel = accountCreatedAt ?
  new Date(accountCreatedAt).toLocaleDateString("vi-VN") :
  t("notUpdated");

  const [personalForm, setPersonalForm] = useState({
    full_name: "",
    email: ""
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });

  const [formData, setFormData] = useState({
    name: "",
    business_type: "brand" as "shop_online" | "brand" | "factory"
  });

  const businessTypeLabel =
  company?.business_type === "brand" ?
  t("businessTypeBrand") :
  company?.business_type === "factory" ?
  t("businessTypeFactory") :
  company?.business_type === "shop_online" ?
  t("businessTypeShop") :
  t("notUpdated");

  useEffect(() => {
    setPersonalForm({
      full_name: user?.full_name?.trim() || "",
      email: user?.email?.trim() || ""
    });
  }, [user?.email, user?.full_name]);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!user || user.user_type !== "b2b") {
        setUsageLimits(null);
        setLoading(false);
        return;
      }

      const hasToken = Boolean(
        authTokenStore.getAccessToken() || authTokenStore.getRefreshToken()
      );
      if (!hasToken) {
        setUsageLimits(null);
        setLoading(false);
        return;
      }

      try {
        const subscriptionResult = await api.
        get<SubscriptionData>("/subscription").
        then((data) => ({ status: "fulfilled" as const, value: data })).
        catch((reason) => ({ status: "rejected" as const, reason }));

        if (ACCOUNT_ENDPOINT_ENABLED) {
          const accountResult = await api.
          get<AccountData>("/account").
          then((data) => ({ status: "fulfilled" as const, value: data })).
          catch((reason) => ({ status: "rejected" as const, reason }));

          if (accountResult.status === "fulfilled") {
            const account = accountResult.value;
            const companyData = account.company || null;
            setCompany(companyData);
            setAccountCreatedAt(account.profile?.created_at || null);
            setFormData((prev) => ({
              ...prev,
              name: companyData?.name || "",
              business_type: companyData?.business_type || "brand"
            }));
          } else {
            setCompany(null);
            setAccountCreatedAt(null);
          }
        } else {
          setCompany(null);
          setAccountCreatedAt(null);
        }

        if (subscriptionResult.status === "fulfilled") {
          const subscription = subscriptionResult.value;
          const usage = subscription.usage;
          const limits = subscription.limits;
          setUsageLimits({
            productsUsed: usage?.products ?? usage?.products_count ?? 0,
            productsLimit: limits?.products ?? usage?.products_limit ?? 0,
            membersUsed: usage?.members ?? usage?.members_count ?? 0,
            membersLimit: limits?.members ?? usage?.members_limit ?? 0,
            apiCallsUsed:
            usage?.api_calls_this_month ?? usage?.api_calls_used ?? 0,
            apiCallsLimit:
            limits?.api_calls_per_month ?? usage?.api_calls_limit ?? 0
          });
          setCompany((prev) =>
          prev ?
          {
            ...prev,
            current_plan:
            subscription.current_plan ||
            subscription.subscription?.current_plan ||
            prev.current_plan
          } :
          prev
          );
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
  }, [user]);

  const handlePersonalSave = async () => {
    const email = personalForm.email.trim();
    const fullName = personalForm.full_name.trim();

    if (!fullName) {
      toast.error("Full name is required.");
      return;
    }

    if (!email) {
      toast.error("Email is required.");
      return;
    }

    setPersonalSaving(true);
    try {
      const updated = await api.put<{
        email?: string;
        full_name?: string;
      }>("/account/profile", {
        full_name: fullName,
        email
      });

      updateUser({
        full_name:
        typeof updated?.full_name === "string" && updated.full_name.trim() ?
        updated.full_name :
        fullName,
        email:
        typeof updated?.email === "string" && updated.email.trim() ?
        updated.email :
        email
      });
      await refreshUser();
      setPersonalEditMode(false);
      toast.success("Personal information updated.");
    } catch (error) {
      console.error("Error saving personal profile:", error);
      toast.error(error instanceof Error ? error.message : t("updateError"));
    } finally {
      setPersonalSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password) {
      toast.error("Please enter current and new password.");
      return;
    }

    if (passwordForm.new_password.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("Password confirmation does not match.");
      return;
    }

    const endpoints = [
    "/account/change-password",
    "/account/company/password",
    "/account/password",
    "/auth/change-password"];

    setPasswordSaving(true);
    try {
      let changed = false;
      let lastError: unknown = null;

      for (const path of endpoints) {
        try {
          await api.post(path, {
            current_password: passwordForm.current_password,
            new_password: passwordForm.new_password
          });
          changed = true;
          break;
        } catch (error) {
          lastError = error;
          if (isEndpointUnavailableError(error)) {
            continue;
          }
          throw error;
        }
      }

      if (!changed) {
        throw (lastError instanceof Error ? lastError : new Error("Unable to change password."));
      }

      setPasswordDialogOpen(false);
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: ""
      });
      toast.success("Password changed successfully.");
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error instanceof Error ? error.message : "Unable to change password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleCancelPersonalEdit = () => {
    setPersonalEditMode(false);
    setPersonalForm({
      full_name: user?.full_name?.trim() || "",
      email: user?.email?.trim() || ""
    });
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit <= 0) return 0;
    return Math.min(100, Math.max(0, used / limit * 100));
  };

  const handleSave = async () => {
    if (!company) return;

    setSaving(true);
    try {
      await api.put("/account/company", {
        name: formData.name,
        business_type: formData.business_type
      });

      toast.success(t("updateSuccess"));
      setEditMode(false);
      setCompany((prev) =>
      prev ?
      {
        ...prev,
        name: formData.name,
        business_type: formData.business_type
      } :
      null
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
        <div className="h-32 rounded-lg border border-slate-200 bg-slate-100/70 animate-pulse" />
        <div className="h-32 rounded-lg border border-slate-200 bg-slate-100/70 animate-pulse" />
      </div>);

  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border border-slate-300 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
        <CardHeader className="rounded-t-[inherit] border-b border-slate-300 bg-slate-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {t("personalInfo")}
              </CardTitle>
              <CardDescription className="text-slate-600">
                {t("personalInfoDesc")}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {!personalEditMode ?
              <Button
                variant="outline"
                className="gap-2 border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
                type="button"
                onClick={() => setPersonalEditMode(true)}>

                  {t("edit")}
                </Button> :

              <>
                  <Button
                  variant="ghost"
                  className="text-slate-700 hover:bg-slate-200"
                  onClick={handleCancelPersonalEdit}>

                    <X className="w-4 h-4 mr-1" /> {t("cancel")}
                  </Button>
                  <Button
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={handlePersonalSave}
                  disabled={personalSaving}>

                    <Save className="w-4 h-4 mr-1" /> {t("save")}
                  </Button>
                </>
              }
              <Button
                variant="outline"
                className="gap-2 border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
                type="button"
                onClick={() => setPasswordDialogOpen(true)}>

                <KeyRound className="w-4 h-4" />
                {t("changePassword")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t("fullName")}</Label>
              <Input
                value={personalEditMode ? personalForm.full_name : user?.full_name?.trim() || t("notUpdated")}
                className={`border-slate-300 text-slate-800 ${personalEditMode ? "bg-white" : "bg-slate-100 disabled:text-slate-800 disabled:opacity-100"}`}
                disabled={!personalEditMode}
                onChange={(e) =>
                setPersonalForm((prev) => ({ ...prev, full_name: e.target.value }))
                } />

            </div>
            <div className="space-y-2">
              <Label>{t("email")}</Label>
              <Input
                value={personalEditMode ? personalForm.email : user?.email?.trim() || t("noEmail")}
                className={`border-slate-300 text-slate-800 ${personalEditMode ? "bg-white" : "bg-slate-100 disabled:text-slate-800 disabled:opacity-100"}`}
                disabled={!personalEditMode}
                onChange={(e) =>
                setPersonalForm((prev) => ({ ...prev, email: e.target.value }))
                } />

            </div>
            <div className="space-y-2">
              <Label>{t("accountCreated")}</Label>
              <Input
                value={createdDateLabel}
                className="border-slate-300 bg-slate-100 text-slate-800 disabled:text-slate-800 disabled:opacity-100"
                disabled />

            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="border border-slate-200 bg-white">
          <DialogHeader>
            <DialogTitle>{t("changePassword")}</DialogTitle>
            <DialogDescription>
              Update your account password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current password</Label>
              <Input
                type="password"
                value={passwordForm.current_password}
                onChange={(e) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  current_password: e.target.value
                }))
                }
                className="border-slate-300 bg-white" />
            </div>
            <div className="space-y-2">
              <Label>New password</Label>
              <Input
                type="password"
                value={passwordForm.new_password}
                onChange={(e) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  new_password: e.target.value
                }))
                }
                className="border-slate-300 bg-white" />
            </div>
            <div className="space-y-2">
              <Label>Confirm new password</Label>
              <Input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  confirm_password: e.target.value
                }))
                }
                className="border-slate-300 bg-white" />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setPasswordDialogOpen(false)}
              disabled={passwordSaving}>
              {t("cancel")}
            </Button>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleChangePassword}
              disabled={passwordSaving}>
              {t("changePassword")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="overflow-hidden border border-slate-300 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
        <CardHeader className="rounded-t-[inherit] border-b border-slate-300 bg-slate-100">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {t("companyInfo")}
              </CardTitle>
              <CardDescription className="text-slate-600">
                {t("companyInfoDesc")}
              </CardDescription>
            </div>
            {!editMode ?
            <Button
              variant="outline"
              className="border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
              onClick={() => setEditMode(true)}>

                {t("edit")}
              </Button> :

            <div className="flex gap-2">
                <Button
                variant="ghost"
                className="text-slate-700 hover:bg-slate-200"
                onClick={() => setEditMode(false)}>

                  <X className="w-4 h-4 mr-1" /> {t("cancel")}
                </Button>
                <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={handleSave}
                disabled={saving}>

                  <Save className="w-4 h-4 mr-1" /> {t("save")}
                </Button>
              </div>
            }
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("companyName")}</Label>
              {editMode ?
              <Input
                value={formData.name}
                className="border-slate-300 bg-white"
                onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
                } /> :


              <p className="rounded border border-slate-300 bg-slate-100 p-2 text-sm text-slate-800">
                  {company?.name || t("notUpdated")}
                </p>
              }
            </div>

            <div className="space-y-2">
              <Label>{t("businessType")}</Label>
              {editMode ?
              <Select
                value={formData.business_type}
                onValueChange={(value: "shop_online" | "brand" | "factory") =>
                setFormData((prev) => ({ ...prev, business_type: value }))
                }>

                  <SelectTrigger className="border-slate-300 bg-white">
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
                </Select> :

              <p className="rounded border border-slate-300 bg-slate-100 p-2 text-sm text-slate-800">
                  {businessTypeLabel}
                </p>
              }
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{t("servicePlan")}</Label>
              <p className="rounded border border-slate-300 bg-slate-100 p-2 text-sm text-slate-800">
                {company?.current_plan?.toUpperCase() || "STARTER"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-slate-300 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
        <CardHeader className="rounded-t-[inherit] border-b border-slate-300 bg-slate-100">
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            {t("usageLimits")}
          </CardTitle>
          <CardDescription className="text-slate-600">
            {t("usageLimitsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-slate-300 bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-slate-700">{t("products")}</Label>
                <span className="text-sm font-medium">
                  {usageLimits ?
                  `${usageLimits.productsUsed} / ${usageLimits.productsLimit}` :
                  t("notUpdated")}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-300">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${getUsagePercentage(
                      usageLimits?.productsUsed || 0,
                      usageLimits?.productsLimit || 0
                    )}%`
                  }} />

              </div>
            </div>

            <div className="rounded-lg border border-slate-300 bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-slate-700">{t("members")}</Label>
                <span className="text-sm font-medium">
                  {usageLimits ?
                  `${usageLimits.membersUsed} / ${usageLimits.membersLimit}` :
                  t("notUpdated")}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-300">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${getUsagePercentage(
                      usageLimits?.membersUsed || 0,
                      usageLimits?.membersLimit || 0
                    )}%`
                  }} />

              </div>
            </div>

            <div className="rounded-lg border border-slate-300 bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-slate-700">{t("apiCalls")}</Label>
                <span className="text-sm font-medium">
                  {usageLimits ?
                  `${usageLimits.apiCallsUsed.toLocaleString()} / ${usageLimits.apiCallsLimit.toLocaleString()}` :
                  t("notUpdated")}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-300">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${getUsagePercentage(
                      usageLimits?.apiCallsUsed || 0,
                      usageLimits?.apiCallsLimit || 0
                    )}%`
                  }} />

              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4 rounded-lg border border-emerald-300 bg-emerald-100/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-slate-900">{t("upgradeTitle")}</p>
              <p className="text-sm text-slate-700">{t("upgradeDesc")}</p>
            </div>
            <Button className="w-full sm:w-auto bg-emerald-600 text-white hover:bg-emerald-700">
              {t("upgradeNow")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>);

};

export default SystemSettings;
