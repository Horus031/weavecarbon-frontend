"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Users, Bell } from "lucide-react";
import SystemSettings from "./SystemSettings";
import UsersSettings from "./UsersSettings";
import NotificationSettings from "./NotificationSettings";
import { useDashboardTitle } from "@/contexts/DashboardContext";

const SettingsPage: React.FC = () => {
  const t = useTranslations("settings");
  const [activeTab, setActiveTab] = useState("system");
  const { setPageTitle } = useDashboardTitle();

  useEffect(() => {
    setPageTitle(t("title"), t("subtitle"));
  }, [setPageTitle, t]);

  const SETTINGS_TABS = [
  { id: "system", label: t("tabs.system"), icon: SettingsIcon },
  { id: "users", label: t("tabs.users"), icon: Users },
  { id: "notifications", label: t("tabs.notifications"), icon: Bell }];


  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6">
        
        
        <div className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-1 gap-3 overflow-visible bg-transparent p-0 sm:grid-cols-3">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="group flex h-auto items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md data-[state=active]:border-primary/55 data-[state=active]:bg-primary/12 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/30 data-[state=active]:shadow-md">

                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 transition-all group-data-[state=active]:bg-primary/20 group-data-[state=active]:text-primary">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span>{tab.label}</span>
                </TabsTrigger>);

            })}
          </TabsList>
        </div>

        
        <TabsContent value="system" className="mt-4">
          <SystemSettings />
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <UsersSettings />
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>);

};

export default SettingsPage;