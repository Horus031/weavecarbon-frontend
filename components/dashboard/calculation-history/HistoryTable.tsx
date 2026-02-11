"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface HistoryRecord {
  id: string;
  productId: string;
  productName: string;
  materialsCO2: number;
  manufacturingCO2: number;
  transportCO2: number;
  packagingCO2: number;
  totalCO2: number;
  carbonVersion: string;
  createdAt: string;
  createdBy: string;
}

interface HistoryTableProps {
  history: HistoryRecord[];
  onProductClick: (productId: string) => void;
}

const HistoryTable: React.FC<HistoryTableProps> = ({
  history,
  onProductClick,
}) => {
  const t = useTranslations("calculationHistory");
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columnProduct")}</TableHead>
            <TableHead className="text-right">{t("columnMaterials")}</TableHead>
            <TableHead className="text-right">{t("columnManufacturing")}</TableHead>
            <TableHead className="text-right">{t("columnTransport")}</TableHead>
            <TableHead className="text-right">{t("columnPackaging")}</TableHead>
            <TableHead className="text-right">{t("columnTotalCO2")}</TableHead>
            <TableHead>{t("columnVersion")}</TableHead>
            <TableHead>{t("columnCreatedDate")}</TableHead>
            <TableHead>{t("columnCreatedBy")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                <button
                  onClick={() => onProductClick(item.productId)}
                  className="hover:text-primary hover:underline text-left"
                >
                  {item.productName}
                </button>
              </TableCell>
              <TableCell className="text-right">
                {item.materialsCO2.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                {item.manufacturingCO2.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                {item.transportCO2.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                {item.packagingCO2.toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-bold text-primary">
                {item.totalCO2.toFixed(2)}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {item.carbonVersion}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(item.createdAt)}
              </TableCell>
              <TableCell className="text-sm truncate max-w-37.5">
                {item.createdBy}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default HistoryTable;
