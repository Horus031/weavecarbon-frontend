"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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

const DEFAULT_NOTIFICATIONS: NotificationSetting[] = [
  {
    id: "product_created",
    label: "Sản phẩm mới",
    description: "Thông báo khi có sản phẩm mới được tạo",
    email: false,
  },
  {
    id: "product_updated",
    label: "Cập nhật sản phẩm",
    description: "Thông báo khi sản phẩm được cập nhật",
    email: false,
  },
  {
    id: "shipment_status",
    label: "Trạng thái vận chuyển",
    description: "Thông báo khi shipment thay đổi trạng thái",
    email: true,
  },
  {
    id: "report_ready",
    label: "Báo cáo sẵn sàng",
    description: "Thông báo khi báo cáo được tạo xong",
    email: true,
  },
  {
    id: "export_completed",
    label: "Export hoàn tất",
    description: "Thông báo khi file export đã sẵn sàng",
    email: false,
  },
  {
    id: "user_invited",
    label: "Tài khoản mới",
    description: "Thông báo khi có tài khoản mới được tạo",
    email: true,
  },
  {
    id: "compliance_deadline",
    label: "Deadline compliance",
    description: "Nhắc nhở về các deadline compliance sắp đến",
    email: true,
  },
];

const NotificationSettings: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationSetting[]>(
    DEFAULT_NOTIFICATIONS,
  );

  const handleToggle = (id: string, value: boolean) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, email: value } : n)),
    );
  };

  const handleSave = () => {
    toast.success("Đã lưu cài đặt thông báo");
  };

  const handleEnableAll = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, email: true })));
    toast.success("Đã bật tất cả thông báo email");
  };

  const handleDisableAll = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, email: false })));
    toast.success("Đã tắt tất cả thông báo email");
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Thông báo Email
              </CardTitle>
              <CardDescription>
                Cấu hình thông báo gửi qua email
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleEnableAll}>
                Bật tất cả
              </Button>
              <Button variant="outline" size="sm" onClick={handleDisableAll}>
                Tắt tất cả
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="flex items-center justify-between py-3 border-b last:border-0"
            >
              <div className="flex-1">
                <Label className="font-medium">{notification.label}</Label>
                <p className="text-sm text-muted-foreground">
                  {notification.description}
                </p>
              </div>
              <Switch
                checked={notification.email}
                onCheckedChange={(v: boolean) =>
                  handleToggle(notification.id, v)
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>Lưu cài đặt thông báo</Button>
      </div>
    </div>
  );
};

export default NotificationSettings;
