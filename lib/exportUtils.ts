
import * as XLSX from "xlsx";
import { DashboardProduct } from "@/contexts/ProductContext";
import type { CalculationHistory } from "@/types/productData";


export const exportToExcel = (
data: Record<string, any>[],
filename: string) =>
{
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Data");

  XLSX.writeFile(wb, `${filename}-${getDateString()}.xlsx`);
};

export const exportToCSV = (
data: Record<string, any>[],
filename: string) =>
{
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const rows = data.map((item) => headers.map((h) => String(item[h] ?? "")));

  const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");

  downloadFile(
    csvContent,
    `${filename}-${getDateString()}.csv`,
    "text/csv;charset=utf-8;"
  );
};


const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};


const getDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};


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
}

export interface AuditLog {
  id: string;
  timestamp: string;
  event:
  "LOGIN" |
  "LOGOUT" |
  "CREATE_ORDER" |
  "EXPORT_REPORT" |
  "UPDATE_PRODUCT" |
  "DELETE_PRODUCT" |
  "SIGNUP_COMPLETED" |
  "FIRST_LOGIN";
  userId: string;
  userEmail: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

export interface UserInfo {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "member" | "viewer";
  status: "active" | "inactive";
  lastLogin: string;
  createdAt: string;
}


const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};


export const exportProductsToCSV = (products: DashboardProduct[]) => {
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
  "Ngày tạo"];


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
  formatDate(p.createdAt)]
  );

  const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");

  downloadFile(
    csvContent,
    `products-export-${getDateString()}.csv`,
    "text/csv;charset=utf-8;"
  );
};


export const exportProductsToXLSX = (products: DashboardProduct[]) => {
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
    "Ngày tạo": formatDate(p.createdAt)
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Products");

  XLSX.writeFile(wb, `products-export-${getDateString()}.xlsx`);
};


export const exportActivityLogsToCSV = (
logs: ActivityLog[]) =>
{
  const headers = [
  "ID",
  "Thời gian",
  "Hành động",
  "Loại đối tượng",
  "ID đối tượng",
  "Tên đối tượng",
  "User ID",
  "Email",
  "Chi tiết"];


  const rows = logs.map((l) => [
  l.id,
  formatDate(l.timestamp),
  l.action,
  l.entityType,
  l.entityId,
  l.entityName,
  l.userId,
  l.userEmail,
  l.details || ""]
  );

  const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");

  downloadFile(
    csvContent,
    `activity-logs-${getDateString()}.csv`,
    "text/csv;charset=utf-8;"
  );
};

