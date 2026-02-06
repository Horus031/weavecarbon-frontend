/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from "xlsx";
import { DashboardProduct } from "@/contexts/ProductContext";
import { CalculationHistory } from "@/lib/demoData";

// Demo metadata constants
export const DEMO_METADATA = {
  tenant_name: "Ego Lism",
  data_source: "DEMO",
  watermark: "Demo data – For demonstration purpose only",
  generated_by: "WeaveCarbon Demo",
};

// Generic export helper for any data
export const exportToExcel = (
  data: Record<string, any>[],
  filename: string,
  isDemo: boolean = false,
) => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Data");

  if (isDemo) {
    const metaData = [
      { Key: "data_source", Value: DEMO_METADATA.data_source },
      { Key: "tenant_name", Value: DEMO_METADATA.tenant_name },
      { Key: "watermark", Value: DEMO_METADATA.watermark },
      { Key: "exported_at", Value: new Date().toISOString() },
      { Key: "generated_by", Value: DEMO_METADATA.generated_by },
    ];
    const metaWs = XLSX.utils.json_to_sheet(metaData);
    XLSX.utils.book_append_sheet(wb, metaWs, "Demo Metadata");
  }

  XLSX.writeFile(wb, `${filename}-${getDateString()}.xlsx`);
};

export const exportToCSV = (
  data: Record<string, any>[],
  filename: string,
  isDemo: boolean = false,
) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const rows = data.map((item) => headers.map((h) => String(item[h] ?? "")));

  let csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");

  if (isDemo) {
    csvContent += "\n\n---,DEMO METADATA,---\n";
    csvContent += `data_source,${DEMO_METADATA.data_source}\n`;
    csvContent += `tenant_name,${DEMO_METADATA.tenant_name}\n`;
    csvContent += `watermark,${DEMO_METADATA.watermark}\n`;
    csvContent += `exported_at,${new Date().toISOString()}\n`;
  }

  downloadFile(
    csvContent,
    `${filename}-${getDateString()}.csv`,
    "text/csv;charset=utf-8;",
  );
};

// Helper to download file
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

// Helper to get date string for filenames
const getDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

// Activity log types for demo
export interface ActivityLog {
  id: string;
  timestamp: string;
  action: "CREATE" | "UPDATE" | "APPROVE" | "DELETE" | "EXPORT" | "LOGIN";
  entityType: "product" | "shipment" | "report" | "user" | "system";
  entityId: string;
  entityName: string;
  userId: string;
  userEmail: string;
  details?: string;
  isDemo: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  event:
    | "LOGIN"
    | "LOGOUT"
    | "CREATE_ORDER"
    | "EXPORT_REPORT"
    | "UPDATE_PRODUCT"
    | "DELETE_PRODUCT"
    | "SIGNUP_COMPLETED"
    | "FIRST_LOGIN";
  userId: string;
  userEmail: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  isDemo: boolean;
}

export interface UserInfo {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "member" | "viewer";
  status: "active" | "inactive";
  lastLogin: string;
  createdAt: string;
  isDemo: boolean;
}

// Generate demo activity logs
export const generateDemoActivityLogs = (): ActivityLog[] => {
  const now = new Date();
  return [
    {
      id: "activity-001",
      timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      action: "CREATE",
      entityType: "product",
      entityId: "demo-product-001",
      entityName: "Áo T-shirt Organic Cotton",
      userId: "demo-user-001",
      userEmail: "admin@egolism.demo",
      details: "Tạo sản phẩm mới với SKU DEMO-SKU-001",
      isDemo: true,
    },
    {
      id: "activity-002",
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      action: "UPDATE",
      entityType: "product",
      entityId: "demo-product-002",
      entityName: "Quần Jeans Recycled Denim",
      userId: "demo-user-002",
      userEmail: "member@egolism.demo",
      details: "Cập nhật thông tin vận chuyển",
      isDemo: true,
    },
    {
      id: "activity-003",
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      action: "APPROVE",
      entityType: "product",
      entityId: "demo-product-001",
      entityName: "Áo T-shirt Organic Cotton",
      userId: "demo-user-001",
      userEmail: "admin@egolism.demo",
      details: "Phê duyệt và publish sản phẩm",
      isDemo: true,
    },
    {
      id: "activity-004",
      timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      action: "EXPORT",
      entityType: "report",
      entityId: "report-001",
      entityName: "Báo cáo Carbon Q4/2024",
      userId: "demo-user-001",
      userEmail: "admin@egolism.demo",
      details: "Xuất báo cáo định dạng PDF",
      isDemo: true,
    },
    {
      id: "activity-005",
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      action: "CREATE",
      entityType: "shipment",
      entityId: "shipment-001",
      entityName: "SHP-2024-001",
      userId: "demo-user-002",
      userEmail: "member@egolism.demo",
      details: "Tạo lô hàng xuất khẩu EU",
      isDemo: true,
    },
    {
      id: "activity-006",
      timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
      action: "LOGIN",
      entityType: "system",
      entityId: "session-001",
      entityName: "System Login",
      userId: "demo-user-001",
      userEmail: "admin@egolism.demo",
      details: "Đăng nhập thành công",
      isDemo: true,
    },
  ];
};

