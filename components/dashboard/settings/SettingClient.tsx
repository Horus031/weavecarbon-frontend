"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Settings } from "lucide-react";
import { useDashboardTitle } from "@/contexts/DashboardContext";
import { useToast } from "@/hooks/useToast";

interface Company {
  id: string;
  name: string;
  current_plan: string;
  business_type?: string;
  target_markets?: string[];
}

interface Profile {
  full_name: string | null;
}

const SettingClient: React.FC = () => {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log("User Settings", user);
  console.log("User Company", company);
  const { toast } = useToast();

  const { setPageTitle } = useDashboardTitle();
  const supabase = createClient();

  useEffect(() => {
    setPageTitle("Settings", "Quản lý tài khoản và cấu hình hệ thống");
  }, [setPageTitle]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Set profile from user context
        setProfile({
          full_name: user.full_name || null,
        });

        // Fetch company data if user has a company_id
        if (user.company_id) {
          const { data: companyData, error } = await supabase
            .from("companies")
            .select("id, name, current_plan, business_type, target_markets")
            .eq("id", user.company_id)
            .single();

          if (error) {
            console.error("Error fetching company:", error);
            toast({
              title: "Error",
              description: "Failed to load company information.",
              variant: "destructive",
            });
          } else if (companyData) {
            setCompany(companyData);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Something went wrong while loading settings.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, supabase, toast]);

  const getPlanFeatures = (plan: string) => {
    const features: Record<string, string[]> = {
      starter: ["✓ Tối đa 100 SKU", "✓ Báo cáo cơ bản", "✓ Hỗ trợ email"],
      professional: [
        "✓ Tối đa 500 SKU",
        "✓ Báo cáo nâng cao",
        "✓ Hỗ trợ chat 24/7",
        "✓ API access",
      ],
      premium: [
        "✓ Unlimited SKU",
        "✓ Báo cáo custom",
        "✓ Hỗ trợ ưu tiên",
        "✓ API access",
        "✓ Tư vấn kỹ thuật",
      ],
    };
    return features[plan.toLowerCase()] || features.starter;
  };

  const getPlanDescription = (plan: string) => {
    const descriptions: Record<string, string> = {
      starter: "Phù hợp cho doanh nghiệp vừa và nhỏ",
      professional: "Phù hợp cho doanh nghiệp vừa",
      premium: "Phù hợp cho doanh nghiệp lớn",
    };
    return descriptions[plan.toLowerCase()] || "Chọn gói phù hợp";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Cài đặt</h2>
        <p className="text-muted-foreground">
          Quản lý tài khoản và cấu hình hệ thống
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Account Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Thông tin tài khoản
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-6 bg-muted rounded animate-pulse" />
                <div className="h-6 bg-muted rounded animate-pulse" />
                <div className="h-6 bg-muted rounded animate-pulse" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Họ tên</label>
                  <p className="text-muted-foreground">
                    {user?.full_name || "Chưa cập nhật"}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Công ty</label>
                  <p className="text-muted-foreground">
                    {company?.name || "Chưa cập nhật"}
                  </p>
                </div>
              </>
            )}
            <Button variant="outline" className="w-full">
              Chỉnh sửa thông tin
            </Button>
          </CardContent>
        </Card>

        {/* Service Plan Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Gói dịch vụ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-24 bg-muted rounded animate-pulse" />
                <div className="h-10 bg-muted rounded animate-pulse" />
              </div>
            ) : (
              <>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-lg">
                      {company?.current_plan?.toUpperCase() || "STARTER"}
                    </h4>
                    <Badge className="bg-primary text-primary-foreground">
                      Đang sử dụng
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {getPlanDescription(company?.current_plan || "starter")}
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    {getPlanFeatures(company?.current_plan || "starter").map(
                      (feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ),
                    )}
                  </ul>
                </div>
                <Button className="w-full">Nâng cấp gói</Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingClient;
