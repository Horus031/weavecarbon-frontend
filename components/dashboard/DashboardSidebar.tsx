"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authTokenStore } from "@/lib/apiClient";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import {
  Leaf,
  LogOut,
  Package,
  Truck,
  FileCheck,
  TrendingUp,
  BarChart3,
  Settings,
  Menu,
  X } from
"lucide-react";
import { useRouter } from "next/navigation";
import { Company, Profile } from "@/types/app.type";
import { useTranslations } from "next-intl";

interface DashboardSidebarProps {
  company: Company | null;
  profile: Profile | null;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const menuItems = [
{
  icon: BarChart3,
  labelKey: "overview",
  path: "/overview"
},
{
  icon: Package,
  labelKey: "product",
  path: "/products"
},
{
  icon: Truck,
  labelKey: "logistics",
  path: "/logistics"
},
{ icon: FileCheck, labelKey: "export", path: "/export" },
{
  icon: TrendingUp,
  labelKey: "reports",
  path: "/reports"
},
{
  icon: Settings,
  labelKey: "settings",
  path: "/settings"
}];


const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  company,
  profile,
  sidebarOpen,
  onToggleSidebar
}) => {
  const t = useTranslations("sidebar");
  const { user, signOut } = useAuth();
  const { canAccessSettings } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();
  const hasSession = Boolean(user?.id || profile?.id || authTokenStore.getAccessToken());
  const homeHref = hasSession ? "/overview" : "/";

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  const visibleMenuItems = menuItems.filter((item) =>
  item.path === "/settings" ? canAccessSettings : true
  );

  return (
    <>
      
      {sidebarOpen &&
      <div
        className="fixed inset-0 bg-black/50 lg:hidden z-40"
        onClick={onToggleSidebar} />

      }

      
      <aside
        className={`fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col shrink-0 z-50 lg:z-auto ${
        sidebarOpen ? "w-64" : "-translate-x-full"}`
        }>
        
        <div className="p-4 border-b border-border">
          <div className="flex justify-end mb-3 lg:hidden">
            <Button
              className="lg:hidden"
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}>
              
              {sidebarOpen ?
              <X className="w-4 h-4" /> :

              <Menu className="w-4 h-4" />
              }
            </Button>
          </div>
          <Link href={homeHref} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-forest rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            {sidebarOpen &&
            <span className="font-display font-bold text-foreground">
                WEAVE<span className="text-primary">CARBON</span>
              </span>
            }
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {visibleMenuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                onClick={onToggleSidebar}
                key={item.path}
                href={item.path}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                active ?
                "bg-primary/10 text-primary" :
                "text-muted-foreground hover:bg-muted hover:text-foreground"}`
                }>
                
                <item.icon className="w-5 h-5 shrink-0" />
                {sidebarOpen &&
                <span className="text-sm font-medium">
                    {t(item.labelKey)}
                  </span>
                }
              </Link>);

          })}
        </nav>

        <div className="p-4 border-t border-border">
          {sidebarOpen &&
          <div className="mb-3">
              <p className="font-medium text-sm truncate">
                {profile?.full_name || user?.email}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {company?.name || "No company"}
              </p>
            </div>
          }
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleSignOut}>
            
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span className="ml-2">{t("signOut")}</span>}
          </Button>
        </div>
      </aside>
    </>);

};

export default DashboardSidebar;