// Generate demo audit logs
export const generateDemoAuditLogs = (): AuditLog[] => {
  const now = new Date();
  return [
    {
      id: "audit-001",
      timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      event: "LOGIN",
      userId: "demo-user-001",
      userEmail: "admin@egolism.demo",
      ipAddress: "192.168.1.1",
      userAgent: "Chrome/120.0",
      isDemo: true,
    },
    {
      id: "audit-002",
      timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      event: "CREATE_ORDER",
      userId: "demo-user-001",
      userEmail: "admin@egolism.demo",
      details: { orderId: "ORD-001", productCount: 3 },
      isDemo: true,
    },
    {
      id: "audit-003",
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      event: "EXPORT_REPORT",
      userId: "demo-user-002",
      userEmail: "member@egolism.demo",
      details: { reportType: "carbon_audit", format: "PDF" },
      isDemo: true,
    },
    {
      id: "audit-004",
      timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      event: "UPDATE_PRODUCT",
      userId: "demo-user-002",
      userEmail: "member@egolism.demo",
      details: { productId: "demo-product-002", field: "transport_mode" },
      isDemo: true,
    },
    {
      id: "audit-005",
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      event: "FIRST_LOGIN",
      userId: "demo-user-002",
      userEmail: "member@egolism.demo",
      isDemo: true,
    },
    {
      id: "audit-006",
      timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
      event: "SIGNUP_COMPLETED",
      userId: "demo-user-001",
      userEmail: "admin@egolism.demo",
      details: { companyName: "Ego Lism", plan: "starter" },
      isDemo: true,
    },
  ];
};

