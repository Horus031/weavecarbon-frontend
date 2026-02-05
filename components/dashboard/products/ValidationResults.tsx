import React from "react";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { ValidationResult } from "./types";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ValidationResultsProps {
  result: ValidationResult;
}

const ValidationResults: React.FC<ValidationResultsProps> = ({ result }) => {
  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {result.validCount}
          </p>
          <p className="text-sm text-green-600 dark:text-green-500">
            Dòng hợp lệ
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">
            {result.errorCount}
          </p>
          <p className="text-sm text-red-600 dark:text-red-500">Dòng lỗi</p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
            {result.warningCount}
          </p>
          <p className="text-sm text-yellow-600 dark:text-yellow-500">
            Cảnh báo
          </p>
        </div>
      </div>

      {/* Error Details */}
      {result.invalidRows.length > 0 && (
        <div className="border border-red-200 dark:border-red-800 rounded-lg">
          <div className="bg-red-50 dark:bg-red-950/50 px-4 py-2 border-b border-red-200 dark:border-red-800">
            <h4 className="font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Chi tiết lỗi ({result.errorCount} dòng)
            </h4>
          </div>
          <ScrollArea className="max-h-60">
            <Accordion type="multiple" className="px-2">
              {result.invalidRows.map((invalid, idx) => (
                <AccordionItem key={idx} value={`error-${idx}`}>
                  <AccordionTrigger className="hover:no-underline py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="destructive" className="text-xs">
                        Dòng {invalid.row}
                      </Badge>
                      <span className="text-muted-foreground">
                        {invalid.data.sku ||
                          invalid.data.productName ||
                          "Dữ liệu không hợp lệ"}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {invalid.errors.length} lỗi
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-1 pl-4">
                      {invalid.errors.map((error, errorIdx) => (
                        <li
                          key={errorIdx}
                          className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2"
                        >
                          <span className="text-red-400">•</span>
                          <span>{error.message}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </div>
      )}

      {/* Warning Details */}
      {result.warnings.length > 0 && (
        <div className="border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="bg-yellow-50 dark:bg-yellow-950/50 px-4 py-2 border-b border-yellow-200 dark:border-yellow-800">
            <h4 className="font-medium text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Cảnh báo ({result.warningCount})
            </h4>
          </div>
          <ScrollArea className="max-h-40">
            <ul className="p-4 space-y-2">
              {result.warnings.map((warning, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs shrink-0 bg-yellow-100 dark:bg-yellow-900/30"
                  >
                    Dòng {warning.row}
                  </Badge>
                  <span className="text-yellow-700 dark:text-yellow-400">
                    {warning.message}
                  </span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}

      {/* Success Message */}
      {result.isValid && result.validCount > 0 && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="font-medium text-green-700 dark:text-green-400">
              Tất cả {result.validCount} dòng dữ liệu hợp lệ và sẵn sàng xử lý!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationResults;
