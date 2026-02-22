
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  ClipboardList,
  ExternalLink } from
"lucide-react";
import { DataCompletenessItem } from "@/lib/carbonDetailData";

interface DataCompletenessCheckProps {
  completeness: DataCompletenessItem[];
  productId: string;
}

const STATUS_CONFIG = {
  complete: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
    label: "Đầy đủ"
  },
  partial: {
    icon: AlertCircle,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    label: "Một phần"
  },
  missing: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    label: "Thiếu"
  }
};

const DataCompletenessCheck: React.FC<DataCompletenessCheckProps> = ({
  completeness,
  productId
}) => {
  const router = useRouter();

  const completeCount = completeness.filter(
    (c) => c.status === "complete"
  ).length;
  const totalCount = completeness.length;
  const completionPercentage = Math.round(completeCount / totalCount * 100);

  const handleJumpTo = (jumpTo?: string) => {
    if (jumpTo) {
      router.push(jumpTo.replace(":productId", productId));
    }
  };

  return (
    <Card className="border-dashed border-yellow-300 bg-yellow-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="w-5 h-5 text-yellow-600" />
            Kiểm tra độ đầy đủ dữ liệu
          </CardTitle>
          <span className="text-sm font-medium text-muted-foreground">
            {completionPercentage}% hoàn thành
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {completeness.map((item) => {
          const config = STATUS_CONFIG[item.status];
          const Icon = config.icon;

          return (
            <div
              key={item.field}
              className={`flex items-center justify-between p-3 rounded-lg ${config.bg}`}>
              
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${config.color}`} />
                <div>
                  <span className="font-medium">{item.label}</span>
                  {item.note &&
                  <p className="text-xs text-muted-foreground">{item.note}</p>
                  }
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${config.color}`}>
                  {config.label}
                </span>
                {item.status !== "complete" && item.jumpTo &&
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => handleJumpTo(item.jumpTo)}>
                  
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Bổ sung
                  </Button>
                }
              </div>
            </div>);

        })}

        {completionPercentage < 100 &&
        <p className="text-xs text-center text-muted-foreground pt-2">
            Nhấn vào &quot;Bổ sung&quot; để nhập dữ liệu còn thiếu
          </p>
        }
      </CardContent>
    </Card>);

};

export default DataCompletenessCheck;