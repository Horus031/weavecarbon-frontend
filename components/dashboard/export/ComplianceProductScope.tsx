"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Plus, Trash2, Edit, AlertCircle } from "lucide-react";
import { ProductScopeItem } from "./types";

interface ComplianceProductScopeProps {
  products: ProductScopeItem[];
  marketName: string;
  onAddProduct: () => void;
  onEditProduct: (productId: string) => void;
  onRemoveProduct: (productId: string) => void;
}

const ComplianceProductScope: React.FC<ComplianceProductScopeProps> = ({
  products,
  marketName,
  onAddProduct,
  onEditProduct,
  onRemoveProduct,
}) => {
  const totalVolume = products.reduce((sum, p) => sum + p.exportVolume, 0);

  if (products.length === 0) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-yellow-100">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800">
                Chưa xác định sản phẩm xuất khẩu
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Vui lòng thêm sản phẩm xuất khẩu sang {marketName} để tiếp tục
                đánh giá tuân thủ.
              </p>
              <Button className="mt-4" size="sm" onClick={onAddProduct}>
                <Plus className="w-4 h-4 mr-1" />
                Thêm sản phẩm
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="w-5 h-5 text-primary" />
            Sản phẩm xuất khẩu
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{products.length} sản phẩm</Badge>
            <Button size="sm" variant="outline" onClick={onAddProduct}>
              <Plus className="w-4 h-4 mr-1" />
              Thêm
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Mã SP</TableHead>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>Mã HS</TableHead>
                <TableHead>Nơi sản xuất</TableHead>
                <TableHead className="text-right">SL xuất khẩu</TableHead>
                <TableHead className="w-25"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.productId}>
                  <TableCell className="font-mono text-xs">
                    {product.productId}
                  </TableCell>
                  <TableCell className="font-medium">
                    {product.productName}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {product.hsCode}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {product.productionSite}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {product.exportVolume.toLocaleString()} {product.unit}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onEditProduct(product.productId)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onRemoveProduct(product.productId)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between mt-4 p-3 rounded-lg bg-muted/50">
          <span className="text-sm text-muted-foreground">
            Tổng sản lượng xuất khẩu
          </span>
          <span className="text-lg font-bold">
            {totalVolume.toLocaleString()} units
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplianceProductScope;
