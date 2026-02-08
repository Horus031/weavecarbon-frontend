// Section D - Material Impact Table
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Leaf, Info, FileCheck, FileQuestion } from "lucide-react";
import { MaterialImpactItem } from "@/lib/carbonDetailData";

interface MaterialImpactTableProps {
  materials: MaterialImpactItem[];
}

const MaterialImpactTable: React.FC<MaterialImpactTableProps> = ({
  materials,
}) => {
  const t = useTranslations("productDetail.materialImpact");
  const totalCo2e = materials.reduce((sum, m) => sum + m.co2e, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Leaf className="w-5 h-5 text-primary" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("material")}</TableHead>
              <TableHead className="text-center">{t("ratio")}</TableHead>
              <TableHead className="text-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1 justify-center">
                      {t("emissionFactor")} <Info className="w-3 h-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("emissionFactorTooltip")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead className="text-center">CO₂e (kg)</TableHead>
              <TableHead className="text-center">{t("source")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((material, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {material.material}
                </TableCell>
                <TableCell className="text-center">
                  {material.percentage}%
                </TableCell>
                <TableCell className="text-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="font-mono text-sm">
                          {material.emissionFactor.toFixed(2)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {t("sourceLabel")}{material.factorSource}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-center font-bold">
                  {material.co2e.toFixed(2)}
                </TableCell>
                <TableCell className="text-center">
                  {material.source === "documented" ? (
                    <Badge className="bg-green-100 text-green-700">
                      <FileCheck className="w-3 h-3 mr-1" />
                      {t("verified")}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-yellow-600 border-yellow-300"
                    >
                      <FileQuestion className="w-3 h-3 mr-1" />
                      {t("proxy")}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {/* Total Row */}
            <TableRow className="bg-muted/50 font-bold">
              <TableCell>{t("total")}</TableCell>
              <TableCell className="text-center">100%</TableCell>
              <TableCell className="text-center">-</TableCell>
              <TableCell className="text-center text-primary">
                {totalCo2e.toFixed(2)}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div className="mt-4 text-xs text-muted-foreground flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{t("factorNote")}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaterialImpactTable;
