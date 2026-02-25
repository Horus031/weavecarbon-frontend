"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useDashboardTitle } from "@/contexts/DashboardContext";
import {
  API_BASE_URL,
  api,
  authTokenStore,
  ensureAccessToken,
  resolveApiUrl } from
"@/lib/apiClient";
import { showNoPermissionToast } from "@/lib/noPermissionToast";
import {
  Card,
  CardContent } from
"@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import {
  FileText,
  Download,
  Search,
  Filter,
  Package,
  Building2,
  Users,
  Activity,
  Shield,
  BarChart3,
  CheckCircle2,
  Clock,
  History,
  Eye,
  Plus,
  Loader2 } from
"lucide-react";

import { toast } from "sonner";
import {
  fetchReportExportSourceCounts,
  getDefaultReportExportSourceCounts,
  exportDataset,
  type ExportFileFormat,
  type ReportDatasetType } from
"@/lib/reportsApi";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import MobileFilterSheet from "./mobile/MobileFilterSheet";
import MobileDataCard from "./mobile/MobileDataCard";

type ReportType =
"carbon_footprint" |
"market_analysis" |
"carbon_audit" |
"compliance" |
"export_declaration" |
"sustainability" |
"product" |
"products" |
"activity" |
"audit" |
"users" |
"analytics" |
"history" |
"company";

type ReportStatus = "completed" | "processing" | "failed";

interface ReportItem {
  id: string;
  title: string;
  type: ReportType;
  typeLabel: string;
  format: string;
  date: string;
  size: string;
  status: ReportStatus;
  co2e: number | null;
  records: number;
  downloadUrl?: string;
}

interface ReportDetail {
  id: string;
  title: string;
  type: ReportType;
  typeLabel: string;
  status: ReportStatus;
  format: string;
  date: string;
  size: string;
  records: number;
  co2e: number | null;
  downloadUrl?: string;
  raw: unknown;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
typeof value === "object" && value !== null;

const REPORTS_ENDPOINT = "/reports";

const CREATE_REPORT_TYPE_OPTIONS: ReportType[] = [
"carbon_footprint",
"market_analysis",
"carbon_audit",
"compliance",
"export_declaration",
"sustainability",
"products",
"activity",
"audit",
"users",
"analytics",
"history",
"company"];

const CREATE_REPORT_FORMAT_OPTIONS = ["xlsx", "csv"] as const;

type CreateReportFormat = (typeof CREATE_REPORT_FORMAT_OPTIONS)[number];

const normalizeFormatLabel = (value: unknown) => {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (!normalized || normalized === "CSV") {
    return "XLSX";
  }
  return normalized;
};

const normalizeReportType = (rawType: unknown): ReportType => {
  const value = typeof rawType === "string" ? rawType.toLowerCase() : "";
  if (value === "carbon_footprint") return "carbon_footprint";
  if (value === "market_analysis") return "market_analysis";
  if (value === "carbon_audit") return "carbon_audit";
  if (value === "compliance") return "compliance";
  if (value === "export_declaration") return "export_declaration";
  if (value === "sustainability") return "sustainability";
  if (value.includes("product")) return "products";
  if (value.includes("activity")) return "activity";
  if (value.includes("audit")) return "audit";
  if (value.includes("user")) return "users";
  if (value.includes("analytic")) return "analytics";
  if (value.includes("history")) return "history";
  return "company";
};

const normalizeReportStatus = (
rawStatus: unknown)
: ReportStatus => {
  const value = typeof rawStatus === "string" ? rawStatus.toLowerCase() : "";
  if (value.includes("fail") || value.includes("error")) return "failed";
  if (
  value.includes("draft") ||
  value.includes("process") ||
  value.includes("pending"))
  {
    return "processing";
  }
  return "completed";
};

const normalizeDate = (value: unknown) => {
  if (typeof value !== "string") {
    return new Date().toISOString().split("T")[0];
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10);
  }
  return parsed.toISOString().split("T")[0];
};

const normalizeSize = (value: unknown) => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value > 1024 * 1024) {
      return `${(value / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${value.toFixed(1)} MB`;
  }
  return "N/A";
};

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "N/A";
  }
  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const normalizeNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const normalizeReportPayloadForDetail = (payload: unknown) => {
  if (isObject(payload)) {
    if (isObject(payload.report)) {
      return payload.report;
    }
    if (isObject(payload.item)) {
      return payload.item;
    }
    if (isObject(payload.data)) {
      return payload.data;
    }
  }
  return payload;
};

const REPORT_NOT_READY_CODE = "REPORT_NOT_READY";

type ParsedApiError = {
  message: string;
  code?: string;
};

class ReportNotReadyError extends Error {
  readonly code = REPORT_NOT_READY_CODE;

  constructor(message: string) {
    super(message);
    this.name = "ReportNotReadyError";
  }
}

const isReportNotReadyError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  if (error instanceof ReportNotReadyError) {
    return true;
  }

  const errorWithCode = error as Error & { code?: string };
  if (errorWithCode.code === REPORT_NOT_READY_CODE) {
    return true;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("report_not_ready") ||
    (message.includes("not ready") && message.includes("report")) ||
    message.includes("current status: processing")
  );
};