// Generate demo users
export const generateDemoUsers = (): UserInfo[] => {
  const now = new Date();
  return [
    {
      id: "demo-user-001",
      email: "admin@egolism.demo",
      fullName: "Admin Demo",
      role: "admin",
      status: "active",
      lastLogin: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      createdAt: new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      isDemo: true,
    },
    {
      id: "demo-user-002",
      email: "member@egolism.demo",
      fullName: "Member Demo",
      role: "member",
      status: "active",
      lastLogin: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(
        now.getTime() - 15 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      isDemo: true,
    },
    {
      id: "demo-user-003",
      email: "viewer@egolism.demo",
      fullName: "Viewer Demo",
      role: "viewer",
      status: "inactive",
      lastLogin: new Date(
        now.getTime() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      createdAt: new Date(
        now.getTime() - 10 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      isDemo: true,
    },
  ];
};

// Format date for export
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Add demo metadata row
const addDemoMetadataRows = (isDemo: boolean): string[][] => {
  if (!isDemo) return [];
  return [
    [],
    ["---", "DEMO METADATA", "---"],
    ["data_source", DEMO_METADATA.data_source],
    ["tenant_name", DEMO_METADATA.tenant_name],
    ["watermark", DEMO_METADATA.watermark],
    ["exported_at", new Date().toISOString()],
    ["generated_by", DEMO_METADATA.generated_by],
  ];
};

// Export Products to CSV
export const exportProductsToCSV = (
  products: DashboardProduct[],
  isDemo: boolean,
) => {
  const headers = [
    "ID",
    "Tên sản phẩm",
    "SKU",
    "Danh mục",
    "CO2 (kg)",
    "Trạng thái",
    "Vật liệu",
    "Khối lượng (kg)",
    "Scope",
    "Độ tin cậy (%)",
    "Ngày tạo",
    "Loại dữ liệu",
  ];

  const rows = products.map((p) => [
    p.id,
    p.name,
    p.sku,
    p.category,
    p.co2.toString(),
    p.status,
    p.materials.join(", "),
    p.weight.toString(),
    p.scope,
    p.confidenceScore.toString(),
    formatDate(p.createdAt),
    p.isDemo ? "Demo" : "Real",
  ]);

  const metadataRows = addDemoMetadataRows(isDemo);
  const csvContent = [headers, ...rows, ...metadataRows]
    .map((row) => row.join(","))
    .join("\n");

  downloadFile(
    csvContent,
    `products-export-${getDateString()}.csv`,
    "text/csv;charset=utf-8;",
  );
};

// Export Products to XLSX
export const exportProductsToXLSX = (
  products: DashboardProduct[],
  isDemo: boolean,
) => {
  const data = products.map((p) => ({
    ID: p.id,
    "Tên sản phẩm": p.name,
    SKU: p.sku,
    "Danh mục": p.category,
    "CO2 (kg)": p.co2,
    "Trạng thái": p.status,
    "Vật liệu": p.materials.join(", "),
    "Khối lượng (kg)": p.weight,
    Scope: p.scope,
    "Độ tin cậy (%)": p.confidenceScore,
    "Ngày tạo": formatDate(p.createdAt),
    "Loại dữ liệu": p.isDemo ? "Demo" : "Real",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Products");

  // Add metadata sheet for demo
  if (isDemo) {
    const metaData = [
      { Key: "data_source", Value: DEMO_METADATA.data_source },
      { Key: "tenant_name", Value: DEMO_METADATA.tenant_name },
      { Key: "watermark", Value: DEMO_METADATA.watermark },
      { Key: "exported_at", Value: new Date().toISOString() },
      { Key: "generated_by", Value: DEMO_METADATA.generated_by },
    ];
    const metaWs = XLSX.utils.json_to_sheet(metaData);
    XLSX.utils.book_append_sheet(wb, metaWs, "Demo Metadata");
  }

  XLSX.writeFile(wb, `products-export-${getDateString()}.xlsx`);
};

// Export Activity Logs
export const exportActivityLogsToCSV = (
  logs: ActivityLog[],
  isDemo: boolean,
) => {
  const headers = [
    "ID",
    "Thời gian",
    "Hành động",
    "Loại đối tượng",
    "ID đối tượng",
    "Tên đối tượng",
    "User ID",
    "Email",
    "Chi tiết",
    "Loại dữ liệu",
  ];

  const rows = logs.map((l) => [
    l.id,
    formatDate(l.timestamp),
    l.action,
    l.entityType,
    l.entityId,
    l.entityName,
    l.userId,
    l.userEmail,
    l.details || "",
    l.isDemo ? "Demo" : "Real",
  ]);

  const metadataRows = addDemoMetadataRows(isDemo);
  const csvContent = [headers, ...rows, ...metadataRows]
    .map((row) => row.join(","))
    .join("\n");

  downloadFile(
    csvContent,
    `activity-logs-${getDateString()}.csv`,
    "text/csv;charset=utf-8;",
  );
};

export const exportActivityLogsToXLSX = (
  logs: ActivityLog[],
  isDemo: boolean,
) => {
  const data = logs.map((l) => ({
    ID: l.id,
    "Thời gian": formatDate(l.timestamp),
    "Hành động": l.action,
    "Loại đối tượng": l.entityType,
    "ID đối tượng": l.entityId,
    "Tên đối tượng": l.entityName,
    "User ID": l.userId,
    Email: l.userEmail,
    "Chi tiết": l.details || "",
    "Loại dữ liệu": l.isDemo ? "Demo" : "Real",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Activity Logs");

  if (isDemo) {
    const metaData = [
      { Key: "data_source", Value: DEMO_METADATA.data_source },
      { Key: "tenant_name", Value: DEMO_METADATA.tenant_name },
      { Key: "watermark", Value: DEMO_METADATA.watermark },
      { Key: "exported_at", Value: new Date().toISOString() },
    ];
    const metaWs = XLSX.utils.json_to_sheet(metaData);
    XLSX.utils.book_append_sheet(wb, metaWs, "Demo Metadata");
  }

  XLSX.writeFile(wb, `activity-logs-${getDateString()}.xlsx`);
};

// Export Audit Logs
export const exportAuditLogsToCSV = (logs: AuditLog[], isDemo: boolean) => {
  const headers = [
    "ID",
    "Thời gian",
    "Sự kiện",
    "User ID",
    "Email",
    "IP Address",
    "User Agent",
    "Chi tiết",
    "Loại dữ liệu",
  ];

  const rows = logs.map((l) => [
    l.id,
    formatDate(l.timestamp),
    l.event,
    l.userId,
    l.userEmail,
    l.ipAddress || "",
    l.userAgent || "",
    l.details ? JSON.stringify(l.details) : "",
    l.isDemo ? "Demo" : "Real",
  ]);

  const metadataRows = addDemoMetadataRows(isDemo);
  const csvContent = [headers, ...rows, ...metadataRows]
    .map((row) => row.join(","))
    .join("\n");

  downloadFile(
    csvContent,
    `audit-logs-${getDateString()}.csv`,
    "text/csv;charset=utf-8;",
  );
};

export const exportAuditLogsToXLSX = (logs: AuditLog[], isDemo: boolean) => {
  const data = logs.map((l) => ({
    ID: l.id,
    "Thời gian": formatDate(l.timestamp),
    "Sự kiện": l.event,
    "User ID": l.userId,
    Email: l.userEmail,
    "IP Address": l.ipAddress || "",
    "User Agent": l.userAgent || "",
    "Chi tiết": l.details ? JSON.stringify(l.details) : "",
    "Loại dữ liệu": l.isDemo ? "Demo" : "Real",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Audit Logs");

  if (isDemo) {
    const metaData = [
      { Key: "data_source", Value: DEMO_METADATA.data_source },
      { Key: "tenant_name", Value: DEMO_METADATA.tenant_name },
      { Key: "watermark", Value: DEMO_METADATA.watermark },
      { Key: "exported_at", Value: new Date().toISOString() },
    ];
    const metaWs = XLSX.utils.json_to_sheet(metaData);
    XLSX.utils.book_append_sheet(wb, metaWs, "Demo Metadata");
  }

  XLSX.writeFile(wb, `audit-logs-${getDateString()}.xlsx`);
};

// Export Users
export const exportUsersToCSV = (users: UserInfo[], isDemo: boolean) => {
  const headers = [
    "ID",
    "Email",
    "Họ tên",
    "Vai trò",
    "Trạng thái",
    "Đăng nhập cuối",
    "Ngày tạo",
    "Loại dữ liệu",
  ];

  const rows = users.map((u) => [
    u.id,
    u.email,
    u.fullName,
    u.role,
    u.status,
    formatDate(u.lastLogin),
    formatDate(u.createdAt),
    u.isDemo ? "Demo" : "Real",
  ]);

  const metadataRows = addDemoMetadataRows(isDemo);
  const csvContent = [headers, ...rows, ...metadataRows]
    .map((row) => row.join(","))
    .join("\n");

  downloadFile(
    csvContent,
    `users-export-${getDateString()}.csv`,
    "text/csv;charset=utf-8;",
  );
};

export const exportUsersToXLSX = (users: UserInfo[], isDemo: boolean) => {
  const data = users.map((u) => ({
    ID: u.id,
    Email: u.email,
    "Họ tên": u.fullName,
    "Vai trò": u.role,
    "Trạng thái": u.status,
    "Đăng nhập cuối": formatDate(u.lastLogin),
    "Ngày tạo": formatDate(u.createdAt),
    "Loại dữ liệu": u.isDemo ? "Demo" : "Real",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Users");

  if (isDemo) {
    const metaData = [
      { Key: "data_source", Value: DEMO_METADATA.data_source },
      { Key: "tenant_name", Value: DEMO_METADATA.tenant_name },
      { Key: "watermark", Value: DEMO_METADATA.watermark },
      { Key: "exported_at", Value: new Date().toISOString() },
    ];
    const metaWs = XLSX.utils.json_to_sheet(metaData);
    XLSX.utils.book_append_sheet(wb, metaWs, "Demo Metadata");
  }

  XLSX.writeFile(wb, `users-export-${getDateString()}.xlsx`);
};

// Export Calculation History
export const exportHistoryToCSV = (
  history: CalculationHistory[],
  isDemo: boolean,
) => {
  const headers = [
    "ID",
    "Product ID",
    "Tên sản phẩm",
    "Vật liệu CO2",
    "Sản xuất CO2",
    "Vận chuyển CO2",
    "Đóng gói CO2",
    "Tổng CO2",
    "Phiên bản",
    "Ngày tính",
    "Người tính",
    "Loại dữ liệu",
  ];

  const rows = history.map((h) => [
    h.id,
    h.productId,
    h.productName,
    h.materialsCO2.toString(),
    h.manufacturingCO2.toString(),
    h.transportCO2.toString(),
    h.packagingCO2.toString(),
    h.totalCO2.toString(),
    h.carbonVersion,
    formatDate(h.createdAt),
    h.createdBy,
    h.isDemo ? "Demo" : "Real",
  ]);

  const metadataRows = addDemoMetadataRows(isDemo);
  const csvContent = [headers, ...rows, ...metadataRows]
    .map((row) => row.join(","))
    .join("\n");

  downloadFile(
    csvContent,
    `calculation-history-${getDateString()}.csv`,
    "text/csv;charset=utf-8;",
  );
};

export const exportHistoryToXLSX = (
  history: CalculationHistory[],
  isDemo: boolean,
) => {
  const data = history.map((h) => ({
    ID: h.id,
    "Product ID": h.productId,
    "Tên sản phẩm": h.productName,
    "Vật liệu CO2 (kg)": h.materialsCO2,
    "Sản xuất CO2 (kg)": h.manufacturingCO2,
    "Vận chuyển CO2 (kg)": h.transportCO2,
    "Đóng gói CO2 (kg)": h.packagingCO2,
    "Tổng CO2 (kg)": h.totalCO2,
    "Phiên bản": h.carbonVersion,
    "Ngày tính": formatDate(h.createdAt),
    "Người tính": h.createdBy,
    "Loại dữ liệu": h.isDemo ? "Demo" : "Real",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Calculation History");

  if (isDemo) {
    const metaData = [
      { Key: "data_source", Value: DEMO_METADATA.data_source },
      { Key: "tenant_name", Value: DEMO_METADATA.tenant_name },
      { Key: "watermark", Value: DEMO_METADATA.watermark },
      { Key: "exported_at", Value: new Date().toISOString() },
    ];
    const metaWs = XLSX.utils.json_to_sheet(metaData);
    XLSX.utils.book_append_sheet(wb, metaWs, "Demo Metadata");
  }

  XLSX.writeFile(wb, `calculation-history-${getDateString()}.xlsx`);
};

// Export Analytics Summary
export const exportAnalyticsSummaryToXLSX = (
  products: DashboardProduct[],
  isDemo: boolean,
) => {
  // Summary stats
  const totalProducts = products.length;
  const totalCO2 = products.reduce((sum, p) => sum + p.co2, 0);
  const avgCO2 = totalProducts > 0 ? totalCO2 / totalProducts : 0;
  const publishedCount = products.filter(
    (p) => p.status === "published",
  ).length;
  const draftCount = products.filter((p) => p.status === "draft").length;
  const avgConfidence =
    products.reduce((sum, p) => sum + p.confidenceScore, 0) /
    (totalProducts || 1);

  // Category breakdown
  const categoryStats = products.reduce(
    (acc, p) => {
      if (!acc[p.category]) {
        acc[p.category] = { count: 0, totalCO2: 0 };
      }
      acc[p.category].count++;
      acc[p.category].totalCO2 += p.co2;
      return acc;
    },
    {} as Record<string, { count: number; totalCO2: number }>,
  );

  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    { "Chỉ số": "Tổng sản phẩm", "Giá trị": totalProducts },
    { "Chỉ số": "Tổng CO2 (kg)", "Giá trị": totalCO2.toFixed(2) },
    { "Chỉ số": "CO2 trung bình (kg)", "Giá trị": avgCO2.toFixed(2) },
    { "Chỉ số": "Sản phẩm Published", "Giá trị": publishedCount },
    { "Chỉ số": "Sản phẩm Draft", "Giá trị": draftCount },
    {
      "Chỉ số": "Độ tin cậy trung bình (%)",
      "Giá trị": avgConfidence.toFixed(1),
    },
  ];
  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  // Category breakdown sheet
  const categoryData = Object.entries(categoryStats).map(([cat, stats]) => ({
    "Danh mục": cat,
    "Số lượng": stats.count,
    "Tổng CO2 (kg)": stats.totalCO2.toFixed(2),
    "CO2 trung bình (kg)": (stats.totalCO2 / stats.count).toFixed(2),
  }));
  const categoryWs = XLSX.utils.json_to_sheet(categoryData);
  XLSX.utils.book_append_sheet(wb, categoryWs, "Category Breakdown");

  // Products detail sheet
  const productsData = products.map((p) => ({
    SKU: p.sku,
    Tên: p.name,
    "Danh mục": p.category,
    "CO2 (kg)": p.co2,
    "Trạng thái": p.status,
    "Độ tin cậy (%)": p.confidenceScore,
  }));
  const productsWs = XLSX.utils.json_to_sheet(productsData);
  XLSX.utils.book_append_sheet(wb, productsWs, "Products Detail");

  // Demo metadata
  if (isDemo) {
    const metaData = [
      { Key: "data_source", Value: DEMO_METADATA.data_source },
      { Key: "tenant_name", Value: DEMO_METADATA.tenant_name },
      { Key: "watermark", Value: DEMO_METADATA.watermark },
      { Key: "exported_at", Value: new Date().toISOString() },
      { Key: "generated_by", Value: DEMO_METADATA.generated_by },
    ];
    const metaWs = XLSX.utils.json_to_sheet(metaData);
    XLSX.utils.book_append_sheet(wb, metaWs, "Demo Metadata");
  }

  XLSX.writeFile(wb, `analytics-summary-${getDateString()}.xlsx`);
};

// Full Company Report (comprehensive)
export const exportFullCompanyReportToXLSX = (
  products: DashboardProduct[],
  activityLogs: ActivityLog[],
  auditLogs: AuditLog[],
  users: UserInfo[],
  isDemo: boolean,
) => {
  const wb = XLSX.utils.book_new();

  // 1. Summary
  const totalCO2 = products.reduce((sum, p) => sum + p.co2, 0);
  const summaryData = [
    { "Chỉ số": "Tổng sản phẩm", "Giá trị": products.length.toString() },
    { "Chỉ số": "Tổng phát thải CO2 (kg)", "Giá trị": totalCO2.toFixed(2) },
    {
      "Chỉ số": "Sản phẩm Published",
      "Giá trị": products
        .filter((p) => p.status === "published")
        .length.toString(),
    },
    { "Chỉ số": "Số người dùng", "Giá trị": users.length.toString() },
    {
      "Chỉ số": "Hoạt động trong 24h",
      "Giá trị": activityLogs
        .filter(
          (l) =>
            new Date(l.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000),
        )
        .length.toString(),
    },
  ];
  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  // 2. Products
  const productsData = products.map((p) => ({
    ID: p.id,
    SKU: p.sku,
    Tên: p.name,
    "CO2 (kg)": p.co2,
    "Trạng thái": p.status,
    "Ngày tạo": formatDate(p.createdAt),
  }));
  const productsWs = XLSX.utils.json_to_sheet(productsData);
  XLSX.utils.book_append_sheet(wb, productsWs, "Products");

  // 3. Activity
  const activityData = activityLogs.map((l) => ({
    "Thời gian": formatDate(l.timestamp),
    "Hành động": l.action,
    "Đối tượng": l.entityName,
    "Người thực hiện": l.userEmail,
  }));
  const activityWs = XLSX.utils.json_to_sheet(activityData);
  XLSX.utils.book_append_sheet(wb, activityWs, "Activity");

  // 4. Audit
  const auditData = auditLogs.map((l) => ({
    "Thời gian": formatDate(l.timestamp),
    "Sự kiện": l.event,
    Email: l.userEmail,
    "Chi tiết": l.details ? JSON.stringify(l.details) : "",
  }));
  const auditWs = XLSX.utils.json_to_sheet(auditData);
  XLSX.utils.book_append_sheet(wb, auditWs, "Audit Log");

  // 5. Users
  const usersData = users.map((u) => ({
    Email: u.email,
    "Họ tên": u.fullName,
    "Vai trò": u.role,
    "Trạng thái": u.status,
    "Đăng nhập cuối": formatDate(u.lastLogin),
  }));
  const usersWs = XLSX.utils.json_to_sheet(usersData);
  XLSX.utils.book_append_sheet(wb, usersWs, "Users");

  // Demo metadata
  if (isDemo) {
    const metaData = [
      { Key: "data_source", Value: DEMO_METADATA.data_source },
      { Key: "tenant_name", Value: DEMO_METADATA.tenant_name },
      { Key: "watermark", Value: DEMO_METADATA.watermark },
      { Key: "exported_at", Value: new Date().toISOString() },
      { Key: "generated_by", Value: DEMO_METADATA.generated_by },
    ];
    const metaWs = XLSX.utils.json_to_sheet(metaData);
    XLSX.utils.book_append_sheet(wb, metaWs, "Demo Metadata");
  }

  XLSX.writeFile(wb, `company-report-${getDateString()}.xlsx`);
};
