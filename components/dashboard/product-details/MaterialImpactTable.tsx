
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger } from
"@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from
"@/components/ui/table";
import { Leaf, Info, FileCheck, FileQuestion } from "lucide-react";
import { MaterialImpactItem } from "@/lib/carbonDetailData";

interface MaterialImpactTableProps {
  materials: MaterialImpactItem[];
}

const MaterialImpactTable: React.FC<MaterialImpactTableProps> = ({
  materials
}) => {
  const t = useTranslations("productDetail.materialImpact");
  const totalCo2e = materials.reduce((sum, m) => sum + m.co2e, 0);

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-200 bg-slate-50/70">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Leaf className="w-5 h-5 text-primary" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <Table className="w-full">
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-slate-200">
                <TableHead className="font-semibold text-slate-700">{t("material")}</TableHead>
                <TableHead className="text-center font-semibold text-slate-700">{t("ratio")}</TableHead>
                <TableHead className="text-center font-semibold text-slate-700">
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
              <TableHead className="text-center font-semibold text-slate-700">CO₂e (kg)</TableHead>
              <TableHead className="text-center font-semibold text-slate-700">{t("source")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((material, index) =>
              <TableRow key={index} className="border-slate-200 hover:bg-slate-50/70">
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
                  {material.source === "documented" ?
                  <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                      <FileCheck className="w-3 h-3 mr-1" />
                      {t("verified")}
                    </Badge> :

                  <Badge
                    variant="outline"
                    className="border-amber-200 bg-amber-50 text-amber-700">
                    
                      <FileQuestion className="w-3 h-3 mr-1" />
                      {t("proxy")}
                    </Badge>
                  }
                </TableCell>
              </TableRow>
              )}
            
            <TableRow className="bg-slate-50/80 border-slate-200 font-bold">
              <TableCell>{t("total")}</TableCell>
              <TableCell className="text-center">100%</TableCell>
              <TableCell className="text-center">-</TableCell>
              <TableCell className="text-center text-emerald-700">
                {totalCo2e.toFixed(2)}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-start gap-2 text-xs text-slate-600">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{t("factorNote")}</span>
        </div>
      </CardContent>
    </Card>);

};

export default MaterialImpactTable;