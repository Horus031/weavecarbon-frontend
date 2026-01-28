"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Package } from "lucide-react";

interface HistoryEmptyStateProps {
  onNavigateAssessment: () => void;
}

const HistoryEmptyState: React.FC<HistoryEmptyStateProps> = ({
  onNavigateAssessment,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chi tiết lịch sử</CardTitle>
        <CardDescription>Tất cả các lần tính toán carbon</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Chưa có lịch sử</h3>
          <p className="text-muted-foreground mb-4">
            Bắt đầu bằng cách nhập thông tin sản phẩm và vận chuyển
          </p>
          <Button onClick={onNavigateAssessment}>
            <Package className="w-4 h-4 mr-2" />
            Tạo sản phẩm mới
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoryEmptyState;
