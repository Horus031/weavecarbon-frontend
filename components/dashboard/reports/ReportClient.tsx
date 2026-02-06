/* eslint-disable react-hooks/purity */
"use client";

import React, { useState, useMemo } from "react";
import { useProducts } from "@/contexts/ProductContext";
import { useProductStore } from "@/hooks/useProductStore";
import { useIsDemo } from "@/hooks/useTenantData";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Search,
  Filter,
  FileSpreadsheet,
  Package,
  Building2,
  Users,
  Activity,
  Shield,
  BarChart3,
  CheckCircle2,
  Clock,
  History,
} from "lucide-react";

import { toast } from "sonner";
import {
  exportProductsToCSV,
  exportProductsToXLSX,
  exportActivityLogsToCSV,
  exportActivityLogsToXLSX,
  exportAuditLogsToCSV,
  exportAuditLogsToXLSX,
  exportUsersToCSV,
  exportUsersToXLSX,
  exportHistoryToCSV,
  exportHistoryToXLSX,
  exportAnalyticsSummaryToXLSX,
  exportFullCompanyReportToXLSX,
  generateDemoActivityLogs,
  generateDemoAuditLogs,
  generateDemoUsers,
  DEMO_METADATA,
} from "@/lib/exportUtils";
import { useIsMobile } from "@/hooks/useIsMobile";
import MobileFilterSheet from "./mobile/MobileFilterSheet";
import MobileDataCard from "./mobile/MobileDataCard";

// Report types for quick actions
const REPORT_TYPES = [
  {
    id: "product",
    label: "Sản phẩm",
    icon: Package,
    description: "Danh sách sản phẩm & CO2",
  },
  {
    id: "activity",
    label: "Hoạt động",
    icon: Activity,
    description: "Log hoạt động hệ thống",
  },
  {
    id: "audit",
    label: "Audit Log",
    icon: Shield,
    description: "Nhật ký kiểm toán",
  },
  {
    id: "users",
    label: "Người dùng",
    icon: Users,
    description: "Danh sách & vai trò",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    description: "Tổng hợp & thống kê",
  },
  {
    id: "history",
    label: "Lịch sử",
    icon: History,
    description: "Lịch sử tính toán",
  },
];

