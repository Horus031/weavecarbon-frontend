"use client";

import React, { useState, useEffect } from "react";
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

      toast.success("Đã cập nhật thông tin hệ thống");
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
      toast.error("Không thể cập nhật thông tin");
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
                Thông tin công ty
              </CardTitle>
              <CardDescription>
                Quản lý thông tin cơ bản của doanh nghiệp
              </CardDescription>
            </div>
            {!editMode ? (
              <Button variant="outline" onClick={() => setEditMode(true)}>
                Chỉnh sửa
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setEditMode(false)}>
                  <X className="w-4 h-4 mr-1" /> Hủy
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-1" /> Lưu
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tên công ty / Brand</Label>
              {editMode ? (
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              ) : (
                <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                  {company?.name || "Chưa cập nhật"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Loại hình kinh doanh</Label>
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
                    <SelectItem value="brand">Thương hiệu (Brand)</SelectItem>
                    <SelectItem value="factory">
                      Nhà máy sản xuất (Factory)
                    </SelectItem>
                    <SelectItem value="shop_online">Shop Online</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                  {company?.business_type === "brand" && "Thương hiệu (Brand)"}
                  {company?.business_type === "factory" &&
                    "Nhà máy sản xuất (Factory)"}
                  {company?.business_type === "shop_online" && "Shop Online"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Gói dịch vụ</Label>
              <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                {company?.current_plan?.toUpperCase() || "STARTER"}
              </p>
            </div>
          </div>

          {isDemoTenant && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-600">
              ⚠️ Đây là tài khoản Demo. Một số thay đổi có thể bị giới hạn.
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Thông tin hệ thống
          </CardTitle>
          <CardDescription>
            Chi tiết về môi trường và trạng thái
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <Label className="text-muted-foreground">Loại tài khoản</Label>
                <Badge
                  className={
                    isDemoTenant
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      : "bg-primary/10 text-primary border-primary/20"
                  }
                >
                  {isDemoTenant ? "DEMO" : "PRODUCTION"}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <Label className="text-muted-foreground">Ngày tạo</Label>
                <span className="text-sm">
                  {format(new Date("2024-01-15"), "dd/MM/yyyy")}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <Label className="text-muted-foreground">Phiên bản API</Label>
                <span className="text-sm font-mono">v1.0.0</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <Label className="text-muted-foreground">Region</Label>
                <span className="text-sm">Asia Pacific (Singapore)</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <Label className="text-muted-foreground">Status</Label>
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  Active
                </Badge>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <Label className="text-muted-foreground">Uptime</Label>
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
            Giới hạn sử dụng
          </CardTitle>
          <CardDescription>
            Thông tin về giới hạn của gói dịch vụ hiện tại
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-muted-foreground">Sản phẩm</Label>
                <span className="text-sm font-medium">12 / 100</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "12%" }} />
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-muted-foreground">Thành viên</Label>
                <span className="text-sm font-medium">3 / 5</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "60%" }} />
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-muted-foreground">API Calls/tháng</Label>
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
              <p className="font-medium">Nâng cấp lên Standard</p>
              <p className="text-sm text-muted-foreground">
                Mở khóa nhiều tính năng và giới hạn cao hơn
              </p>
            </div>
            <Button>Nâng cấp ngay</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;
