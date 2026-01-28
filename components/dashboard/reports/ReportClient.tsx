"use client"

import React, { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { useDashboardTitle } from "@/contexts/DashboardContext";

const ReportClient: React.FC = () => {
  const { setPageTitle } = useDashboardTitle();

  useEffect(() => {
    setPageTitle("Reports", "Overview of your carbon tracking");
  }, [setPageTitle]);
  const reports = [
    {
      title: "Báo cáo Carbon tháng 1/2024",
      type: "PDF",
      date: "2024-01-31",
      size: "2.4 MB",
    },
    {
      title: "Báo cáo Carbon tháng 12/2023",
      type: "PDF",
      date: "2023-12-31",
      size: "2.1 MB",
    },
    {
      title: "Báo cáo tổng hợp Q4/2023",
      type: "PDF",
      date: "2024-01-15",
      size: "5.8 MB",
    },
    {
      title: "Dữ liệu vận chuyển 2023",
      type: "Excel",
      date: "2024-01-10",
      size: "1.2 MB",
    },
    {
      title: "Phân tích vật liệu 2023",
      type: "PDF",
      date: "2024-01-05",
      size: "3.4 MB",
    },
    {
      title: "Báo cáo CBAM Q4/2023",
      type: "PDF",
      date: "2024-01-20",
      size: "4.2 MB",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Báo cáo & Thống kê</h2>
          <p className="text-muted-foreground">
            Tạo và tải xuống các báo cáo carbon
          </p>
        </div>
        <Button className="gap-2">
          <Download className="w-4 h-4" /> Xuất báo cáo
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {reports.map((report, i) => (
          <Card
            key={i}
            className="hover:shadow-md transition-shadow cursor-pointer"
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{report.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {report.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {report.size}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {report.date}
                  </p>
                </div>
                <Button variant="ghost" size="icon">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReportClient;
