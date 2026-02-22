
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger } from
"@/components/ui/tooltip";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileDown,
  QrCode,
  ShieldCheck,
  Info } from
"lucide-react";
import { ComplianceItem } from "@/lib/carbonDetailData";

interface ComplianceStatusProps {
  compliance: ComplianceItem[];
  exportReady: boolean;
  onDownloadReport?: () => void;
  onGenerateQR?: () => void;
}

const STATUS_ICON = {
  passed: CheckCircle2,
  partial: AlertCircle,
  failed: XCircle
};

const STATUS_COLOR = {
  passed: "text-green-600",
  partial: "text-yellow-600",
  failed: "text-red-600"
};

const ComplianceStatus: React.FC<ComplianceStatusProps> = ({
  compliance,
  exportReady,
  onDownloadReport,
  onGenerateQR
}) => {
  const t = useTranslations("productDetail.compliance");
  const passedCount = compliance.filter((c) => c.status === "passed").length;
  const totalCount = compliance.length;
  const exportBadgeClass = exportReady ?
  "border border-emerald-200 bg-emerald-50 text-emerald-700" :
  "border border-amber-200 bg-amber-50 text-amber-700";

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5 text-primary" />
            {t("title")}
          </CardTitle>
          <Badge className={exportBadgeClass}>
            {exportReady ?
            <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {t("exportReady")}
              </> :

            <>
                <AlertCircle className="w-3 h-3 mr-1" />
                {t("needMoreData")}
              </>
            }
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="space-y-2">
          {compliance.map((item, index) => {
            const Icon = STATUS_ICON[item.status];
            const colorClass = STATUS_COLOR[item.status];

            return (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 p-3">

                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${colorClass}`} />
                  <span className="font-medium">{item.criterion}</span>
                </div>
                {item.note &&
                <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">{item.note}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                }
              </div>);

          })}
        </div>

        
        <div className="py-2 text-center text-sm text-slate-600">
          {t("criteriaCount", { passed: passedCount, total: totalCount })}
        </div>

        
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            variant="outline"
            className="w-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            onClick={onDownloadReport}>

            <FileDown className="w-4 h-4 mr-2" />
            {t("downloadReport")}
          </Button>
          <Button
            className={
            exportReady ?
            "w-full bg-emerald-600 text-white hover:bg-emerald-700" :
            "w-full border border-slate-200 bg-slate-100 text-slate-500"
            }
            onClick={onGenerateQR}
            disabled={!exportReady}>

            <QrCode className="w-4 h-4 mr-2" />
            {t("generateQR")}
          </Button>
        </div>

        {!exportReady &&
        <p className="text-xs text-center text-slate-500">
            {t("qrNotAvailable")}
          </p>
        }
      </CardContent>
    </Card>);

};

export default ComplianceStatus;