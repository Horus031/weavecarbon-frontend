"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription } from
"@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { toast } from "sonner";

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  email: boolean;
}

const NotificationSettings: React.FC = () => {
  const t = useTranslations("settings.notifications");

  const DEFAULT_NOTIFICATIONS: NotificationSetting[] = [
  {
    id: "product_created",
    label: t("productCreated"),
    description: t("productCreatedDesc"),
    email: false
  },
  {
    id: "product_updated",
    label: t("productUpdated"),
    description: t("productUpdatedDesc"),
    email: false
  },
  {
    id: "shipment_status",
    label: t("shipmentStatus"),
    description: t("shipmentStatusDesc"),
    email: true
  },
  {
    id: "report_ready",
    label: t("reportReady"),
    description: t("reportReadyDesc"),
    email: true
  },
  {
    id: "export_completed",
    label: t("exportCompleted"),
    description: t("exportCompletedDesc"),
    email: false
  },
  {
    id: "user_invited",
    label: t("userInvited"),
    description: t("userInvitedDesc"),
    email: true
  },
  {
    id: "compliance_deadline",
    label: t("complianceDeadline"),
    description: t("complianceDeadlineDesc"),
    email: true
  }];


  const [notifications, setNotifications] = useState<NotificationSetting[]>(
    DEFAULT_NOTIFICATIONS
  );

  const handleToggle = (id: string, value: boolean) => {
    setNotifications((prev) =>
    prev.map((n) => n.id === id ? { ...n, email: value } : n)
    );
  };

  const handleSave = () => {
    toast.success(t("saveSuccess"));
  };

  const handleEnableAll = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, email: true })));
    toast.success(t("enableAllSuccess"));
  };

  const handleDisableAll = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, email: false })));
    toast.success(t("disableAllSuccess"));
  };

  return (
    <div className="space-y-6">
      
      <Card className="overflow-hidden border border-slate-200 shadow-sm">
        <CardHeader className="rounded-t-[inherit] border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                {t("emailNotifications")}
              </CardTitle>
              <CardDescription>
                {t("emailNotificationsDesc")}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                onClick={handleEnableAll}>

                {t("enableAll")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                onClick={handleDisableAll}>

                {t("disableAll")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 bg-white">
          {notifications.map((notification) =>
          <div
            key={notification.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">

              <div className="flex-1">
                <Label className="font-medium text-slate-800">
                  {notification.label}
                </Label>
                <p className="text-sm text-slate-600">
                  {notification.description}
                </p>
              </div>
              <Switch
              checked={notification.email}
              onCheckedChange={(v: boolean) =>
              handleToggle(notification.id, v)
              } />
            
            </div>
          )}
        </CardContent>
      </Card>

      
      <div className="flex justify-end">
        <Button
          className="bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={handleSave}>

          {t("saveSettings")}
        </Button>
      </div>
    </div>);

};

export default NotificationSettings;
