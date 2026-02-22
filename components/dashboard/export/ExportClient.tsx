"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck,
  FileText,
  Globe,
  Loader2,
  Trash2,
  Upload
} from "lucide-react";
import { useDashboardTitle } from "@/contexts/DashboardContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  fetchComplianceMarkets,
  removeComplianceDocument,
  uploadComplianceDocument
} from "@/lib/exportComplianceApi";
import type { DocumentStatus, MarketCode, MarketCompliance } from "./types";
import ComplianceDetailModal from "./ComplianceDetailModal";

interface SummaryDocument {
  id: string;
  documentId: string;
  market: MarketCode;
  name: string;
  expires: string | null;
}

interface UploadTarget {
  key: string;
  market: MarketCode;
  marketName: string;
  documentId: string;
  documentName: string;
  required: boolean;
  status: DocumentStatus;
}

type UploadMarketFilter = "ALL" | MarketCode;

const getUploadTargetKey = (market: MarketCode, documentId: string) => `${market}::${documentId}`;

const getMarketRegulation = (code: MarketCode) => {
  switch (code) {
    case "EU":
      return "CBAM, EU Green Deal";
    case "US":
      return "California Climate";
    case "JP":
      return "JIS Standards";
    case "KR":
      return "K-ETS";
    case "VN":
      return "Vietnam GHG / MRV";
    default:
      return "";
  }
};

const getReadinessColor = (score: number): string => {
  if (score >= 80) {
    return "bg-green-50 text-green-700 border border-green-200";
  }
  if (score >= 50) {
    return "bg-yellow-50 text-yellow-700 border border-yellow-200";
  }
  return "bg-red-50 text-red-700 border border-red-200";
};

const clampReadiness = (score: number) => Math.max(0, Math.min(100, score));

const normalizeDocumentKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");

const computeRequiredDocumentReadiness = (marketData: MarketCompliance) => {
  const requiredDocsFromDocuments = marketData.documents.filter((document) => document.required);
  if (requiredDocsFromDocuments.length > 0) {
    const approvedRequiredCount = requiredDocsFromDocuments.filter(
      (document) => document.status === "approved"
    ).length;
    return Math.max(
      0,
      Math.min(100, Math.round((approvedRequiredCount / requiredDocsFromDocuments.length) * 100))
    );
  }

  const requiredNameKeySet = new Set(
    marketData.requiredDocuments.map(normalizeDocumentKey).filter(Boolean)
  );
  const requiredTotal = Math.max(marketData.requiredDocumentsCount, requiredNameKeySet.size);
  if (requiredTotal <= 0) {
    return 100;
  }

  const approvedRequiredCount =
    requiredNameKeySet.size > 0
      ? marketData.documents.filter((document) => {
          if (document.status !== "approved") return false;
          const keys = [document.id, document.name, document.type]
            .map(normalizeDocumentKey)
            .filter(Boolean);
          return keys.some((key) => requiredNameKeySet.has(key));
        }).length
      : marketData.documents.filter((document) => document.status === "approved").length;

  return Math.max(
    0,
    Math.min(100, Math.round((Math.min(approvedRequiredCount, requiredTotal) / requiredTotal) * 100))
  );
};

const computeMarketReadinessScore = (marketData: MarketCompliance) => {
  if (Number.isFinite(marketData.score)) {
    return clampReadiness(Math.round(marketData.score * 100) / 100);
  }
  return computeRequiredDocumentReadiness(marketData);
};

