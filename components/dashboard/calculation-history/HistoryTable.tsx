"use client";

import React from "react";
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
  isDemo: boolean;
}

interface HistoryTableProps {
  history: HistoryRecord[];
  onProductClick: (productId: string) => void;
}

const HistoryTable: React.FC<HistoryTableProps> = ({
  history,
  onProductClick,
}) => {
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
            <TableHead>Sản phẩm</TableHead>
            <TableHead className="text-right">Vật liệu</TableHead>
            <TableHead className="text-right">Sản xuất</TableHead>
            <TableHead className="text-right">Vận chuyển</TableHead>
            <TableHead className="text-right">Đóng gói</TableHead>
            <TableHead className="text-right">Tổng CO₂</TableHead>
            <TableHead>Phiên bản</TableHead>
            <TableHead>Ngày tạo</TableHead>
            <TableHead>Người tạo</TableHead>
            <TableHead>Loại</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((item) => (
            <TableRow
              key={item.id}
              className={item.isDemo ? "bg-amber-50/50" : ""}
            >
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
              <TableCell>
                <Badge variant={item.isDemo ? "outline" : "default"}>
                  {item.isDemo ? "Demo" : "Thực"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default HistoryTable;
