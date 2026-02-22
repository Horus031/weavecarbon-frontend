"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle
} from "lucide-react";
import { ComplianceDocument, DOCUMENT_STATUS_CONFIG } from "./types";

interface ComplianceDocumentsProps {
  documents: ComplianceDocument[];
  requiredDocumentsCount?: number;
  requiredDocumentsUploadedCount?: number;
  onDownload: (docId: string) => void;
  onRemove: (docId: string) => void;
  onView: (docId: string) => void;
}

const STATUS_ICONS = {
  missing: XCircle,
  uploaded: Clock,
  approved: CheckCircle2,
  expired: AlertCircle
};

const isRequiredDocumentCompleted = (status: ComplianceDocument["status"]) =>
  status === "approved";

const ComplianceDocuments: React.FC<ComplianceDocumentsProps> = ({
  documents,
  requiredDocumentsCount,
  requiredDocumentsUploadedCount,
  onDownload,
  onRemove,
  onView
}) => {
  const t = useTranslations("export.documents");
  const requiredDocs = documents.filter((doc) => doc.required);
  const optionalDocs = documents.filter((doc) => !doc.required && doc.status !== "missing");

  const completedRequiredFromDocuments = requiredDocs.filter((doc) =>
    isRequiredDocumentCompleted(doc.status)
  ).length;
  const completedRequired =
    requiredDocs.length > 0
      ? completedRequiredFromDocuments
      : typeof requiredDocumentsUploadedCount === "number"
        ? requiredDocumentsUploadedCount
        : completedRequiredFromDocuments;
  const totalRequired =
    typeof requiredDocumentsCount === "number" ? requiredDocumentsCount : requiredDocs.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            {t("title")}
          </CardTitle>
          <Badge variant="outline">
            {t("requiredComplete", { completed: completedRequired, total: totalRequired })}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
          {t("uploadManagedAtCertificates")}
        </div>

        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            {t("requiredDocs")}
          </h4>
          <div className="space-y-2">
            {requiredDocs.map((doc) => (
              <DocumentRow
                key={doc.id}
                document={doc}
                onDownload={onDownload}
                onRemove={onRemove}
                onView={onView}
              />
            ))}
          </div>
        </div>

        {optionalDocs.length > 0 && (
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
              {t("recommendedDocs")}
            </h4>
            <div className="space-y-2">
              {optionalDocs.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  document={doc}
                  onDownload={onDownload}
                  onRemove={onRemove}
                  onView={onView}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface DocumentRowProps {
  document: ComplianceDocument;
  onDownload: (docId: string) => void;
  onRemove: (docId: string) => void;
  onView: (docId: string) => void;
}

const DocumentRow: React.FC<DocumentRowProps> = ({ document, onDownload, onRemove, onView }) => {
  const t = useTranslations("export.documents");
  const statusConfig = DOCUMENT_STATUS_CONFIG[document.status];
  const StatusIcon = STATUS_ICONS[document.status];
  const hasUploadedFile = document.status !== "missing";

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50 md:flex-row md:items-center">
      <div className={`w-fit shrink-0 rounded-lg p-2 ${statusConfig.bgColor}`}>
        <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{document.name}</p>
          <Badge className={`${statusConfig.bgColor} ${statusConfig.color} shrink-0 text-xs`}>
            {statusConfig.label}
          </Badge>
        </div>

        {document.status !== "missing" && (
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            {document.uploadedBy && <span>{t("uploadedBy", { user: document.uploadedBy })}</span>}
            {document.validTo && <span>{t("validUntil", { date: document.validTo })}</span>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {hasUploadedFile ? (
          <>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onView(document.id)}
              aria-label={t("view")}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDownload(document.id)}
              aria-label={t("download")}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onRemove(document.id)}
              aria-label={t("remove")}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </>
        ) : (
          <Badge variant="secondary">{t("pendingUpload")}</Badge>
        )}
      </div>
    </div>
  );
};

export default ComplianceDocuments;