export const exportActivityLogsToXLSX = (
logs: ActivityLog[]) =>
{
  const data = logs.map((l) => ({
    ID: l.id,
    "Thời gian": formatDate(l.timestamp),
    "Hành động": l.action,
    "Loại đối tượng": l.entityType,
    "ID đối tượng": l.entityId,
    "Tên đối tượng": l.entityName,
    "User ID": l.userId,
    Email: l.userEmail,
    "Chi tiết": l.details || ""
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Activity Logs");

  XLSX.writeFile(wb, `activity-logs-${getDateString()}.xlsx`);
};


export const exportAuditLogsToCSV = (logs: AuditLog[]) => {
  const headers = [
  "ID",
  "Thời gian",
  "Sự kiện",
  "User ID",
  "Email",
  "IP Address",
  "User Agent",
  "Chi tiết"];


  const rows = logs.map((l) => [
  l.id,
  formatDate(l.timestamp),
  l.event,
  l.userId,
  l.userEmail,
  l.ipAddress || "",
  l.userAgent || "",
  l.details ? JSON.stringify(l.details) : ""]
  );

  const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");

  downloadFile(
    csvContent,
    `audit-logs-${getDateString()}.csv`,
    "text/csv;charset=utf-8;"
  );
};

export const exportAuditLogsToXLSX = (logs: AuditLog[]) => {
  const data = logs.map((l) => ({
    ID: l.id,
    "Thời gian": formatDate(l.timestamp),
    "Sự kiện": l.event,
    "User ID": l.userId,
    Email: l.userEmail,
    "IP Address": l.ipAddress || "",
    "User Agent": l.userAgent || "",
    "Chi tiết": l.details ? JSON.stringify(l.details) : ""
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Audit Logs");

  XLSX.writeFile(wb, `audit-logs-${getDateString()}.xlsx`);
};


export const exportUsersToCSV = (users: UserInfo[]) => {
  const headers = [
  "ID",
  "Email",
  "Họ tên",
  "Vai trò",
  "Trạng thái",
  "Đăng nhập cuối",
  "Ngày tạo"];


  const rows = users.map((u) => [
  u.id,
  u.email,
  u.fullName,
  u.role,
  u.status,
  formatDate(u.lastLogin),
  formatDate(u.createdAt)]
  );

  const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");

  downloadFile(
    csvContent,
    `users-export-${getDateString()}.csv`,
    "text/csv;charset=utf-8;"
  );
};

export const exportUsersToXLSX = (users: UserInfo[]) => {
  const data = users.map((u) => ({
    ID: u.id,
    Email: u.email,
    "Họ tên": u.fullName,
    "Vai trò": u.role,
    "Trạng thái": u.status,
    "Đăng nhập cuối": formatDate(u.lastLogin),
    "Ngày tạo": formatDate(u.createdAt)
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Users");

  XLSX.writeFile(wb, `users-export-${getDateString()}.xlsx`);
};


export const exportHistoryToCSV = (
history: CalculationHistory[]) =>
{
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
  "Người tính"];


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
  h.createdBy]
  );

  const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");

  downloadFile(
    csvContent,
    `calculation-history-${getDateString()}.csv`,
    "text/csv;charset=utf-8;"
  );
};

export const exportHistoryToXLSX = (
history: CalculationHistory[]) =>
{
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
    "Người tính": h.createdBy
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Calculation History");

  XLSX.writeFile(wb, `calculation-history-${getDateString()}.xlsx`);
};


export const exportAnalyticsSummaryToXLSX = (products: DashboardProduct[]) => {

  const totalProducts = products.length;
  const totalCO2 = products.reduce((sum, p) => sum + p.co2, 0);
  const avgCO2 = totalProducts > 0 ? totalCO2 / totalProducts : 0;
  const publishedCount = products.filter(
    (p) => p.status === "published"
  ).length;
  const draftCount = products.filter((p) => p.status === "draft").length;
  const avgConfidence =
  products.reduce((sum, p) => sum + p.confidenceScore, 0) / (
  totalProducts || 1);


  const categoryStats = products.reduce(
    (acc, p) => {
      if (!acc[p.category]) {
        acc[p.category] = { count: 0, totalCO2: 0 };
      }
      acc[p.category].count++;
      acc[p.category].totalCO2 += p.co2;
      return acc;
    },
    {} as Record<string, {count: number;totalCO2: number;}>
  );

  const wb = XLSX.utils.book_new();


  const summaryData = [
  { "Chỉ số": "Tổng sản phẩm", "Giá trị": totalProducts },
  { "Chỉ số": "Tổng CO2 (kg)", "Giá trị": totalCO2.toFixed(2) },
  { "Chỉ số": "CO2 trung bình (kg)", "Giá trị": avgCO2.toFixed(2) },
  { "Chỉ số": "Sản phẩm Published", "Giá trị": publishedCount },
  { "Chỉ số": "Sản phẩm Draft", "Giá trị": draftCount },
  {
    "Chỉ số": "Độ tin cậy trung bình (%)",
    "Giá trị": avgConfidence.toFixed(1)
  }];

  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");


  const categoryData = Object.entries(categoryStats).map(([cat, stats]) => ({
    "Danh mục": cat,
    "Số lượng": stats.count,
    "Tổng CO2 (kg)": stats.totalCO2.toFixed(2),
    "CO2 trung bình (kg)": (stats.totalCO2 / stats.count).toFixed(2)
  }));
  const categoryWs = XLSX.utils.json_to_sheet(categoryData);
  XLSX.utils.book_append_sheet(wb, categoryWs, "Category Breakdown");


  const productsData = products.map((p) => ({
    SKU: p.sku,
    Tên: p.name,
    "Danh mục": p.category,
    "CO2 (kg)": p.co2,
    "Trạng thái": p.status,
    "Độ tin cậy (%)": p.confidenceScore
  }));
  const productsWs = XLSX.utils.json_to_sheet(productsData);
  XLSX.utils.book_append_sheet(wb, productsWs, "Products Detail");

  XLSX.writeFile(wb, `analytics-summary-${getDateString()}.xlsx`);
};


export const exportFullCompanyReportToXLSX = (
products: DashboardProduct[],
activityLogs: ActivityLog[],
auditLogs: AuditLog[],
users: UserInfo[]) =>
{
  const wb = XLSX.utils.book_new();


  const totalCO2 = products.reduce((sum, p) => sum + p.co2, 0);
  const summaryData = [
  { "Chỉ số": "Tổng sản phẩm", "Giá trị": products.length.toString() },
  { "Chỉ số": "Tổng phát thải CO2 (kg)", "Giá trị": totalCO2.toFixed(2) },
  {
    "Chỉ số": "Sản phẩm Published",
    "Giá trị": products.
    filter((p) => p.status === "published").
    length.toString()
  },
  { "Chỉ số": "Số người dùng", "Giá trị": users.length.toString() },
  {
    "Chỉ số": "Hoạt động trong 24h",
    "Giá trị": activityLogs.
    filter(
      (l) =>
      new Date(l.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).
    length.toString()
  }];

  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");


  const productsData = products.map((p) => ({
    ID: p.id,
    SKU: p.sku,
    Tên: p.name,
    "CO2 (kg)": p.co2,
    "Trạng thái": p.status,
    "Ngày tạo": formatDate(p.createdAt)
  }));
  const productsWs = XLSX.utils.json_to_sheet(productsData);
  XLSX.utils.book_append_sheet(wb, productsWs, "Products");


  const activityData = activityLogs.map((l) => ({
    "Thời gian": formatDate(l.timestamp),
    "Hành động": l.action,
    "Đối tượng": l.entityName,
    "Người thực hiện": l.userEmail
  }));
  const activityWs = XLSX.utils.json_to_sheet(activityData);
  XLSX.utils.book_append_sheet(wb, activityWs, "Activity");


  const auditData = auditLogs.map((l) => ({
    "Thời gian": formatDate(l.timestamp),
    "Sự kiện": l.event,
    Email: l.userEmail,
    "Chi tiết": l.details ? JSON.stringify(l.details) : ""
  }));
  const auditWs = XLSX.utils.json_to_sheet(auditData);
  XLSX.utils.book_append_sheet(wb, auditWs, "Audit Log");


  const usersData = users.map((u) => ({
    Email: u.email,
    "Họ tên": u.fullName,
    "Vai trò": u.role,
    "Trạng thái": u.status,
    "Đăng nhập cuối": formatDate(u.lastLogin)
  }));
  const usersWs = XLSX.utils.json_to_sheet(usersData);
  XLSX.utils.book_append_sheet(wb, usersWs, "Users");

  XLSX.writeFile(wb, `company-report-${getDateString()}.xlsx`);
};