const parseErrorPayloadObject = (
payload: Record<string, unknown>,
fallbackMessage = "Request failed."
): ParsedApiError | null => {
  const message =
    typeof payload.message === "string" && payload.message.trim().length > 0 ?
    payload.message :
    null;
  const code =
    typeof payload.code === "string" && payload.code.trim().length > 0 ?
    payload.code :
    undefined;
  if (message || code) {
    return { message: message || fallbackMessage, code };
  }

  if (typeof payload.error === "string" && payload.error.trim().length > 0) {
    return { message: payload.error };
  }
  if (isObject(payload.error)) {
    const nestedMessage =
      typeof payload.error.message === "string" &&
      payload.error.message.trim().length > 0 ?
      payload.error.message :
      null;
    const nestedCode =
      typeof payload.error.code === "string" &&
      payload.error.code.trim().length > 0 ?
      payload.error.code :
      undefined;
    if (nestedMessage || nestedCode) {
      return { message: nestedMessage || fallbackMessage, code: nestedCode };
    }
  }

  return null;
};

const parseApiErrorFromText = (value: string): ParsedApiError | null => {
  const raw = value.trim();
  if (!raw) {
    return null;
  }
  if (!(raw.startsWith("{") || raw.startsWith("["))) {
    return null;
  }

  try {
    const payload = JSON.parse(raw) as unknown;
    if (typeof payload === "string" && payload.trim().length > 0) {
      return { message: payload };
    }
    if (isObject(payload)) {
      return parseErrorPayloadObject(payload);
    }
  } catch {
    return null;
  }

  return null;
};

const isLikelyCsvText = (value: string) => {
  const text = value.trim();
  if (!text) {
    return false;
  }

  const lower = text.toLowerCase();
  if (
    lower.startsWith("<!doctype html") ||
    lower.startsWith("<html") ||
    lower.startsWith("{") ||
    lower.startsWith("[")
  ) {
    return false;
  }

  if (text.includes("\0")) {
    return false;
  }

  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const hasDelimiter = [",", ";", "\t"].some((delimiter) => firstLine.includes(delimiter));
  if (hasDelimiter) {
    return true;
  }

  return /\r?\n/.test(text);
};

const isAbsoluteHttpUrl = (value: string) => /^https?:\/\//i.test(value.trim());

const isApiOriginUrl = (value: string) => {
  try {
    return new URL(value).origin === new URL(API_BASE_URL).origin;
  } catch {
    return false;
  }
};

const isExternalDownloadUrl = (value: string) =>
isAbsoluteHttpUrl(value) && !isApiOriginUrl(value);

const triggerExternalDownload = (url: string) => {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const parseApiErrorResponse = async (response: Response): Promise<ParsedApiError> => {
  const fallbackMessage = "Request failed.";
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const payload = (await response.json()) as unknown;
      if (typeof payload === "string" && payload.trim().length > 0) {
        return { message: payload };
      }
      if (isObject(payload)) {
        const parsed = parseErrorPayloadObject(payload, fallbackMessage);
        if (parsed) {
          return parsed;
        }
      }
    } catch {
      return { message: fallbackMessage };
    }
  }

  try {
    const text = await response.text();
    return { message: text.trim().length > 0 ? text : fallbackMessage };
  } catch {
    return { message: fallbackMessage };
  }
};

