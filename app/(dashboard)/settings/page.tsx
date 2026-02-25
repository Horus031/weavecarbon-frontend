import SettingClient from "@/components/dashboard/settings/SettingClient";
import React from "react";
import ScopedIntlProvider from "@/components/i18n/ScopedIntlProvider";
import { DASHBOARD_SETTINGS_NAMESPACES } from "@/lib/i18n/namespaces";

const SettingPage: React.FC = () => {
  return (
    <ScopedIntlProvider namespaces={DASHBOARD_SETTINGS_NAMESPACES}>
      <SettingClient />
    </ScopedIntlProvider>);
};

export default SettingPage;
