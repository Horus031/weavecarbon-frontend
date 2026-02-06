"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings as SettingsIcon, Users, Bell } from "lucide-react";
import SystemSettings from "./SystemSettings";
import UsersSettings from "./UsersSettings";
import NotificationSettings from "./NotificationSettings";

const SETTINGS_TABS = [
  { id: "system", label: "Hệ thống", icon: SettingsIcon },
  { id: "users", label: "Người dùng", icon: Users },
  { id: "notifications", label: "Thông báo", icon: Bell },
];

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("system");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Cài đặt</h2>
        <p className="text-muted-foreground">
          Quản lý hệ thống, người dùng và thông báo
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        {/* Tab Navigation */}
        <ScrollArea className="w-full">
          <TabsList className="inline-flex h-auto p-1 bg-muted w-full justify-start gap-1">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-background"
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </ScrollArea>

        {/* Tab Contents */}
        <TabsContent value="system" className="mt-6">
          <SystemSettings />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UsersSettings />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
