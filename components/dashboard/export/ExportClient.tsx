"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, FileText, FileCheck } from "lucide-react";
import { marketReadiness, getReadinessColor } from "@/lib/dashboardData";
import { useDashboardTitle } from "@/contexts/DashboardContext";
import { useEffect } from "react";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "valid":
      return <Badge className="bg-green-100 text-green-700">Hợp lệ</Badge>;
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-700">Chờ duyệt</Badge>;
    case "draft":
      return <Badge variant="secondary">Nháp</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const ExportClient: React.FC = () => {
  const { setPageTitle } = useDashboardTitle();

  useEffect(() => {
    setPageTitle("Export", "Overview of your carbon tracking");
  }, [setPageTitle]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Xuất khẩu & Tuân thủ</h2>
        <p className="text-muted-foreground">
          Quản lý hồ sơ xuất khẩu và kiểm tra tuân thủ quy định quốc tế
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Mức độ sẵn sàng theo thị trường
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {marketReadiness.map((market) => (
              <div
                key={market.market}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold">{market.market}</span>
                  <div>
                    <p className="font-medium">
                      Thị trường{" "}
                      {market.market === "EU"
                        ? "Châu Âu"
                        : market.market === "US"
                          ? "Mỹ"
                          : market.market === "JP"
                            ? "Nhật Bản"
                            : "Hàn Quốc"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {market.market === "EU"
                        ? "CBAM, EU Green Deal"
                        : market.market === "US"
                          ? "California Climate"
                          : market.market === "JP"
                            ? "JIS Standards"
                            : "K-ETS"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getReadinessColor(market.score)}>
                    {market.score}%
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Chứng chỉ & Giấy tờ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                name: "GOTS Certificate",
                status: "valid",
                expires: "2024-12-31",
              },
              {
                name: "OEKO-TEX Standard 100",
                status: "valid",
                expires: "2024-08-15",
              },
              {
                name: "Carbon Footprint Report",
                status: "pending",
                expires: null,
              },
              { name: "EU Product Passport", status: "draft", expires: null },
            ].map((doc, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileCheck className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{doc.name}</p>
                    {doc.expires && (
                      <p className="text-xs text-muted-foreground">
                        Hết hạn: {doc.expires}
                      </p>
                    )}
                  </div>
                </div>
                {getStatusBadge(doc.status)}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExportClient;
