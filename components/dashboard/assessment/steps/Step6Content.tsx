import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  Send,
  Clock,
  CheckCircle2,
  FileText,
  Package,
  Leaf,
  Factory,
  Truck,
  AlertCircle
} from "lucide-react";
import {
  ProductAssessmentData,
  DraftVersion,
  PRODUCT_TYPES,
  DESTINATION_MARKETS
} from "./types";

interface Step6SaveHistoryProps {
  data: ProductAssessmentData;
  draftHistory: DraftVersion[];
  onSaveDraft: () => void;
  onPublish: () => void;
  isSubmitting?: boolean;
}

const Step6Content: React.FC<Step6SaveHistoryProps> = ({
  data,
  draftHistory,
  onSaveDraft,
  onPublish,
  isSubmitting = false
}) => {
  const t = useTranslations("assessment.step6");
  const locale = useLocale();
  const displayLocale = locale === "vi" ? "vi-VN" : "en-US";

  const productType = PRODUCT_TYPES.find((type) => type.value === data.productType);
  const productTypeLabel =
    productType && t.has(`productTypes.${productType.value}`)
      ? t(`productTypes.${productType.value}`)
      : productType?.label || data.productType;

  const market = DESTINATION_MARKETS.find(
    (destination) => destination.value === data.destinationMarket
  );
  const marketLabel =
    market && t.has(`markets.${market.value}`)
      ? t(`markets.${market.value}`)
      : market?.label || data.destinationMarket;

  const canPublish =
    Boolean(data.carbonResults) &&
    Boolean(data.productCode) &&
    Boolean(data.productName) &&
    data.quantity > 0 &&
    data.materials.length > 0;

  const isHighConfidence = data.carbonResults?.confidenceLevel === "high";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{t("summary.title")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("summary.subtitle")}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t("summary.productCode")}</p>
              <p className="font-semibold">{data.productCode || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t("summary.productName")}</p>
              <p className="font-semibold">{data.productName || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t("summary.productType")}</p>
              <p className="font-medium">{productTypeLabel}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t("summary.quantity")}</p>
              <p className="font-medium">
                {t("summary.quantityValue", {
                  value: data.quantity?.toLocaleString(displayLocale) || "0"
                })}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Leaf className="w-5 h-5 mx-auto text-green-600 mb-1" />
              <p className="text-xs text-muted-foreground">{t("stats.materials")}</p>
              <p className="font-semibold">{data.materials.length}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Factory className="w-5 h-5 mx-auto text-blue-600 mb-1" />
              <p className="text-xs text-muted-foreground">{t("stats.processes")}</p>
              <p className="font-semibold">{data.productionProcesses?.length || 0}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Truck className="w-5 h-5 mx-auto text-purple-600 mb-1" />
              <p className="text-xs text-muted-foreground">{t("stats.transportLegs")}</p>
              <p className="font-semibold">{data.transportLegs?.length || 0}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Package className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-xs text-muted-foreground">{t("stats.market")}</p>
              <p className="font-semibold text-xs">{marketLabel || "—"}</p>
            </div>
          </div>

          <Separator />

          {data.carbonResults ? (
            <div className="p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold">{t("result.title")}</p>
                <Badge
                  variant="outline"
                  className={
                    data.carbonResults.confidenceLevel === "high"
                      ? "bg-green-500/10 text-green-600 border-green-500/30"
                      : data.carbonResults.confidenceLevel === "medium"
                        ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/30"
                        : "bg-red-500/10 text-red-600 border-red-500/30"
                  }
                >
                  {t("result.confidenceLabel")}: {" "}
                  {data.carbonResults.confidenceLevel === "high"
                    ? t("result.confidence.high")
                    : data.carbonResults.confidenceLevel === "medium"
                      ? t("result.confidence.medium")
                      : t("result.confidence.low")}
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t("result.co2PerProduct")}</p>
                  <p className="text-2xl font-bold text-primary">
                    {data.carbonResults.perProduct.total.toFixed(3)} {t("result.unitKg")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("result.totalBatch")}</p>
                  <p className="text-2xl font-bold text-primary">
                    {data.carbonResults.totalBatch.total.toFixed(2)} {t("result.unitKg")}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{t("actions.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canPublish ? (
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-700">{t("actions.notReady")}</p>
                  <ul className="text-yellow-600 mt-1 space-y-1">
                    {!data.productCode ? <li>• {t("actions.missing.productCode")}</li> : null}
                    {!data.productName ? <li>• {t("actions.missing.productName")}</li> : null}
                    {!data.quantity ? <li>• {t("actions.missing.quantity")}</li> : null}
                    {data.materials.length === 0 ? (
                      <li>• {t("actions.missing.materials")}</li>
                    ) : null}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={onSaveDraft}
              disabled={isSubmitting}
              className="flex-1"
            >
              <Save className="w-5 h-5 mr-2" />
              {t("actions.saveDraft")}
            </Button>
            <Button
              size="lg"
              onClick={onPublish}
              disabled={!canPublish || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  {t("actions.processing")}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  {t("actions.publish")}
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {isHighConfidence ? t("actions.readyNote") : t("actions.needMoreDataNote")}
          </p>
        </CardContent>
      </Card>

      {draftHistory.length > 0 ? (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">{t("history.title")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {draftHistory.map((draft, index) => (
                <div
                  key={draft.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">v{draft.version}</Badge>
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(draft.timestamp).toLocaleDateString(displayLocale, {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                      {draft.note ? (
                        <p className="text-xs text-muted-foreground">{draft.note}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {index === 0 ? (
                      <Badge className="bg-primary/10 text-primary border-0">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {t("history.current")}
                      </Badge>
                    ) : null}
                    <Button variant="ghost" size="sm">
                      {t("history.view")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default Step6Content;
