"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, FileText, FileCheck } from "lucide-react";
import {
  marketReadiness,
  getReadinessColor,
  certificateList,
} from "@/lib/dashboardData";
import { useDashboardTitle } from "@/contexts/DashboardContext";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("export");

  const { setPageTitle } = useDashboardTitle();

  useEffect(() => {
    setPageTitle(t("title"), t("subtitle"));
  }, [setPageTitle, t]);

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {t("marketReadiness")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {marketReadiness.map((market) => (
              <div
                key={t(market.market)}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold">
                    {market.market.replace("m", "")}
                  </span>
                  <div>
                    <p className="font-medium">
                      {t(market.market.concat(".title"))}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t(market.market.concat(".location"))}
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
              {t("certificates")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {certificateList.map((doc, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileCheck className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{t(doc.name)}</p>
                    {doc.expires && (
                      <p className="text-xs text-muted-foreground">
                        Hết hạn: {t(doc.expires)}
                      </p>
                    )}
                  </div>
                </div>
                {getStatusBadge(t(doc.status))}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExportClient;
