// Section F - Export & Compliance Status
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileDown,
  QrCode,
  ShieldCheck,
  Info,
} from "lucide-react";
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
  failed: XCircle,
};

const STATUS_COLOR = {
  passed: "text-green-600",
  partial: "text-yellow-600",
  failed: "text-red-600",
};

const ComplianceStatus: React.FC<ComplianceStatusProps> = ({
  compliance,
  exportReady,
  onDownloadReport,
  onGenerateQR,
}) => {
  const passedCount = compliance.filter((c) => c.status === "passed").length;
  const totalCount = compliance.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Trạng thái tuân thủ xuất khẩu
          </CardTitle>
          <Badge
            className={
              exportReady
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }
          >
            {exportReady ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Sẵn sàng xuất khẩu
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 mr-1" />
                Cần bổ sung dữ liệu
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Compliance Checklist */}
        <div className="space-y-2">
          {compliance.map((item, index) => {
            const Icon = STATUS_ICON[item.status];
            const colorClass = STATUS_COLOR[item.status];

            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${colorClass}`} />
                  <span className="font-medium">{item.criterion}</span>
                </div>
                {item.note && (
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
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="text-sm text-muted-foreground text-center py-2">
          <span className="font-medium">
            {passedCount}/{totalCount}
          </span>{" "}
          tiêu chí đạt yêu cầu
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={onDownloadReport}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Tải Carbon Report
          </Button>
          <Button
            variant={exportReady ? "default" : "secondary"}
            className="w-full"
            onClick={onGenerateQR}
            disabled={!exportReady}
          >
            <QrCode className="w-4 h-4 mr-2" />
            Tạo QR Code
          </Button>
        </div>

        {!exportReady && (
          <p className="text-xs text-center text-muted-foreground">
            QR Code chỉ khả dụng khi sản phẩm đạt đủ tiêu chí xuất khẩu
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ComplianceStatus;
