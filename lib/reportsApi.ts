import * as XLSX from "xlsx";
import { api } from "@/lib/apiClient";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Dataset types accepted by GET /api/reports/export-data/:type */
export type ReportDatasetType =
  | "products"
  | "activity"
  | "audit"
  | "users"
  | "history"
  | "analytics"
  | "company";

export type ExportFileFormat = "csv" | "xlsx";

export interface ReportExportSourceCounts {
  products: number;
  activity: number;
  audit: number;
  users: number;
  history: number;
}

export interface ExportDataResponse {
  success: boolean;
  data: {
    dataset_type: string;
    columns: string[];
    rows: Record<string, unknown>[];
    total: number;
  };
}

/* ------------------------------------------------------------------ */
/*  Defaults / helpers                                                 */
/* ------------------------------------------------------------------ */

const DEFAULT_SOURCE_COUNTS: ReportExportSourceCounts = {
  products: 0,
  activity: 0,
  audit: 0,
  users: 0,
  history: 0,
};

export const getDefaultReportExportSourceCounts = () => DEFAULT_SOURCE_COUNTS;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

/* ------------------------------------------------------------------ */
/*  1. Fetch export-source counts (single endpoint)                    */
/* ------------------------------------------------------------------ */

export const fetchReportExportSourceCounts =
  async (): Promise<ReportExportSourceCounts> => {
    try {
      const payload = await api.get<unknown>("/reports/export-sources");

      // API returns { data: { products: 150, activity: 320, ... } }
      const data = isObject(payload) && isObject(payload.data)
        ? payload.data
        : isObject(payload)
          ? payload
          : {};

      return {
        products: Math.max(0, asNumber(data.products, 0)),
        activity: Math.max(0, asNumber(data.activity, 0)),
        audit: Math.max(0, asNumber(data.audit, 0)),
        users: Math.max(0, asNumber(data.users, 0)),
        history: Math.max(0, asNumber(data.history, 0)),
      };
    } catch (error) {
      console.error("Failed to fetch export source counts:", error);
      return { ...DEFAULT_SOURCE_COUNTS };
    }
  };

/* ------------------------------------------------------------------ */
/*  2. Fetch raw export data from BE                                   */
/* ------------------------------------------------------------------ */

export const fetchExportData = async (
  type: ReportDatasetType
): Promise<ExportDataResponse> => {
  const payload = await api.get<unknown>(`/reports/export-data/${type}`);

  if (!isObject(payload)) {
    throw new Error("Invalid export data response.");
  }

  // Unwrap: response may be { success, data: { columns, rows, total } }
  const wrapper = isObject(payload.data) ? payload.data : payload;

  const columns = Array.isArray(wrapper.columns)
    ? (wrapper.columns as string[])
    : [];
  const rows = Array.isArray(wrapper.rows)
    ? (wrapper.rows as Record<string, unknown>[])
    : [];
  const total = asNumber(wrapper.total, rows.length);

  return {
    success: true,
    data: {
      dataset_type: typeof wrapper.dataset_type === "string" ? wrapper.dataset_type : type,
      columns,
      rows,
      total,
    },
  };
};

/* ------------------------------------------------------------------ */
/*  3. Client-side XLSX generation & download                          */
/* ------------------------------------------------------------------ */

const SHEET_NAMES: Record<string, string> = {
  products: "Products",
  activity: "Activity",
  audit: "Audit",
  users: "Users",
  history: "History",
  analytics: "Analytics",
  company: "Company",
};

export function downloadAsXlsx(
  columns: string[],
  rows: Record<string, unknown>[],
  filename: string,
  sheetName = "Sheet1"
) {
  const orderedRows = rows.map((row) => {
    const ordered: Record<string, unknown> = {};
    columns.forEach((col) => {
      ordered[col] = row[col] ?? "";
    });
    return ordered;
  });

  const ws = XLSX.utils.json_to_sheet(orderedRows, { header: columns });

  // Auto-size column widths
  ws["!cols"] = columns.map((col) => ({
    wch: Math.max(col.length + 2, 14),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

export function downloadAsCsv(
  columns: string[],
  rows: Record<string, unknown>[],
  filename: string
) {
  const ws = XLSX.utils.json_to_sheet(rows, { header: columns });
  const csv = XLSX.utils.sheet_to_csv(ws);

  const blob = new Blob(["\ufeff" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/*  4. High-level export: fetch data + generate file in browser        */
/* ------------------------------------------------------------------ */

export const exportDataset = async (
  type: ReportDatasetType,
  format: ExportFileFormat = "xlsx"
): Promise<{ total: number }> => {
  const res = await fetchExportData(type);
  const { columns, rows, total } = res.data;

  if (total === 0) {
    throw new Error("No data available to export.");
  }

  const date = new Date().toISOString().split("T")[0];
  const filename = `${type}_export_${date}.${format}`;
  const sheetName = SHEET_NAMES[type] || "Data";

  if (format === "xlsx") {
    downloadAsXlsx(columns, rows, filename, sheetName);
  } else {
    downloadAsCsv(columns, rows, filename);
  }

  return { total };
};