const ReportsPage: React.FC = () => {
  const isMobile = useIsMobile();
  const isDemo = useIsDemo();
  const { products } = useProducts();
  const { history: calculationHistory } = useProductStore();

  const [activeTab, setActiveTab] = useState<"report" | "export">("report");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Generate data from context
  const activityLogs = useMemo(() => generateDemoActivityLogs(), []);
  const auditLogs = useMemo(() => generateDemoAuditLogs(), []);
  const users = useMemo(() => generateDemoUsers(), []);

  // Dynamically generate reports based on real data
  const reports = useMemo(() => {
    const now = new Date();
    const totalCO2 = products.reduce((sum, p) => sum + p.co2, 0);

    return [
      {
        id: "report-company-monthly",
        title: `Báo cáo Carbon tháng ${now.getMonth() + 1}/${now.getFullYear()}`,
        type: "company",
        typeLabel: "Doanh nghiệp",
        format: "XLSX",
        date: now.toISOString().split("T")[0],
        size: `${(products.length * 0.05 + 0.5).toFixed(1)} MB`,
        status: "completed",
        co2e: totalCO2,
        records: products.length,
      },
      {
        id: "report-products-all",
        title: "Báo cáo toàn bộ sản phẩm",
        type: "product",
        typeLabel: "Sản phẩm",
        format: "CSV/XLSX",
        date: now.toISOString().split("T")[0],
        size: `${(products.length * 0.02).toFixed(1)} MB`,
        status: "completed",
        co2e: totalCO2,
        records: products.length,
      },
      {
        id: "report-activity",
        title: "Báo cáo hoạt động hệ thống",
        type: "activity",
        typeLabel: "Hoạt động",
        format: "CSV/XLSX",
        date: now.toISOString().split("T")[0],
        size: "0.3 MB",
        status: "completed",
        co2e: null,
        records: activityLogs.length,
      },
      {
        id: "report-audit",
        title: "Audit Log Report",
        type: "audit",
        typeLabel: "Kiểm toán",
        format: "CSV/XLSX",
        date: now.toISOString().split("T")[0],
        size: "0.2 MB",
        status: "completed",
        co2e: null,
        records: auditLogs.length,
      },
      {
        id: "report-users",
        title: "Báo cáo người dùng & quyền truy cập",
        type: "users",
        typeLabel: "Người dùng",
        format: "CSV/XLSX",
        date: now.toISOString().split("T")[0],
        size: "0.1 MB",
        status: "completed",
        co2e: null,
        records: users.length,
      },
      {
        id: "report-analytics",
        title: "Báo cáo tổng hợp Analytics",
        type: "analytics",
        typeLabel: "Analytics",
        format: "XLSX",
        date: now.toISOString().split("T")[0],
        size: "0.5 MB",
        status: "completed",
        co2e: totalCO2,
        records: products.length,
      },
      {
        id: "report-history",
        title: "Lịch sử tính toán Carbon",
        type: "history",
        typeLabel: "Lịch sử",
        format: "CSV/XLSX",
        date: now.toISOString().split("T")[0],
        size: "0.3 MB",
        status: "completed",
        co2e: calculationHistory.reduce((sum, h) => sum + h.totalCO2, 0),
        records: calculationHistory.length,
      },
    ];
  }, [products, activityLogs, auditLogs, users, calculationHistory]);

  // Export history (recent exports)
  const [exportHistory, setExportHistory] = useState<
    Array<{
      id: string;
      title: string;
      records: number;
      format: string;
      date: string;
      type: string;
    }>
  >([]);

  // Add to export history
  const addToExportHistory = (
    title: string,
    records: number,
    format: string,
    type: string,
  ) => {
    const newExport = {
      id: `export-${Date.now()}`,
      title,
      records,
      format,
      date: new Date().toISOString().split("T")[0],
      type,
    };
    setExportHistory((prev) => [newExport, ...prev.slice(0, 9)]); // Keep last 10
  };

  // Export handlers
  const handleExportProducts = (format: "csv" | "xlsx") => {
    if (format === "csv") {
      exportProductsToCSV(products, isDemo);
    } else {
      exportProductsToXLSX(products, isDemo);
    }
    addToExportHistory(
      "Products Export",
      products.length,
      format.toUpperCase(),
      "product",
    );
    toast.success(
      `Đã xuất ${products.length} sản phẩm sang ${format.toUpperCase()}`,
    );
  };

  const handleExportActivity = (format: "csv" | "xlsx") => {
    if (format === "csv") {
      exportActivityLogsToCSV(activityLogs, isDemo);
    } else {
      exportActivityLogsToXLSX(activityLogs, isDemo);
    }
    addToExportHistory(
      "Activity Logs Export",
      activityLogs.length,
      format.toUpperCase(),
      "activity",
    );
    toast.success(
      `Đã xuất ${activityLogs.length} hoạt động sang ${format.toUpperCase()}`,
    );
  };

  const handleExportAudit = (format: "csv" | "xlsx") => {
    if (format === "csv") {
      exportAuditLogsToCSV(auditLogs, isDemo);
    } else {
      exportAuditLogsToXLSX(auditLogs, isDemo);
    }
    addToExportHistory(
      "Audit Logs Export",
      auditLogs.length,
      format.toUpperCase(),
      "audit",
    );
    toast.success(
      `Đã xuất ${auditLogs.length} audit logs sang ${format.toUpperCase()}`,
    );
  };

  const handleExportUsers = (format: "csv" | "xlsx") => {
    if (format === "csv") {
      exportUsersToCSV(users, isDemo);
    } else {
      exportUsersToXLSX(users, isDemo);
    }
    addToExportHistory(
      "Users Export",
      users.length,
      format.toUpperCase(),
      "users",
    );
    toast.success(
      `Đã xuất ${users.length} người dùng sang ${format.toUpperCase()}`,
    );
  };

  const handleExportHistory = (format: "csv" | "xlsx") => {
    if (format === "csv") {
      exportHistoryToCSV(calculationHistory, isDemo);
    } else {
      exportHistoryToXLSX(calculationHistory, isDemo);
    }
    addToExportHistory(
      "Calculation History Export",
      calculationHistory.length,
      format.toUpperCase(),
      "history",
    );
    toast.success(
      `Đã xuất ${calculationHistory.length} bản ghi lịch sử sang ${format.toUpperCase()}`,
    );
  };

  const handleExportAnalytics = () => {
    exportAnalyticsSummaryToXLSX(products, isDemo);
    addToExportHistory(
      "Analytics Summary Export",
      products.length,
      "XLSX",
      "analytics",
    );
    toast.success("Đã xuất báo cáo Analytics tổng hợp");
  };

  const handleExportFullReport = () => {
    exportFullCompanyReportToXLSX(
      products,
      activityLogs,
      auditLogs,
      users,
      isDemo,
    );
    addToExportHistory(
      "Full Company Report",
      products.length + activityLogs.length + users.length,
      "XLSX",
      "company",
    );
    toast.success("Đã xuất báo cáo doanh nghiệp đầy đủ");
  };

  // Quick export by type
  const handleQuickExport = (type: string) => {
    switch (type) {
      case "product":
        handleExportProducts("xlsx");
        break;
      case "activity":
        handleExportActivity("xlsx");
        break;
      case "audit":
        handleExportAudit("xlsx");
        break;
      case "users":
        handleExportUsers("xlsx");
        break;
      case "analytics":
        handleExportAnalytics();
        break;
      case "history":
        handleExportHistory("xlsx");
        break;
    }
  };

  // Handle report download
  const handleDownloadReport = (report: (typeof reports)[0]) => {
    switch (report.type) {
      case "product":
        handleExportProducts("xlsx");
        break;
      case "activity":
        handleExportActivity("xlsx");
        break;
      case "audit":
        handleExportAudit("xlsx");
        break;
      case "users":
        handleExportUsers("xlsx");
        break;
      case "analytics":
        handleExportAnalytics();
        break;
      case "history":
        handleExportHistory("xlsx");
        break;
      case "company":
        handleExportFullReport();
        break;
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || report.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleResetFilters = () => {
    setTypeFilter("all");
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "product":
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

  return (
    <div className="space-y-4 md:space-y-6 no-horizontal-scroll">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg md:text-xl font-bold">
              Báo cáo & Xuất dữ liệu
            </h2>
            <p className="text-sm text-muted-foreground line-clamp-2">
              Tạo báo cáo hoặc xuất dữ liệu CSV/Excel với đầy đủ metadata
            </p>
          </div>
          <Button
            onClick={handleExportFullReport}
            className="gap-2 shrink-0 h-10"
            size={isMobile ? "sm" : "default"}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Báo cáo đầy đủ</span>
          </Button>
        </div>

        {/* Demo indicator */}
        {isDemo && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-sm">
            <Badge
              variant="outline"
              className="bg-amber-100 text-amber-700 border-amber-300"
            >
              Demo
            </Badge>
            <span className="text-amber-700">
              Tenant: {DEMO_METADATA.tenant_name} • Dữ liệu export sẽ có
              metadata demo
            </span>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{products.length}</p>
            <p className="text-xs text-muted-foreground">Sản phẩm</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="w-6 h-6 text-primary/80 mx-auto mb-2" />
            <p className="text-2xl font-bold">{activityLogs.length}</p>
            <p className="text-xs text-muted-foreground">Hoạt động</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-primary/70 mx-auto mb-2" />
            <p className="text-2xl font-bold">{users.length}</p>
            <p className="text-xs text-muted-foreground">Người dùng</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <History className="w-6 h-6 text-destructive/70 mx-auto mb-2" />
            <p className="text-2xl font-bold">{calculationHistory.length}</p>
            <p className="text-xs text-muted-foreground">Lịch sử tính</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "report" | "export")}
      >
        <TabsList className="grid w-full max-w-100 grid-cols-2">
          <TabsTrigger value="report" className="gap-2">
            <FileText className="w-4 h-4" />
            <span>Báo cáo</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-2">
            <Download className="w-4 h-4" />
            <span>Xuất dữ liệu</span>
          </TabsTrigger>
        </TabsList>

        {/* Report Tab */}
        <TabsContent value="report" className="mt-4 space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-2 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm báo cáo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {/* Mobile filter */}
            <MobileFilterSheet
              title="Lọc báo cáo"
              onReset={handleResetFilters}
              trigger={
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 md:hidden shrink-0"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              }
            >
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Loại báo cáo
                  </Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="product">Sản phẩm</SelectItem>
                      <SelectItem value="activity">Hoạt động</SelectItem>
                      <SelectItem value="audit">Audit Log</SelectItem>
                      <SelectItem value="users">Người dùng</SelectItem>
                      <SelectItem value="analytics">Analytics</SelectItem>
                      <SelectItem value="history">Lịch sử</SelectItem>
                      <SelectItem value="company">Doanh nghiệp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </MobileFilterSheet>

            {/* Desktop filters */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-37.5 hidden md:flex">
                <SelectValue placeholder="Loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="product">Sản phẩm</SelectItem>
                <SelectItem value="activity">Hoạt động</SelectItem>
                <SelectItem value="audit">Audit Log</SelectItem>
                <SelectItem value="users">Người dùng</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="history">Lịch sử</SelectItem>
                <SelectItem value="company">Doanh nghiệp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reports List */}
          <div className="grid gap-3">
            {filteredReports.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Không tìm thấy báo cáo</h3>
                  <p className="text-sm text-muted-foreground">
                    Thử thay đổi bộ lọc hoặc tạo báo cáo mới
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredReports.map((report) => (
                <MobileDataCard
                  key={report.id}
                  title={report.title}
                  subtitle={`${report.date} • ${report.records} bản ghi`}
                  icon={getTypeIcon(report.type)}
                  status={{
                    label: "Sẵn sàng",
                    className: "bg-green-100 text-green-700",
                  }}
                  tags={[report.typeLabel, report.format]}
                  metrics={
                    report.co2e !== null
                      ? [
                          {
                            value: report.co2e.toFixed(1),
                            unit: "kg CO₂e",
                            className: "text-primary",
                          },
                        ]
                      : []
                  }
                  onClick={() => {}}
                  actions={
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => handleDownloadReport(report)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Tải
                      </Button>
                    </div>
                  }
                  showChevron={false}
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="mt-4 space-y-4">
          {/* Quick Export Actions */}
          <div>
            <h3 className="text-sm font-medium mb-3">Xuất nhanh theo loại</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {REPORT_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <Card
                    key={type.id}
                    className="cursor-pointer hover:shadow-md transition-shadow touch-target"
                    onClick={() => handleQuickExport(type.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">{type.label}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Export Format Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Chọn định dạng xuất</CardTitle>
              <CardDescription>
                Chọn loại dữ liệu và định dạng file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Products */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">
                      Sản phẩm ({products.length})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Danh sách sản phẩm & CO2
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportProducts("csv")}
                  >
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportProducts("xlsx")}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                    XLSX
                  </Button>
                </div>
              </div>

              {/* Activity Logs */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-primary/80" />
                  <div>
                    <p className="font-medium text-sm">
                      Hoạt động ({activityLogs.length})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Log CREATE, UPDATE, APPROVE
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportActivity("csv")}
                  >
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportActivity("xlsx")}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                    XLSX
                  </Button>
                </div>
              </div>

              {/* Audit Logs */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-destructive/70" />
                  <div>
                    <p className="font-medium text-sm">
                      Audit Log ({auditLogs.length})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      LOGIN, EXPORT, SIGNUP events
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportAudit("csv")}
                  >
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportAudit("xlsx")}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                    XLSX
                  </Button>
                </div>
              </div>

              {/* Users */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary/70" />
                  <div>
                    <p className="font-medium text-sm">
                      Người dùng ({users.length})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Admin, Member, Last login
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportUsers("csv")}
                  >
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportUsers("xlsx")}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                    XLSX
                  </Button>
                </div>
              </div>

              {/* Calculation History */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5 text-accent-foreground/70" />
                  <div>
                    <p className="font-medium text-sm">
                      Lịch sử tính ({calculationHistory.length})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Chi tiết CO2 theo version
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportHistory("csv")}
                  >
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportHistory("xlsx")}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                    XLSX
                  </Button>
                </div>
              </div>

              {/* Full Analytics */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-primary/5">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Analytics tổng hợp</p>
                    <p className="text-xs text-muted-foreground">
                      Summary + Category breakdown
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={handleExportAnalytics}>
                  <FileSpreadsheet className="w-4 h-4 mr-1" />
                  XLSX
                </Button>
              </div>

              {/* Full Company Report */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-primary/5">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">
                      Báo cáo doanh nghiệp đầy đủ
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tất cả dữ liệu trong 1 file
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={handleExportFullReport}>
                  <Download className="w-4 h-4 mr-1" />
                  Export All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Export History */}
          {exportHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Lịch sử xuất dữ liệu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {exportHistory.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate">{exp.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {exp.records} bản ghi • {exp.date}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0 ml-2">
                      {exp.format}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Mobile note */}
          {isMobile && (
            <p className="text-xs text-muted-foreground text-center py-2">
              💡 File Excel/CSV phù hợp xem trên máy tính
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