const parseFilenameFromDisposition = (disposition: string | null) => {
  if (!disposition) return null;
  const match = disposition.match(
    /filename\*=UTF-8''([^;]+)|filename=\"?([^\";]+)\"?/i
  );
  const raw = match?.[1] || match?.[2];
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

const sanitizeFilename = (value: string) =>
value.
replace(/[^\w.-]+/g, "_").
replace(/^_+|_+$/g, "") ||
"report";

const withXlsxExtension = (filename: string) => {
  const safeName = sanitizeFilename(filename);
  if (safeName.toLowerCase().endsWith(".xlsx")) {
    return safeName;
  }
  return safeName.replace(/\.[^./\\]+$/, "") + ".xlsx";
};

const hasZipSignature = async (blob: Blob) => {
  const bytes = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
  return bytes[0] === 0x50 && bytes[1] === 0x4b;
};

const hasPdfSignature = async (blob: Blob) => {
  const bytes = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
};

const isPlaceholderCsvExport = (csvText: string) =>
csvText.toLowerCase().includes("placeholder-generated-in-dev");

const convertCsvBlobToXlsx = async (blob: Blob) => {
  const csvText = await blob.text();
  if (isPlaceholderCsvExport(csvText)) {
    throw new Error(
      "Backend dang tra file placeholder (dev stub), chua co du lieu export that."
    );
  }
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(csvText, {
    type: "string",
    raw: false,
    codepage: 65001
  });
  const binary = XLSX.write(workbook, {
    type: "array",
    bookType: "xlsx"
  });
  return new Blob([binary], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
};

const extractDownloadPathFromPayload = (payload: unknown): string | null => {
  if (!isObject(payload)) return null;

  const directPathCandidate =
    payload.download_url ??
    payload.downloadUrl ??
    payload.file_url ??
    payload.fileUrl ??
    payload.url;
  if (typeof directPathCandidate === "string" && directPathCandidate.trim().length > 0) {
    return directPathCandidate;
  }

  const dataPayload = isObject(payload.data) ? payload.data : null;
  if (!dataPayload) return null;

  const nestedPathCandidate =
    dataPayload.download_url ??
    dataPayload.downloadUrl ??
    dataPayload.file_url ??
    dataPayload.fileUrl ??
    dataPayload.url;

  if (typeof nestedPathCandidate === "string" && nestedPathCandidate.trim().length > 0) {
    return nestedPathCandidate;
  }

  return null;
};

const reportItemToDetail = (
report: ReportItem,
raw: unknown = null)
: ReportDetail => ({
  id: report.id,
  title: report.title,
  type: report.type,
  typeLabel: report.typeLabel,
  status: report.status,
  format: report.format,
  date: report.date,
  size: report.size,
  records: report.records,
  co2e: report.co2e,
  downloadUrl: report.downloadUrl,
  raw
});

const normalizeReportDetailPayload = (
payload: unknown,
t: ReturnType<typeof useTranslations>,
fallback?: ReportItem)
: ReportDetail | null => {
  const candidate = normalizeReportPayloadForDetail(payload);
  const normalized = normalizeReportsPayload([candidate], t);
  if (normalized.length > 0) {
    return reportItemToDetail(normalized[0], payload);
  }
  return fallback ? reportItemToDetail(fallback, payload) : null;
};

const getTypeLabel = (type: ReportType, t: ReturnType<typeof useTranslations>) => {
  switch (type) {
    case "carbon_footprint":
      return t("typeLabels.carbonFootprint");
    case "market_analysis":
      return t("typeLabels.marketAnalysis");
    case "carbon_audit":
      return t("typeLabels.carbonAudit");
    case "compliance":
      return t("typeLabels.compliance");
    case "export_declaration":
      return t("typeLabels.exportDeclaration");
    case "sustainability":
      return t("typeLabels.sustainability");
    case "product":
    case "products":
      return t("filterOptions.product");
    case "activity":
      return t("filterOptions.activity");
    case "audit":
      return t("filterOptions.audit");
    case "users":
      return t("filterOptions.users");
    case "analytics":
      return t("filterOptions.analytics");
    case "history":
      return t("filterOptions.history");
    default:
      return t("filterOptions.company");
  }
};

const normalizeReportsPayload = (
payload: unknown,
t: ReturnType<typeof useTranslations>)
: ReportItem[] => {
  let reportsArray: unknown[] = [];

  if (Array.isArray(payload)) {
    reportsArray = payload;
  } else if (isObject(payload)) {
    if (Array.isArray(payload.reports)) {
      reportsArray = payload.reports;
    } else if (Array.isArray(payload.items)) {
      reportsArray = payload.items;
    } else if (Array.isArray(payload.data)) {
      reportsArray = payload.data;
    }
  }

  return reportsArray.
  filter(isObject).
  map((item, index) => {
    const metadata = isObject(item.metadata) ? item.metadata : undefined;
    const type = normalizeReportType(
      item.report_type || item.type || item.category
    );
    const records = normalizeNumber(
      item.records ||
      item.record_count ||
      item.total_records ||
      metadata?.record_count ||
      metadata?.total_records
    );
    const co2eRaw =
    item.co2e ||
    item.total_co2e ||
    item.totalCO2 ||
    item.total_co2e_kg ||
    metadata?.total_co2e ||
    metadata?.co2e;
    const co2e =
    co2eRaw === null || typeof co2eRaw === "undefined" ?
    null :
    normalizeNumber(co2eRaw);
    const status = normalizeReportStatus(item.status || item.report_status);
    const rawReportId =
    item.id ??
    item.report_id ??
    item.reportId ??
    item.uuid ??
    item._id;
    const reportId =
    typeof rawReportId === "string" && rawReportId ||
    typeof rawReportId === "number" && Number.isFinite(rawReportId) && String(rawReportId) ||
    isObject(rawReportId) &&
    typeof rawReportId.$oid === "string" && rawReportId.$oid ||
    `report-${index}`;
    const explicitDownloadUrl =
    typeof item.download_url === "string" && item.download_url ||
    typeof item.file_url === "string" && item.file_url;
    const fileSizeBytes = normalizeNumber(
      item.file_size_bytes || metadata?.file_size_bytes,
      NaN
    );
    const fallbackSizeValue =
    typeof item.file_size_mb === "number" && Number.isFinite(item.file_size_mb) ?
    `${item.file_size_mb.toFixed(1)} MB` :
    item.file_size || item.size || metadata?.file_size;
    const downloadUrl =
    explicitDownloadUrl || (
    status === "completed" ?
    `${REPORTS_ENDPOINT}/${reportId}/download` :
    undefined);

    return {
      id: reportId,
      title:
      typeof item.title === "string" && item.title ||
      typeof item.name === "string" && item.name ||
      t("fullReport"),
      type,
      typeLabel: getTypeLabel(type, t),
      format: normalizeFormatLabel(item.file_format || item.format),
      date: normalizeDate(item.generated_at || item.created_at || item.date),
      size: Number.isFinite(fileSizeBytes) ?
      formatBytes(fileSizeBytes) :
      normalizeSize(fallbackSizeValue),
      status,
      co2e,
      records,
      downloadUrl
    };
  });
};

const EXPORT_DATASET_TYPES = new Set<ReportType>([
"products",
"activity",
"audit",
"users",
"history",
"analytics",
"company"]);

const ReportsPage: React.FC = () => {
  const t = useTranslations("reports");
  const locale = useLocale();
  const displayLocale = locale === "vi" ? "vi-VN" : "en-US";
  const { setPageTitle } = useDashboardTitle();
  const { canMutate } = usePermissions();


  const REPORT_TYPES = [
  {
    id: "products" as ReportDatasetType,
    label: t("types.product.label"),
    icon: Package,
    description: t("types.product.description"),
    countKey: "products" as keyof typeof exportSourceCounts
  },
  {
    id: "activity" as ReportDatasetType,
    label: t("types.activity.label"),
    icon: Activity,
    description: t("types.activity.description"),
    countKey: "activity" as keyof typeof exportSourceCounts
  },
  {
    id: "audit" as ReportDatasetType,
    label: t("types.audit.label"),
    icon: Shield,
    description: t("types.audit.description"),
    countKey: "audit" as keyof typeof exportSourceCounts
  },
  {
    id: "users" as ReportDatasetType,
    label: t("types.users.label"),
    icon: Users,
    description: t("types.users.description"),
    countKey: "users" as keyof typeof exportSourceCounts
  },
  {
    id: "analytics" as ReportDatasetType,
    label: t("types.analytics.label"),
    icon: BarChart3,
    description: t("types.analytics.description"),
    countKey: "products" as keyof typeof exportSourceCounts
  },
  {
    id: "history" as ReportDatasetType,
    label: t("types.history.label"),
    icon: History,
    description: t("types.history.description"),
    countKey: "history" as keyof typeof exportSourceCounts
  }];

  const isMobile = useIsMobile();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 14;

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<{
    title: string;
    type: ReportType;
    format: CreateReportFormat;
  }>({
    title: "",
    type: "carbon_audit",
    format: "xlsx"
  });

  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(
    null
  );
  const [exportingDataset, setExportingDataset] = useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [reportDetails, setReportDetails] = useState<ReportDetail | null>(null);

  const [exportSourcesLoading, setExportSourcesLoading] = useState(false);
  const [exportSourcesLoaded, setExportSourcesLoaded] = useState(false);
  const [exportSourceCounts, setExportSourceCounts] = useState(
    getDefaultReportExportSourceCounts()
  );
  const [showExportHistory, setShowExportHistory] = useState(false);

  useEffect(() => {
    setPageTitle(t("title"), t("subtitle"));
  }, [setPageTitle, t]);

  const loadReports = useCallback(
    async (withLoader = false) => {
      if (withLoader) {
        setReportsLoading(true);
      }
      setReportsError(null);

      try {
        const payload = await api.get<unknown>(REPORTS_ENDPOINT);
        const loadedReports = normalizeReportsPayload(payload, t);
        setReports(loadedReports);
        return loadedReports;
      } catch (error) {
        console.error("Failed to load reports:", error);
        setReports([]);
        setReportsError(
          error instanceof Error ?
          error.message :
          t("errors.loadReportsFromServer")
        );
        return [];
      } finally {
        if (withLoader) {
          setReportsLoading(false);
        }
      }
    },
    [t]
  );

  const loadExportSources = useCallback(async () => {
    setExportSourcesLoading(true);
    try {
      const counts = await fetchReportExportSourceCounts();
      setExportSourceCounts(counts);
    } catch (error) {
      console.error("Failed to load report export sources:", error);
      setExportSourceCounts(getDefaultReportExportSourceCounts());
    } finally {
      setExportSourcesLoading(false);
      setExportSourcesLoaded(true);
    }
  }, []);

  useEffect(() => {
    void loadReports(true);
  }, [loadReports]);

  useEffect(() => {
    if (exportSourcesLoaded) {
      return;
    }
    void loadExportSources();
  }, [exportSourcesLoaded, loadExportSources]);

  useEffect(() => {
    const hasProcessingReport = reports.some((report) => report.status === "processing");
    if (!hasProcessingReport) return;

    const intervalId = window.setInterval(() => {
      void loadReports(false);
    }, 20000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [reports, loadReports]);

  const downloadFileFromPath = useCallback(
    async (targetPath: string, fallbackFileName: string) => {
      const fetchFileFromPath = async (
        path: string,
        visitedPaths = new Set<string>()
      ): Promise<void> => {
        const normalizedPath = path.trim();
        if (!normalizedPath) {
          throw new Error(t("errors.downloadPathEmpty"));
        }

        if (visitedPaths.has(normalizedPath)) {
          throw new Error(t("errors.downloadMetadataLoop"));
        }
        visitedPaths.add(normalizedPath);

        if (isExternalDownloadUrl(normalizedPath)) {
          triggerExternalDownload(normalizedPath);
          return;
        }

        const accessToken = (await ensureAccessToken()) || authTokenStore.getAccessToken();
        const response = await fetch(resolveApiUrl(normalizedPath), {
          method: "GET",
          credentials: "include",
          headers: accessToken ?
          {
            Authorization: `Bearer ${accessToken}`
          } :
          undefined
        });

        if (!response.ok) {
          const parsedError = await parseApiErrorResponse(response);
          if (
            response.status === 409 &&
            (
              parsedError.code === REPORT_NOT_READY_CODE ||
              parsedError.message.toLowerCase().includes("not ready"))
          )
          {
            throw new ReportNotReadyError(parsedError.message);
          }
          throw new Error(parsedError.message);
        }

        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          let payload: unknown = null;
          try {
            payload = await response.json();
          } catch {
            throw new Error(t("errors.downloadInvalidJson"));
          }

          const nestedPath = extractDownloadPathFromPayload(payload);
          if (nestedPath && nestedPath.trim() !== normalizedPath) {
            if (isExternalDownloadUrl(nestedPath)) {
              triggerExternalDownload(nestedPath);
              return;
            }
            await fetchFileFromPath(nestedPath, visitedPaths);
            return;
          }

          const payloadMessage =
            isObject(payload) && typeof payload.message === "string" && payload.message.trim().length > 0 ?
            payload.message :
            isObject(payload) &&
            isObject(payload.error) &&
            typeof payload.error.message === "string" &&
            payload.error.message.trim().length > 0 ?
            payload.error.message :
            t("errors.downloadMetadataAsJson");
          throw new Error(payloadMessage);
        }

        const blob = await response.blob();
        if (blob.size <= 0) {
          throw new Error(t("errors.downloadedEmptyReport"));
        }

        let filename =
        parseFilenameFromDisposition(response.headers.get("content-disposition")) ||
        fallbackFileName;
        let downloadBlob = blob;
        const normalizedContentType = contentType.toLowerCase();
        const lowerFilename = filename.toLowerCase();
        const isCsvResponse =
        lowerFilename.endsWith(".csv") ||
        normalizedContentType.includes("text/csv") ||
        normalizedContentType.includes("application/csv");

        if (isCsvResponse) {
          downloadBlob = await convertCsvBlobToXlsx(blob);
          filename = withXlsxExtension(filename);
        }

        const lowerDownloadFilename = filename.toLowerCase();
        const expectXlsx =
        lowerDownloadFilename.endsWith(".xlsx") ||
        contentType.includes(
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        const expectPdf = lowerDownloadFilename.endsWith(".pdf") || contentType.includes("application/pdf");

        if (expectXlsx && !(await hasZipSignature(downloadBlob))) {
          const rawText = await downloadBlob.text();
          const inlineApiError = parseApiErrorFromText(rawText);
          if (inlineApiError) {
            if (
              inlineApiError.code === REPORT_NOT_READY_CODE ||
              inlineApiError.message.toLowerCase().includes("not ready")
            ) {
              throw new ReportNotReadyError(inlineApiError.message);
            }
            throw new Error(inlineApiError.message);
          }

          if (isLikelyCsvText(rawText)) {
            downloadBlob = await convertCsvBlobToXlsx(
              new Blob([rawText], { type: "text/csv;charset=utf-8" })
            );
            filename = withXlsxExtension(filename);
          } else {
            throw new Error(t("errors.invalidXlsxFile"));
          }
        }

        if (expectPdf && !(await hasPdfSignature(downloadBlob))) {
          throw new Error(t("errors.invalidPdfFile"));
        }

        const href = URL.createObjectURL(downloadBlob);
        const link = document.createElement("a");
        link.href = href;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => {
          URL.revokeObjectURL(href);
        }, 60_000);
      };

      await fetchFileFromPath(targetPath);
    },
    [t]
  );

  const runDatasetExport = useCallback(
    async (
    dataset: ReportDatasetType,
    format: ExportFileFormat,
    label: string) =>
    {
      setExportingDataset(dataset);
      try {
        const { total } = await exportDataset(dataset, format);

        toast.success(
          t("toasts.success", {
            count: total,
            type: label,
            format: format.toUpperCase()
          })
        );
      } catch (error) {
        console.error("Failed to export dataset:", error);
        toast.error(error instanceof Error ? error.message : t("errors.exportDatasetFailed"));
      } finally {
        setExportingDataset(null);
      }
    },
    [t]
  );

  const handleQuickExport = (type: ReportDatasetType, label: string) => {
    if (!canMutate) {
      showNoPermissionToast();
      return;
    }
    void runDatasetExport(type, "xlsx", label);
  };

  const resetCreateForm = () => {
    setCreateError(null);
    setCreateForm({
      title: "",
      type: "carbon_audit",
      format: "xlsx"
    });
  };

  const handleCreateReport = async () => {
    if (!canMutate) {
      showNoPermissionToast();
      return;
    }
    const title = createForm.title.trim();

    if (!title) {
      const message = t("errors.reportTitleRequired");
      setCreateError(message);
      toast.error(message);
      return;
    }

    setCreateSubmitting(true);
    setCreateError(null);
    try {
      if (EXPORT_DATASET_TYPES.has(createForm.type)) {
        await exportDataset(
          createForm.type as ReportDatasetType,
          createForm.format
        );
        await loadReports(false);
      } else {
        await api.post(REPORTS_ENDPOINT, {
          title,
          report_type: createForm.type,
          file_format: createForm.format
        });
        await loadReports(false);
      }

      toast.success(t("toasts.createReportSuccess"));
      setCreateDialogOpen(false);
      resetCreateForm();
    } catch (error) {
      console.error("Failed to create report:", error);
      const message =
      error instanceof Error ? error.message : t("errors.createReportFailed");
      setCreateError(message);
      toast.error(message);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleViewReportDetails = async (report: ReportItem) => {
    setSelectedReport(report);
    setReportDetails(reportItemToDetail(report));
    setDetailsOpen(true);
    setDetailsLoading(true);

    try {
      const payload = await api.get<unknown>(`${REPORTS_ENDPOINT}/${report.id}`);
      const details = normalizeReportDetailPayload(payload, t, report);
      if (details) {
        setReportDetails(details);
      } else {
        setReportDetails(reportItemToDetail(report, payload));
      }
    } catch (error) {
      console.error("Failed to load report details:", error);
      toast.error(
        error instanceof Error ?
        error.message :
        t("errors.loadReportDetailsFailed")
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDownloadReport = async (report: ReportItem) => {
    if (!canMutate) {
      showNoPermissionToast();
      return;
    }
    if (report.status !== "completed") {
      toast.info(t("errors.reportFileNotReady", { status: report.status }));
      await loadReports(false);
      return;
    }

    const candidatePaths = Array.from(
      new Set(
        [report.downloadUrl, `${REPORTS_ENDPOINT}/${report.id}/download`].filter(
          (path): path is string => typeof path === "string" && path.trim().length > 0
        )
      )
    );
    if (candidatePaths.length === 0) {
      toast.error(t("errors.reportFileUnavailable"));
      return;
    }

    setDownloadingReportId(report.id);
    try {
      const extension = "xlsx";
      const fallbackName = `${sanitizeFilename(report.title)}.${extension}`;
      let lastError: unknown = null;

      for (const path of candidatePaths) {
        try {
          await downloadFileFromPath(path, fallbackName);
          return;
        } catch (error) {
          lastError = error;
        }
      }

      if (lastError instanceof Error) {
        throw lastError;
      }
      throw new Error(t("errors.downloadReportFailed"));
    } catch (error) {
      if (isReportNotReadyError(error)) {
        toast.info((error as Error).message);
        await loadReports(false);
        return;
      }
      toast.error(error instanceof Error ? error.message : t("errors.downloadReportFailed"));
    } finally {
      setDownloadingReportId(null);
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.title.
    toLowerCase().
    includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || report.type === typeFilter;
    const matchesDateFrom = !dateFrom || report.date >= dateFrom;
    const matchesDateTo = !dateTo || report.date <= dateTo;
    return matchesSearch && matchesType && matchesDateFrom && matchesDateTo;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReports.length / ITEMS_PER_PAGE)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, dateFrom, dateTo, reports.length]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReports.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredReports, currentPage]);

  const exportHistory = useMemo(
    () =>
    reports.
    filter((report) => EXPORT_DATASET_TYPES.has(report.type)).
    slice(0, 10),
    [reports]
  );

  const processingLabel = locale === "vi" ? "Dang xu ly" : "Processing";
  const failedLabel = locale === "vi" ? "That bai" : "Failed";

  const getStatusLabel = (status: ReportStatus) => {
    switch (status) {
      case "completed":
        return t("ready");
      case "processing":
        return processingLabel;
      default:
        return failedLabel;
    }
  };

  const getStatusBadgeClassName = (status: ReportStatus) => {
    switch (status) {
      case "completed":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "processing":
        return "border-amber-200 bg-amber-50 text-amber-700";
      default:
        return "border-rose-200 bg-rose-50 text-rose-700";
    }
  };

  const getStatusCardAccentClassName = (status: ReportStatus) => {
    switch (status) {
      case "completed":
        return "border-l-emerald-400";
      case "processing":
        return "border-l-amber-400";
      default:
        return "border-l-rose-400";
    }
  };

  const handleResetFilters = () => {
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "carbon_footprint":
        return <Shield className="w-4 h-4" />;
      case "market_analysis":
        return <BarChart3 className="w-4 h-4" />;
      case "carbon_audit":
        return <Shield className="w-4 h-4" />;
      case "compliance":
        return <FileText className="w-4 h-4" />;
      case "export_declaration":
        return <Building2 className="w-4 h-4" />;
      case "sustainability":
        return <BarChart3 className="w-4 h-4" />;
      case "product":
      case "products":
        return <Package className="w-4 h-4" />;
      case "activity":
        return <Activity className="w-4 h-4" />;
      case "audit":
        return <Shield className="w-4 h-4" />;
      case "users":
        return <Users className="w-4 h-4" />;
      case "analytics":
        return <BarChart3 className="w-4 h-4" />;
      case "history":
        return <History className="w-4 h-4" />;
      case "company":
        return <Building2 className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const reportTypeFilterOptions: Array<{value: string;label: string;}> = [
  { value: "all", label: t("filterOptions.all") },
  { value: "carbon_footprint", label: getTypeLabel("carbon_footprint", t) },
  { value: "market_analysis", label: getTypeLabel("market_analysis", t) },
  { value: "carbon_audit", label: getTypeLabel("carbon_audit", t) },
  { value: "compliance", label: getTypeLabel("compliance", t) },
  { value: "export_declaration", label: getTypeLabel("export_declaration", t) },
  { value: "sustainability", label: getTypeLabel("sustainability", t) },
  { value: "product", label: t("filterOptions.product") },
  { value: "activity", label: t("filterOptions.activity") },
  { value: "audit", label: t("filterOptions.audit") },
  { value: "users", label: t("filterOptions.users") },
  { value: "analytics", label: t("filterOptions.analytics") },
  { value: "history", label: t("filterOptions.history") },
  { value: "company", label: t("filterOptions.company") }];

  return (
    <div className="space-y-4 md:space-y-6 no-horizontal-scroll" suppressHydrationWarning>
      <div className="flex flex-col gap-6">
        <section className="order-2 space-y-4 rounded-xl border border-slate-300/80 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-slate-800">
              <FileText className="h-4 w-4" />
              <h2 className="text-sm font-semibold">{t("tabs.reports")}</h2>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (!canMutate) {
                  showNoPermissionToast();
                  return;
                }
                setCreateDialogOpen(true);
              }}
              className="gap-2 h-10 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              size={isMobile ? "sm" : "default"}>

              <Plus className="w-4 h-4" />
              <span>{t("createReport")}</span>
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={t("search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 border-slate-200 bg-white" />

            </div>

            
            <MobileFilterSheet
              title={t("filterLabel")}
              onReset={handleResetFilters}
              trigger={
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 md:hidden shrink-0 border-slate-200 bg-white text-slate-700 hover:bg-slate-50">

                  <Filter className="h-4 w-4" />
                </Button>
              }>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    {t("filterType")}
                  </Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-12 border-slate-200 bg-white">
                      <SelectValue placeholder={t("filterPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white">
                      {reportTypeFilterOptions.map((option) =>
                      <SelectItem key={`mobile-${option.value}`} value={option.value}>
                          {option.label}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    {t("dateFrom")}
                  </Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-12 border-slate-200 bg-white" />

                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    {t("dateTo")}
                  </Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-12 border-slate-200 bg-white" />

                </div>
              </div>
            </MobileFilterSheet>

            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-37.5 hidden md:flex border-slate-200 bg-white">
                <SelectValue placeholder={t("filterType")} />
              </SelectTrigger>
              <SelectContent className="border-slate-200 bg-white">
                {reportTypeFilterOptions.map((option) =>
                <SelectItem key={`desktop-${option.value}`} value={option.value}>
                    {option.label}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            <div className="space-y-1 md:w-40">
              <Label className="text-xs text-slate-500 md:sr-only">
                {t("dateFrom")}
              </Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 border-slate-200 bg-white" />

            </div>
            <div className="space-y-1 md:w-40">
              <Label className="text-xs text-slate-500 md:sr-only">
                {t("dateTo")}
              </Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 border-slate-200 bg-white" />

            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {reportsLoading ?
            <Card className="border border-slate-300/80 shadow-sm bg-white">
                <CardContent className="p-8">
                  <div className="h-6 w-2/3 bg-slate-200 rounded animate-pulse mb-3" />
                  <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse mb-4" />
                  <div className="h-9 w-24 bg-slate-200 rounded animate-pulse" />
                </CardContent>
              </Card> :
            filteredReports.length === 0 ?
            <Card className="border border-slate-300/80 shadow-sm bg-white">
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">
                    {reportsError ? t("errors.unableToLoadReports") : t("notFound")}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {reportsError || t("notFoundDesc")}
                  </p>
                </CardContent>
              </Card> :

            paginatedReports.map((report) => {
              const isDownloading = downloadingReportId === report.id;
              const canDownload = report.status === "completed";
              const statusLabel = getStatusLabel(report.status);
              const statusBadgeClassName = getStatusBadgeClassName(report.status);
              const cardAccentClassName = getStatusCardAccentClassName(report.status);

              return (
                <MobileDataCard
                  key={report.id}
                  className={cn("border-l-4", cardAccentClassName)}
                  title={report.title}
                  subtitle={`${report.date} | ${report.size} | ${t("records", { count: report.records })}`}
                  icon={getTypeIcon(report.type)}
                  tags={[report.typeLabel, report.format]}
                  statusBadge={
                    <Badge
                      variant="outline"
                      className={cn("gap-1 text-[11px] font-semibold", statusBadgeClassName)}>

                      {report.status === "completed" ?
                      <CheckCircle2 className="h-3.5 w-3.5" /> :
                      report.status === "processing" ?
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                      <Shield className="h-3.5 w-3.5" />
                      }
                      {statusLabel}
                    </Badge>
                  }
                  meta={
                    report.co2e !== null ?
                    <span className="font-medium text-slate-700">
                        {report.co2e.toFixed(1)} kg CO2e
                      </span> :
                    undefined
                  }
                  metrics={[]}
                  onClick={undefined}
                  actionsPlacement="footer"
                  actions={
                    <div className="flex w-full flex-wrap items-center gap-1.5 md:justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 border-slate-200 bg-white px-2.5 text-xs text-slate-700 hover:bg-slate-50"
                        onClick={() => handleViewReportDetails(report)}>

                        <Eye className="mr-1 h-3.5 w-3.5" />
                        {t("details")}
                      </Button>
                      <Button
                        variant={canDownload ? "default" : "outline"}
                        size="sm"
                        className="h-7 px-2.5 text-xs"
                        onClick={() => handleDownloadReport(report)}
                        disabled={isDownloading || !canDownload}>

                        {isDownloading ?
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> :
                        <Download className="mr-1 h-3.5 w-3.5" />
                        }
                        {t("download")}
                      </Button>
                    </div>
                  }
                  showChevron={false} />);

            })
            }
          </div>

          {filteredReports.length > 0 && totalPages > 1 &&
          <div className="flex items-center justify-center gap-2">
              <Button
              variant="outline"
              size="sm"
              className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}>

                {t("pagination.prev")}
              </Button>
              <span className="text-xs text-slate-600">
                {t("pagination.page", {
                current: currentPage,
                total: totalPages
              })}
              </span>
              <Button
              variant="outline"
              size="sm"
              className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}>

                {t("pagination.next")}
              </Button>
            </div>
          }
        </section>

        <section className="order-1 space-y-4 rounded-xl border border-slate-300/80 bg-white p-4 shadow-sm md:p-5">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-800">
              <Download className="h-4 w-4" />
              <h2 className="text-sm font-semibold">{t("tabs.export")}</h2>
            </div>
            {exportHistory.length > 0 &&
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              onClick={() => setShowExportHistory((prev) => !prev)}>

                <Clock className="mr-1 h-3.5 w-3.5" />
                {t("filterOptions.history")}
              </Button>
            }
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">{t("quickExport")}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {REPORT_TYPES.map((type) => {
                const Icon = type.icon;
                const count = exportSourceCounts[type.countKey];
                const isExporting = exportingDataset === type.id;
                return (
                  <Card
                    key={type.id}
                    className={`touch-target cursor-pointer border border-slate-300/80 bg-white shadow-sm transition-all hover:border-slate-400 hover:shadow-md ${isExporting ? "opacity-70 pointer-events-none" : ""}`}
                    onClick={() => handleQuickExport(type.id, type.label)}>

                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                          {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900">{type.label}</p>
                          <p className="truncate text-xs text-slate-600">
                            {isExporting ? t("exporting") : type.description}
                          </p>
                          {!exportSourcesLoading && count > 0 && (
                            <p className="text-xs text-emerald-600 font-medium mt-0.5">
                              {t("records", { count })}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>);

              })}
            </div>
            {exportSourcesLoading &&
            <p className="mt-2 text-xs text-slate-500">
                {t("loadingExportSourceMetrics")}
              </p>
            }
          </div>

          {exportHistory.length > 0 && showExportHistory &&
          <Card className="border border-slate-300/80 shadow-sm bg-white">
              <CardContent className="space-y-2 pt-4">
                {exportHistory.map((exp) =>
              <div
                key={exp.id}
                className="flex items-center justify-between rounded-lg border border-slate-300/80 bg-slate-100/70 p-2">
                
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {exp.status === "processing" ?
                    <Loader2 className="w-4 h-4 text-amber-600 shrink-0 animate-spin" /> :
                    exp.status === "failed" ?
                    <Shield className="w-4 h-4 text-rose-600 shrink-0" /> :
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    }
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate">{exp.title}</p>
                        <p className="text-xs text-slate-600">
                          {t("records", { count: exp.records })} | {exp.date}
                        </p>
                      </div>
                    </div>
                    <Badge
                  variant="outline"
                  className="ml-2 shrink-0 border-slate-200 bg-white text-xs text-slate-700">

                      {exp.format}
                    </Badge>
                  </div>
              )}
              </CardContent>
            </Card>
          }

          
          {isMobile &&
          <p className="py-2 text-center text-xs text-slate-500">
              {t("mobileNote")}
            </p>
          }
        </section>
      </div>

        <Dialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            if (!open && !createSubmitting) {
              resetCreateForm();
            }
            setCreateDialogOpen(open);
          }}>

          <DialogContent className="border border-slate-200 bg-white sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("createReport")}</DialogTitle>
              <DialogDescription>
                {t("createReportDesc")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {createError &&
              <p className="text-sm text-rose-600">{createError}</p>
              }
              <div className="space-y-2">
                <Label>{t("createForm.titleLabel")}</Label>
                <Input
                  value={createForm.title}
                  onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    title: e.target.value
                  }))
                  }
                  placeholder={t("createForm.titlePlaceholder")}
                  className="border-slate-200 bg-white"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("createForm.typeLabel")}</Label>
                  <Select
                    value={createForm.type}
                    onValueChange={(value) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      type: value as ReportType
                    }))
                    }>

                    <SelectTrigger className="border-slate-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white">
                      {CREATE_REPORT_TYPE_OPTIONS.map((type) =>
                      <SelectItem key={type} value={type}>
                          {getTypeLabel(type, t)}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("createForm.formatLabel")}</Label>
                  <Select
                    value={createForm.format}
                    onValueChange={(value) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      format: value as CreateReportFormat
                    }))
                    }>

                    <SelectTrigger className="border-slate-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white">
                      {CREATE_REPORT_FORMAT_OPTIONS.map((format) =>
                      <SelectItem key={format} value={format}>
                          {format.toUpperCase()}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                disabled={createSubmitting}
                onClick={() => setCreateDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={createSubmitting}
                onClick={handleCreateReport}>
                {createSubmitting &&
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                }
                {t("createReport")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={detailsOpen}
          onOpenChange={(open) => {
            setDetailsOpen(open);
            if (!open) {
              setDetailsLoading(false);
              setSelectedReport(null);
              setReportDetails(null);
            }
          }}>

          <DialogContent className="max-h-[85vh] overflow-y-auto border border-slate-200 bg-white sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {reportDetails?.title || selectedReport?.title || t("reportDetailsTitle")}
              </DialogTitle>
              <DialogDescription>
                {t("reportDetailsDesc")}
              </DialogDescription>
            </DialogHeader>
            {detailsLoading ?
            <div className="flex items-center justify-center py-10 text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t("loadingReportDetails")}
              </div> :
            reportDetails ?
            <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">{t("createForm.typeLabel")}</p>
                    <p className="text-sm font-medium text-slate-900">
                      {reportDetails.typeLabel}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">{t("createForm.formatLabel")}</p>
                    <p className="text-sm font-medium text-slate-900">
                      {reportDetails.format}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">{t("detailsFields.date")}</p>
                    <p className="text-sm font-medium text-slate-900">
                      {reportDetails.date}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">{t("detailsFields.records")}</p>
                    <p className="text-sm font-medium text-slate-900">
                      {reportDetails.records.toLocaleString(displayLocale)}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">{t("detailsFields.fileSize")}</p>
                    <p className="text-sm font-medium text-slate-900">
                      {reportDetails.size}
                    </p>
                  </div>
                </div>
                {reportDetails.co2e !== null &&
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs text-slate-600">{t("detailsFields.totalEmissions")}</p>
                    <p className="text-sm font-medium text-emerald-700">
                      {reportDetails.co2e.toFixed(1)} kg CO2e
                    </p>
                  </div>
                }
                <div className="space-y-2">
                  <Label>{t("detailsFields.rawPayload")}</Label>
                  <pre className="max-h-64 overflow-auto rounded-md border border-slate-200 bg-slate-950 p-3 text-xs text-slate-100">
                    {JSON.stringify(reportDetails.raw, null, 2)}
                  </pre>
                </div>
              </div> :
            <p className="py-6 text-sm text-slate-600">
                {t("detailsFields.noDetails")}
              </p>
            }
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDetailsOpen(false)}>
                {t("close")}
              </Button>
              {selectedReport &&
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => handleDownloadReport(selectedReport)}
                disabled={
                  downloadingReportId === selectedReport.id ||
                  selectedReport.status !== "completed"
                }>

                  {downloadingReportId === selectedReport.id &&
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  }
                  {t("download")}
                </Button>
              }
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>);

};

export default ReportsPage;