const ExportPage: React.FC = () => {
  const t = useTranslations("export");
  const { setPageTitle } = useDashboardTitle();

  const [selectedMarket, setSelectedMarket] = useState<MarketCode | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [complianceData, setComplianceData] = useState<Record<MarketCode, MarketCompliance> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadTargetSearch, setUploadTargetSearch] = useState("");
  const [uploadMarketFilter, setUploadMarketFilter] = useState<UploadMarketFilter>("ALL");
  const [pendingUploadTargetKey, setPendingUploadTargetKey] = useState<string | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [removingDocumentKey, setRemovingDocumentKey] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPageTitle(t("title"), t("subtitle"));
  }, [setPageTitle, t]);

  const loadComplianceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchComplianceMarkets();
      setComplianceData(payload);
    } catch (loadError) {
      console.error("Failed to load export compliance data:", loadError);
      setComplianceData(null);
      setError(loadError instanceof Error ? loadError.message : "Unable to load compliance data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadComplianceData();
  }, [loadComplianceData]);

  const markets = useMemo(
    () => (complianceData ? (Object.keys(complianceData) as MarketCode[]) : []),
    [complianceData]
  );

  const availableMarkets = useMemo(
    () => markets.filter((market) => Boolean(complianceData?.[market])),
    [complianceData, markets]
  );

  const documents = useMemo<SummaryDocument[]>(() => {
    if (!complianceData) return [];
    return availableMarkets.flatMap((market) => {
      const marketItem = complianceData[market];
      return marketItem.documents
        .filter((document) => document.status !== "missing")
        .map((document) => ({
        id: `${market}-${document.id}`,
        documentId: document.id,
        market,
        name: document.name,
        expires: document.validTo || null
        }));
    });
  }, [availableMarkets, complianceData]);

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = uploadTargetSearch.trim().toLowerCase();

    return documents.filter((document) => {
      if (uploadMarketFilter !== "ALL" && document.market !== uploadMarketFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = `${document.name} ${document.market}`.toLowerCase();
      return searchableText.includes(normalizedSearch);
    });
  }, [documents, uploadMarketFilter, uploadTargetSearch]);

  const uploadTargets = useMemo<UploadTarget[]>(() => {
    if (!complianceData) return [];
    return availableMarkets.flatMap((market) => {
      const marketData = complianceData[market];
      return marketData.documents.map((doc) => ({
        key: getUploadTargetKey(market, doc.id),
        market,
        marketName: marketData.marketName,
        documentId: doc.id,
        documentName: doc.name,
        required: doc.required,
        status: doc.status
      }));
    });
  }, [availableMarkets, complianceData]);

  const filteredUploadTargets = useMemo(() => {
    const normalizedSearch = uploadTargetSearch.trim().toLowerCase();
    return uploadTargets.filter((target) => {
      if (uploadMarketFilter !== "ALL" && target.market !== uploadMarketFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText =
        `${target.documentName} ${target.market} ${target.marketName} ${target.documentId}`.toLowerCase();
      return searchableText.includes(normalizedSearch);
    });
  }, [uploadMarketFilter, uploadTargetSearch, uploadTargets]);

  const defaultUploadTargetKey = useMemo(
    () =>
      filteredUploadTargets.find((target) => target.status === "missing")?.key ||
      filteredUploadTargets.find((target) => target.status === "expired")?.key ||
      filteredUploadTargets[0]?.key ||
      "",
    [filteredUploadTargets]
  );

  const effectiveUploadTargetKey = defaultUploadTargetKey;

  const uploadedTargetsCount = useMemo(
    () => uploadTargets.filter((target) => target.status === "uploaded" || target.status === "approved").length,
    [uploadTargets]
  );
  const missingTargetsCount = Math.max(0, uploadTargets.length - uploadedTargetsCount);

  const marketReadinessByScore = useMemo(() => {
    if (!complianceData) return {} as Partial<Record<MarketCode, number>>;
    const readinessMap: Partial<Record<MarketCode, number>> = {};
    for (const market of markets) {
      const marketData = complianceData[market];
      if (!marketData) continue;
      readinessMap[market] = computeMarketReadinessScore(marketData);
    }
    return readinessMap;
  }, [complianceData, markets]);

  const readyMarkets = markets.filter((market) => (marketReadinessByScore[market] || 0) >= 80).length;
  const needsWorkMarkets = markets.filter((market) => (marketReadinessByScore[market] || 0) < 80).length;

  const handleOpenMarketDetail = (market: MarketCode) => {
    setSelectedMarket(market);
    setIsDetailOpen(true);
  };

  const handleUploadFromManager = () => {
    if (uploadingDocument) return;
    if (!effectiveUploadTargetKey) {
      toast.info(t("documents.uploadManagerSelectPlaceholder"));
      return;
    }
    setPendingUploadTargetKey(effectiveUploadTargetKey);
    uploadInputRef.current?.click();
  };

  const handleUploadFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    const targetKey = pendingUploadTargetKey || effectiveUploadTargetKey;
    setPendingUploadTargetKey(null);

    if (!file || !targetKey) return;

    const target = uploadTargets.find((item) => item.key === targetKey);
    if (!target) {
      toast.error("Document target is invalid.");
      return;
    }

    void (async () => {
      setUploadingDocument(true);
      try {
        await uploadComplianceDocument(target.market, target.documentId, file);
        toast.success(`Uploaded to ${target.marketName} - ${target.documentName}.`);
        await loadComplianceData();
      } catch (uploadError) {
        console.error("Failed to upload compliance document:", uploadError);
        toast.error(uploadError instanceof Error ? uploadError.message : "Upload failed.");
      } finally {
        setUploadingDocument(false);
      }
    })();
  };

  const handleRemoveFromManager = (document: SummaryDocument) => {
    if (removingDocumentKey || uploadingDocument) return;
    const confirmed = window.confirm("Bạn có chắc muốn xóa tài liệu này?");
    if (!confirmed) return;

    void (async () => {
      setRemovingDocumentKey(document.id);
      try {
        await removeComplianceDocument(document.market, document.documentId);
        toast.success("Đã xóa tài liệu.");
        await loadComplianceData();
      } catch (removeError) {
        console.error("Failed to remove compliance document:", removeError);
        toast.error(removeError instanceof Error ? removeError.message : "Xóa tài liệu thất bại.");
      } finally {
        setRemovingDocumentKey(null);
      }
    })();
  };

  return (
    <>
      <div className="space-y-4 md:space-y-6 no-horizontal-scroll">
        <div>
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <Globe className="h-5 w-5 text-primary" />
              {t("marketReadiness")}
            </h3>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-primary">
                <span className="font-semibold">{readyMarkets}</span>
                <span className="font-semibold">{t("readyMarkets")}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-red-700">
                <span className="font-semibold">{needsWorkMarkets}</span>
                <span className="font-semibold">{t("needsSupport")}</span>
              </span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {loading && (
              <Card className="md:col-span-2 border border-slate-200 bg-white shadow-sm">
                <CardContent className="space-y-3 p-6">
                  <div className="h-5 w-1/3 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                  <div className="h-2 w-full animate-pulse rounded bg-slate-200" />
                </CardContent>
              </Card>
            )}

            {!loading && error && (
              <Card className="md:col-span-2 border border-red-200 bg-red-50/60 shadow-sm">
                <CardContent className="space-y-3 py-6 text-center">
                  <p className="text-sm font-medium text-red-700">{error}</p>
                  <Button size="sm" onClick={() => void loadComplianceData()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {!loading &&
              !error &&
              availableMarkets.map((market) => {
                const data = complianceData?.[market];
                if (!data) return null;
                const readinessScore = marketReadinessByScore[market] ?? computeMarketReadinessScore(data);

                return (
                  <Card
                    key={market}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => handleOpenMarketDetail(market)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <span className="text-lg font-bold text-primary">{market}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between">
                            <p className="truncate text-sm font-medium">
                              {t("market")} {data.marketName}
                            </p>
                            <Badge className={getReadinessColor(readinessScore)}>{readinessScore}%</Badge>
                          </div>
                          <p className="mb-2 truncate text-xs text-muted-foreground">
                            {getMarketRegulation(market)}
                          </p>
                          <Progress value={readinessScore} className="h-2" />
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t pt-3">
                        <div className="flex items-center gap-1 text-xs">
                          {readinessScore >= 80 && (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span className="text-green-600 dark:text-green-400">
                                {t("exportReady")}
                              </span>
                            </>
                          )}
                          {readinessScore < 80 && readinessScore >= 50 && (
                            <>
                              <Clock className="h-4 w-4 text-yellow-500" />
                              <span className="text-yellow-600 dark:text-yellow-400">
                                {data.recommendations.filter((item) => item.status === "active").length}{" "}
                                {t("needsWork")}
                              </span>
                            </>
                          )}
                          {readinessScore < 50 && (
                            <>
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              <span className="text-red-600 dark:text-red-400">{t("notReady")}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

            {!loading && !error && availableMarkets.length === 0 && (
              <Card className="md:col-span-2 border border-slate-200 bg-slate-50/60 shadow-sm">
                <CardContent className="py-8 text-center">
                  <p className="text-sm font-medium text-slate-700">{t("carbonData.noData")}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <FileText className="h-5 w-5 text-primary" />
            {t("certificates")}
          </h3>
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold">{t("documents.uploadManagerTitle")}</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="secondary">
                    {t("documents.uploadedCount", { count: uploadedTargetsCount })}
                  </Badge>
                  <Badge variant="secondary">
                    {t("documents.missingCount", { count: missingTargetsCount })}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:items-end">
                <div className="w-full">
                  <div className="mb-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="export-upload-manager-market-filter"
                        className="mb-1 block text-xs font-medium text-muted-foreground"
                      >
                        {t("documents.uploadManagerMarketFilterLabel")}
                      </label>
                      <select
                        id="export-upload-manager-market-filter"
                        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        value={uploadMarketFilter}
                        onChange={(event) => setUploadMarketFilter(event.target.value as UploadMarketFilter)}
                        disabled={uploadingDocument}
                      >
                        <option value="ALL">{t("documents.uploadManagerMarketFilterAll")}</option>
                        {availableMarkets.map((market) => (
                          <option key={market} value={market}>
                            {market}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="export-upload-manager-search"
                        className="mb-1 block text-xs font-medium text-muted-foreground"
                      >
                        {t("documents.uploadManagerSearchLabel")}
                      </label>
                      <Input
                        id="export-upload-manager-search"
                        value={uploadTargetSearch}
                        onChange={(event) => setUploadTargetSearch(event.target.value)}
                        placeholder={t("documents.uploadManagerSearchPlaceholder")}
                        disabled={uploadingDocument}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  className="w-full md:w-auto"
                  disabled={!effectiveUploadTargetKey || uploadingDocument}
                  onClick={handleUploadFromManager}
                >
                  {uploadingDocument ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-1 h-4 w-4" />
                  )}
                  {t("documents.uploadSelected")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {filteredDocuments.map((document) => (
              <Card
                key={document.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => handleOpenMarketDetail(document.market)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleOpenMarketDetail(document.market);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${document.name} (${document.market})`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <FileCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {document.name} ({document.market})
                        </p>
                        {document.expires && (
                          <p className="text-xs text-muted-foreground">
                            {t("expires")} {document.expires}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        disabled={Boolean(removingDocumentKey) || uploadingDocument}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleRemoveFromManager(document);
                        }}
                        aria-label="Remove document"
                      >
                        {removingDocumentKey === document.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredDocuments.length === 0 && (
              <Card className="md:col-span-2 border border-slate-200 bg-slate-50/60 shadow-sm">
                <CardContent className="py-8 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    {t("documents.uploadManagerNoResults")}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <input
        ref={uploadInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
        className="hidden"
        onChange={handleUploadFileChange}
      />

      <ComplianceDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        marketCode={selectedMarket}
        complianceData={complianceData}
        onDataChanged={loadComplianceData}
      />
    </>
  );
};

export default ExportPage;
