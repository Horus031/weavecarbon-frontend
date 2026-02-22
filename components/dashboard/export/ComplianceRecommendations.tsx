"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
  AlertTriangle,
  FileText,
  Leaf,
  Shield,
  Package,
  ChevronDown,
  CheckCircle2
} from "lucide-react";
import { PRIORITY_CONFIG, type ComplianceDocument, type Recommendation } from "./types";

interface ComplianceRecommendationsProps {
  recommendations: Recommendation[];
  documents: ComplianceDocument[];
}

const TYPE_ICONS = {
  document: FileText,
  carbon_data: Leaf,
  verification: Shield,
  product_scope: Package
};

const ComplianceRecommendations: React.FC<ComplianceRecommendationsProps> = ({
  recommendations,
  documents
}) => {
  const t = useTranslations("export.recommendations");
  const activeRecommendations = recommendations.filter((recommendation) => recommendation.status === "active");
  const normalizeDocumentKey = (value?: string) =>
    (value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "");
  const isDocumentFulfilled = (document: ComplianceDocument) =>
    document.status === "uploaded" || document.status === "approved";

  const hasDocumentForRecommendation = (recommendation: Recommendation) => {
    if (recommendation.type !== "document") {
      return false;
    }

    const relatedDocumentKey = normalizeDocumentKey(recommendation.relatedDocumentId);
    const missingItemKey = normalizeDocumentKey(recommendation.missingItem);

    return documents.some((document) => {
      if (!isDocumentFulfilled(document)) {
        return false;
      }

      const documentKeys = [
        normalizeDocumentKey(document.id),
        normalizeDocumentKey(document.name),
        normalizeDocumentKey(document.type)
      ].filter(Boolean);

      if (relatedDocumentKey) {
        const byRelatedId = documentKeys.some(
          (key) =>
            key === relatedDocumentKey ||
            key.includes(relatedDocumentKey) ||
            relatedDocumentKey.includes(key)
        );
        if (byRelatedId) return true;
      }

      if (!missingItemKey) {
        return false;
      }

      return documentKeys.some(
        (key) =>
          key === missingItemKey || key.includes(missingItemKey) || missingItemKey.includes(key)
      );
    });
  };

  if (activeRecommendations.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-600" />
          <h3 className="font-semibold text-green-800">{t("allComplete")}</h3>
          <p className="mt-1 text-sm text-green-600">{t("allCompleteDesc")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-col gap-2 text-lg md:flex-row md:items-center">
          <Badge variant="secondary" className="static md:hidden">
            {t("items", { count: activeRecommendations.length })}
          </Badge>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            {t("title")}
          </div>
          <Badge variant="secondary" className="ml-auto hidden md:static">
            {t("items", { count: activeRecommendations.length })}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeRecommendations.map((recommendation) => {
          const Icon = TYPE_ICONS[recommendation.type];
          const priorityConfig = PRIORITY_CONFIG[recommendation.priority];
          const hasRequiredDocument = hasDocumentForRecommendation(recommendation);
          const impactText =
            typeof recommendation.businessImpact === "string" &&
            recommendation.businessImpact.trim().length > 0
              ? recommendation.businessImpact
              : "Chua co thong tin anh huong neu thieu.";

          return (
            <Collapsible key={recommendation.id} className="mx-auto max-w-xs md:max-w-full">
              <div className="overflow-hidden rounded-lg border">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors">
                    <div className={`shrink-0 rounded-lg p-2 ${priorityConfig.bgColor}`}>
                      <Icon className={`h-4 w-4 ${priorityConfig.color}`} />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge className={`${priorityConfig.bgColor} ${priorityConfig.color} text-xs`}>
                          {priorityConfig.label}
                        </Badge>
                        {hasRequiredDocument && (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                            {t("alreadyAvailable")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium">{recommendation.missingItem}</p>
                    </div>
                    <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="w-full">
                  <div className="space-y-4 border-t bg-muted/30 px-4 pb-4 pt-0">
                    <div className="pt-4">
                      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("legalReason")}
                      </h4>
                      <p className="text-sm">{recommendation.regulatoryReason}</p>
                    </div>

                    <div>
                      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("impact")}
                      </h4>
                      <p className="rounded bg-orange-50 p-2 text-sm text-orange-700">
                        {impactText}
                      </p>
                    </div>

                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default ComplianceRecommendations;
