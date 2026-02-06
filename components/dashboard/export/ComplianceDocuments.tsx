"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { ComplianceDocument, DOCUMENT_STATUS_CONFIG } from "./types";

interface ComplianceDocumentsProps {
  documents: ComplianceDocument[];
  onUpload: (docId: string) => void;
  onDownload: (docId: string) => void;
  onRemove: (docId: string) => void;
  onView: (docId: string) => void;
}

const STATUS_ICONS = {
  missing: XCircle,
  uploaded: Clock,
  approved: CheckCircle2,
  expired: AlertCircle,
};

const ComplianceDocuments: React.FC<ComplianceDocumentsProps> = ({
  documents,
  onUpload,
  onDownload,
  onRemove,
  onView,
}) => {
  const requiredDocs = documents.filter((d) => d.required);
  const optionalDocs = documents.filter((d) => !d.required);
  const completedRequired = requiredDocs.filter(
    (d) => d.status === "uploaded" || d.status === "approved",
  ).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-primary" />
            Chứng chỉ & Giấy tờ
          </CardTitle>
          <Badge variant="outline">
            {completedRequired}/{requiredDocs.length} bắt buộc
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Required Documents */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Tài liệu bắt buộc
          </h4>
          <div className="space-y-2">
            {requiredDocs.map((doc) => (
              <DocumentRow
                key={doc.id}
                document={doc}
                onUpload={onUpload}
                onDownload={onDownload}
                onRemove={onRemove}
                onView={onView}
              />
            ))}
          </div>
        </div>

        {/* Optional Documents */}
        {optionalDocs.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              Tài liệu khuyến nghị
            </h4>
            <div className="space-y-2">
              {optionalDocs.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  document={doc}
                  onUpload={onUpload}
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
  onUpload: (docId: string) => void;
  onDownload: (docId: string) => void;
  onRemove: (docId: string) => void;
  onView: (docId: string) => void;
}

const DocumentRow: React.FC<DocumentRowProps> = ({
  document,
  onUpload,
  onDownload,
  onRemove,
  onView,
}) => {
  const statusConfig = DOCUMENT_STATUS_CONFIG[document.status];
  const StatusIcon = STATUS_ICONS[document.status];

  return (
    <div
      className={`flex flex-col md:flex-row md:items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors`}
    >
      <div className={`p-2 rounded-lg ${statusConfig.bgColor} shrink-0 w-fit`}>
        <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{document.name}</p>
          <Badge
            className={`${statusConfig.bgColor} ${statusConfig.color} text-xs shrink-0`}
          >
            {statusConfig.label}
          </Badge>
        </div>
        {document.status !== "missing" && (
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {document.uploadedBy && (
              <span>Tải lên bởi: {document.uploadedBy}</span>
            )}
            {document.validTo && <span>Hết hạn: {document.validTo}</span>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {document.status === "missing" ? (
          <Button size="sm" className="w-full" onClick={() => onUpload(document.id)}>
            <Upload className="w-4 h-4 mr-1" />
            Tải lên
          </Button>
        ) : (
          <>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onView(document.id)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDownload(document.id)}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onRemove(document.id)}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ComplianceDocuments;
