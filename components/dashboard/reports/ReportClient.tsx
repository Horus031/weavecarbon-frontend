/* eslint-disable react-hooks/purity */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useProducts } from "@/contexts/ProductContext";
import { useProductStore } from "@/hooks/useProductStore";
import { useDashboardTitle } from "@/contexts/DashboardContext";
import { api } from "@/lib/apiClient";
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
  type ActivityLog,
  type AuditLog,
  type UserInfo,
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
} from "@/lib/exportUtils";
import { useIsMobile } from "@/hooks/useIsMobile";
import MobileFilterSheet from "./mobile/MobileFilterSheet";
import MobileDataCard from "./mobile/MobileDataCard";

const ReportsPage: React.FC = () => {
  const t = useTranslations("reports");
  const { setPageTitle } = useDashboardTitle();
  
  // Report types for quick actions
  const REPORT_TYPES = [
    {
      id: "product",
      label: t("types.product.label"),
      icon: Package,
      description: t("types.product.description"),
    },
    {
      id: "activity",
      label: t("types.activity.label"),
      icon: Activity,
      description: t("types.activity.description"),
    },
    {
      id: "audit",
      label: t("types.audit.label"),
      icon: Shield,
      description: t("types.audit.description"),
    },
    {
      id: "users",
      label: t("types.users.label"),
      icon: Users,
      description: t("types.users.description"),
    },
    {
      id: "analytics",
      label: t("types.analytics.label"),
      icon: BarChart3,
      description: t("types.analytics.description"),
    },
    {
      id: "history",
      label: t("types.history.label"),
      icon: History,
      description: t("types.history.description"),
    },
  ];
  const isMobile = useIsMobile();
  const { products } = useProducts();
  const { history: calculationHistory } = useProductStore();

  const [activeTab, setActiveTab] = useState<"report" | "export">("report");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 14;
  const [isMounted, setIsMounted] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);

  // Ensure hydration consistency by only rendering date-dependent content after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setPageTitle(t("title"), t("subtitle"));
  }, [setPageTitle, t]);

  useEffect(() => {
    let cancelled = false;

    const loadReportSources = async () => {
      const [activityResult, auditResult, usersResult] =
        await Promise.allSettled([
          api.get<ActivityLog[]>("/reports/activity-logs"),
          api.get<AuditLog[]>("/reports/audit-logs"),
          api.get<UserInfo[]>("/companies/current/users"),
        ]);

      if (cancelled) return;

      setActivityLogs(
        activityResult.status === "fulfilled" ? activityResult.value : [],
      );
      setAuditLogs(auditResult.status === "fulfilled" ? auditResult.value : []);
      setUsers(usersResult.status === "fulfilled" ? usersResult.value : []);
    };

    loadReportSources();

    return () => {
      cancelled = true;
    };
  }, []);

  // Dynamically generate reports based on real data
  const reports = useMemo(() => {
    if (!isMounted) return [];
    
    const now = new Date();
    const totalCO2 = products.reduce((sum, p) => sum + p.co2, 0);

    return [
      {
        id: "report-company-monthly",
        title: t("monthlyReport", { month: now.getMonth() + 1, year: now.getFullYear() }),
        type: "company",
        typeLabel: t("filterOptions.company"),
        format: "XLSX",
        date: now.toISOString().split("T")[0],
        size: `${(products.length * 0.05 + 0.5).toFixed(1)} MB`,
        status: "completed",
        co2e: totalCO2,
        records: products.length,
      },
      {
        id: "report-products-all",
        title: t("allProductsReport"),
        type: "product",
        typeLabel: t("filterOptions.product"),
        format: "CSV/XLSX",
        date: now.toISOString().split("T")[0],
        size: `${(products.length * 0.02).toFixed(1)} MB`,
        status: "completed",
        co2e: totalCO2,
        records: products.length,
      },
      {
        id: "report-activity",
        title: t("systemActivityReport"),
        type: "activity",
        typeLabel: t("filterOptions.activity"),
        format: "CSV/XLSX",
        date: now.toISOString().split("T")[0],
        size: "0.3 MB",
        status: "completed",
        co2e: null,
        records: activityLogs.length,
      },
      {
        id: "report-audit",
        title: t("auditLogReport"),
        type: "audit",
        typeLabel: t("filterOptions.audit"),
        format: "CSV/XLSX",
        date: now.toISOString().split("T")[0],
        size: "0.2 MB",
        status: "completed",
        co2e: null,
        records: auditLogs.length,
      },
      {
        id: "report-users",
        title: t("usersPermissionReport"),
        type: "users",
        typeLabel: t("filterOptions.users"),
        format: "CSV/XLSX",
        date: now.toISOString().split("T")[0],
        size: "0.1 MB",
        status: "completed",
        co2e: null,
        records: users.length,
      },
      {
        id: "report-analytics",
        title: t("analyticsReport"),
        type: "analytics",
        typeLabel: t("filterOptions.analytics"),
        format: "XLSX",
        date: now.toISOString().split("T")[0],
        size: "0.5 MB",
        status: "completed",
        co2e: totalCO2,
        records: products.length,
      },
      {
        id: "report-history",
        title: t("calculationHistoryReport"),
        type: "history",
        typeLabel: t("filterOptions.history"),
        format: "CSV/XLSX",
        date: now.toISOString().split("T")[0],
        size: "0.3 MB",
        status: "completed",
        co2e: calculationHistory.reduce((sum, h) => sum + h.totalCO2, 0),
        records: calculationHistory.length,
      },
    ];
  }, [products, activityLogs, auditLogs, users, calculationHistory, t, isMounted]);

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
      exportProductsToCSV(products);
    } else {
      exportProductsToXLSX(products);
    }
    addToExportHistory(
      "Products Export",
      products.length,
      format.toUpperCase(),
      "product",
    );
    toast.success(
      t("toasts.success", { count: products.length, type: t("stats.products"), format: format.toUpperCase() }),
    );
  };

  const handleExportActivity = (format: "csv" | "xlsx") => {
    if (format === "csv") {
      exportActivityLogsToCSV(activityLogs);
    } else {
      exportActivityLogsToXLSX(activityLogs);
    }
    addToExportHistory(
      "Activity Logs Export",
      activityLogs.length,
      format.toUpperCase(),
      "activity",
    );
    toast.success(
      t("toasts.success", { count: activityLogs.length, type: t("stats.activities"), format: format.toUpperCase() }),
    );
  };

  const handleExportAudit = (format: "csv" | "xlsx") => {
    if (format === "csv") {
      exportAuditLogsToCSV(auditLogs);
    } else {
      exportAuditLogsToXLSX(auditLogs);
    }
    addToExportHistory(
      "Audit Logs Export",
      auditLogs.length,
      format.toUpperCase(),
      "audit",
    );
    toast.success(
      t("toasts.success", { count: auditLogs.length, type: t("filterOptions.audit"), format: format.toUpperCase() }),
    );
  };

  const handleExportUsers = (format: "csv" | "xlsx") => {
    if (format === "csv") {
      exportUsersToCSV(users);
    } else {
      exportUsersToXLSX(users);
    }
    addToExportHistory(
      "Users Export",
      users.length,
      format.toUpperCase(),
      "users",
    );
    toast.success(
      t("toasts.success", { count: users.length, type: t("stats.users"), format: format.toUpperCase() }),
    );
  };

  const handleExportHistory = (format: "csv" | "xlsx") => {
    if (format === "csv") {
      exportHistoryToCSV(calculationHistory);
    } else {
      exportHistoryToXLSX(calculationHistory);
    }
    addToExportHistory(
      "Calculation History Export",
      calculationHistory.length,
      format.toUpperCase(),
      "history",
    );
    toast.success(
      t("toasts.success", { count: calculationHistory.length, type: t("stats.calculationHistory"), format: format.toUpperCase() }),
    );
  };

  const handleExportAnalytics = () => {
    exportAnalyticsSummaryToXLSX(products);
    addToExportHistory(
      "Analytics Summary Export",
      products.length,
      "XLSX",
      "analytics",
    );
    toast.success(t("toasts.analyticsSuccess"));
  };

  const handleExportFullReport = () => {
    exportFullCompanyReportToXLSX(
      products,
      activityLogs,
      auditLogs,
      users,
    );
    addToExportHistory(
      "Full Company Report",
      products.length + activityLogs.length + users.length,
      "XLSX",
      "company",
    );
    toast.success(t("toasts.fullReportSuccess"));
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
    const matchesDateFrom = !dateFrom || report.date >= dateFrom;
    const matchesDateTo = !dateTo || report.date <= dateTo;
    return matchesSearch && matchesType && matchesDateFrom && matchesDateTo;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReports.length / ITEMS_PER_PAGE),
  );

  useEffect(() => {
    if (activeTab !== "report") return;
    setCurrentPage(1);
  }, [activeTab, searchQuery, typeFilter, dateFrom, dateTo, reports.length]);

  useEffect(() => {
    if (activeTab !== "report") return;
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [activeTab, totalPages]);

  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReports.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredReports, currentPage]);

  const handleResetFilters = () => {
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
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
    <div className="space-y-4 md:space-y-6 no-horizontal-scroll" suppressHydrationWarning>
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{products.length}</p>
            <p className="text-xs text-muted-foreground">{t("stats.products")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="w-6 h-6 text-primary/80 mx-auto mb-2" />
            <p className="text-2xl font-bold">{activityLogs.length}</p>
            <p className="text-xs text-muted-foreground">{t("stats.activities")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-primary/70 mx-auto mb-2" />
            <p className="text-2xl font-bold">{users.length}</p>
            <p className="text-xs text-muted-foreground">{t("stats.users")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <History className="w-6 h-6 text-destructive/70 mx-auto mb-2" />
            <p className="text-2xl font-bold">{calculationHistory.length}</p>
            <p className="text-xs text-muted-foreground">{t("stats.calculationHistory")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "report" | "export")}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <TabsList className="grid w-full md:w-auto max-w-100 grid-cols-2">
            <TabsTrigger value="report" className="gap-2">
              <FileText className="w-4 h-4" />
              <span>{t("tabs.reports")}</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2">
              <Download className="w-4 h-4" />
              <span>{t("tabs.export")}</span>
            </TabsTrigger>
          </TabsList>
          <Button
            onClick={handleExportFullReport}
            className="gap-2 shrink-0 h-10"
            size={isMobile ? "sm" : "default"}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t("fullReport")}</span>
          </Button>
        </div>

        {/* Report Tab */}
        <TabsContent value="report" className="mt-4 space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {/* Mobile filter */}
            <MobileFilterSheet
              title={t("filterLabel")}
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
                    {t("filterType")}
                  </Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder={t("filterPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("filterOptions.all")}</SelectItem>
                      <SelectItem value="product">{t("filterOptions.product")}</SelectItem>
                      <SelectItem value="activity">{t("filterOptions.activity")}</SelectItem>
                      <SelectItem value="audit">{t("filterOptions.audit")}</SelectItem>
                      <SelectItem value="users">{t("filterOptions.users")}</SelectItem>
                      <SelectItem value="analytics">{t("filterOptions.analytics")}</SelectItem>
                      <SelectItem value="history">{t("filterOptions.history")}</SelectItem>
                      <SelectItem value="company">{t("filterOptions.company")}</SelectItem>
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
                    className="h-12"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    {t("dateTo")}
                  </Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>
            </MobileFilterSheet>

            {/* Desktop filters */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-37.5 hidden md:flex">
                <SelectValue placeholder={t("filterType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filterOptions.all")}</SelectItem>
                <SelectItem value="product">{t("filterOptions.product")}</SelectItem>
                <SelectItem value="activity">{t("filterOptions.activity")}</SelectItem>
                <SelectItem value="audit">{t("filterOptions.audit")}</SelectItem>
                <SelectItem value="users">{t("filterOptions.users")}</SelectItem>
                <SelectItem value="analytics">{t("filterOptions.analytics")}</SelectItem>
                <SelectItem value="history">{t("filterOptions.history")}</SelectItem>
                <SelectItem value="company">{t("filterOptions.company")}</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-1 md:w-40">
              <Label className="text-xs text-muted-foreground md:sr-only">
                {t("dateFrom")}
              </Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1 md:w-40">
              <Label className="text-xs text-muted-foreground md:sr-only">
                {t("dateTo")}
              </Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          {/* Reports List */}
          <div className="grid gap-3 md:grid-cols-2">
            {filteredReports.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">{t("notFound")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("notFoundDesc")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              paginatedReports.map((report) => (
                <MobileDataCard
                  key={report.id}
                  title={report.title}
                  subtitle={`${report.date} • ${t("records", { count: report.records })}`}
                  icon={getTypeIcon(report.type)}
                  status={{
                    label: t("ready"),
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
                        {t("download")}
                      </Button>
                    </div>
                  }
                  showChevron={false}
                />
              ))
            )}
          </div>

          {filteredReports.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                {t("pagination.prev")}
              </Button>
              <span className="text-xs text-muted-foreground">
                {t("pagination.page", {
                  current: currentPage,
                  total: totalPages,
                })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                {t("pagination.next")}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="mt-4 space-y-4">
          {/* Quick Export Actions */}
          <div>
            <h3 className="text-sm font-medium mb-3">{t("quickExport")}</h3>
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
              <CardTitle className="text-base">{t("selectFormat")}</CardTitle>
              <CardDescription>
                {t("selectFormatDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Products */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">
                      {t("formats.products.title", { count: products.length })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("formats.products.description")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportProducts("csv")}
                  >
                    {t("csv")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportProducts("xlsx")}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                    {t("xlsx")}
                  </Button>
                </div>
              </div>

              {/* Activity Logs */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-primary/80" />
                  <div>
                    <p className="font-medium text-sm">
                      {t("formats.activities.title", { count: activityLogs.length })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("formats.activities.description")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportActivity("csv")}
                  >
                    {t("csv")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportActivity("xlsx")}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                    {t("xlsx")}
                  </Button>
                </div>
              </div>

              {/* Audit Logs */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-destructive/70" />
                  <div>
                    <p className="font-medium text-sm">
                      {t("formats.audit.title", { count: auditLogs.length })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("formats.audit.description")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportAudit("csv")}
                  >
                    {t("csv")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportAudit("xlsx")}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                    {t("xlsx")}
                  </Button>
                </div>
              </div>

              {/* Users */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary/70" />
                  <div>
                    <p className="font-medium text-sm">
                      {t("formats.users.title", { count: users.length })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("formats.users.description")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportUsers("csv")}
                  >
                    {t("csv")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportUsers("xlsx")}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                    {t("xlsx")}
                  </Button>
                </div>
              </div>

              {/* Calculation History */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5 text-accent-foreground/70" />
                  <div>
                    <p className="font-medium text-sm">
                      {t("formats.history.title", { count: calculationHistory.length })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("formats.history.description")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportHistory("csv")}
                  >
                    {t("csv")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportHistory("xlsx")}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                    {t("xlsx")}
                  </Button>
                </div>
              </div>

              {/* Full Analytics */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-primary/5">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{t("formats.analytics.title")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("formats.analytics.description")}
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={handleExportAnalytics}>
                  <FileSpreadsheet className="w-4 h-4 mr-1" />
                  {t("xlsx")}
                </Button>
              </div>

              {/* Full Company Report */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-primary/5">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">
                      {t("formats.fullReport.title")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("formats.fullReport.description")}
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={handleExportFullReport}>
                  <Download className="w-4 h-4 mr-1" />
                  {t("exportAll")}
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
                  {t("exportHistory")}
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
                          {t("records", { count: exp.records })} • {exp.date}
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
              {t("mobileNote")}
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
