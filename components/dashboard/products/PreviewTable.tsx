import React from "react";
import { BulkProductRow } from "./types";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Leaf } from "lucide-react";

interface PreviewTableProps {
  rows: BulkProductRow[];
  showCarbonData?: boolean;
}

const CONFIDENCE_COLORS = {
  high: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  medium:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const SCOPE_LABELS = {
  scope1: "Scope 1",
  scope1_2: "Scope 1-2",
  scope1_2_3: "Scope 1-2-3",
};

const CONFIDENCE_LABELS = {
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
};

const PreviewTable: React.FC<PreviewTableProps> = ({
  rows,
  showCarbonData = false,
}) => {
  return (
    <div className="border rounded-lg">
      <ScrollArea className="h-100">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-12.5">#</TableHead>
              <TableHead className="min-w-25">SKU</TableHead>
              <TableHead className="min-w-50">Tên sản phẩm</TableHead>
              <TableHead className="w-20">SL</TableHead>
              <TableHead className="min-w-25">Vải chính</TableHead>
              <TableHead className="w-25">Thị trường</TableHead>
              {showCarbonData && (
                <>
                  <TableHead className="w-25 text-right">CO₂e (kg)</TableHead>
                  <TableHead className="w-25">Scope</TableHead>
                  <TableHead className="w-25">Độ tin cậy</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell className="text-muted-foreground text-sm">
                  {index + 1}
                </TableCell>
                <TableCell className="font-mono text-sm">{row.sku}</TableCell>
                <TableCell
                  className="max-w-50 truncate"
                  title={row.productName}
                >
                  {row.productName}
                </TableCell>
                <TableCell className="text-right">
                  {row.quantity.toLocaleString()}
                </TableCell>
                <TableCell>
                  <span className="capitalize">
                    {row.primaryMaterial.replace("_", " ")}
                  </span>
                  {row.primaryMaterialPercentage < 100 && (
                    <span className="text-muted-foreground text-xs ml-1">
                      ({row.primaryMaterialPercentage}%)
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {row.marketType === "export"
                      ? row.exportCountry?.toUpperCase() || "Xuất khẩu"
                      : "Nội địa"}
                  </Badge>
                </TableCell>
                {showCarbonData && (
                  <>
                    <TableCell className="text-right font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <Leaf className="w-3 h-3 text-primary" />
                        <span>{row.calculatedCO2?.toFixed(3)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {row.scope ? SCOPE_LABELS[row.scope] : "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.confidenceLevel && (
                        <Badge
                          className={`text-xs ${CONFIDENCE_COLORS[row.confidenceLevel]}`}
                        >
                          {CONFIDENCE_LABELS[row.confidenceLevel]}
                        </Badge>
                      )}
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Summary Footer */}
      <div className="border-t bg-muted/50 px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Tổng cộng: <strong>{rows.length}</strong> sản phẩm
          </span>
          {showCarbonData && (
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                Tổng SL:{" "}
                <strong>
                  {rows
                    .reduce((sum, r) => sum + r.quantity, 0)
                    .toLocaleString()}
                </strong>
              </span>
              <span className="text-primary font-medium flex items-center gap-1">
                <Leaf className="w-4 h-4" />
                Tổng CO₂e:{" "}
                {rows
                  .reduce(
                    (sum, r) => sum + (r.calculatedCO2 || 0) * r.quantity,
                    0,
                  )
                  .toFixed(2)}{" "}
                kg
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewTable;
