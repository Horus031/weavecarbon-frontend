"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertTriangle,
  FileText,
  Leaf,
  Shield,
  Package,
  ChevronDown,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { Recommendation, PRIORITY_CONFIG } from "./types";

interface ComplianceRecommendationsProps {
  recommendations: Recommendation[];
  onAction: (action: string, recommendationId: string) => void;
}

const TYPE_ICONS = {
  document: FileText,
  carbon_data: Leaf,
  verification: Shield,
  product_scope: Package,
};

const ComplianceRecommendations: React.FC<ComplianceRecommendationsProps> = ({
  recommendations,
  onAction,
}) => {
  const activeRecommendations = recommendations.filter(
    (r) => r.status === "active",
  );

  if (activeRecommendations.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold text-green-800">Hoàn thiện đầy đủ!</h3>
          <p className="text-sm text-green-600 mt-1">
            Không có khuyến nghị nào cần thực hiện. Hồ sơ đã sẵn sàng xuất khẩu.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-col md:flex-row md:items-center gap-2 text-lg">
          <Badge variant="secondary" className="static md:hidden">
            {activeRecommendations.length} mục
          </Badge>
          <div className="flex gap-2 items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Khuyến nghị hoàn thiện hồ sơ
          </div>
          <Badge variant="secondary" className="ml-auto hidden md:static">
            {activeRecommendations.length} mục
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeRecommendations.map((rec) => {
          const Icon = TYPE_ICONS[rec.type];
          const priorityConfig = PRIORITY_CONFIG[rec.priority];

          return (
            <Collapsible key={rec.id} className="max-w-xs mx-auto">
              <div className="border rounded-lg overflow-hidden">
                <CollapsibleTrigger className="max-w-xs">
                  <div className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors">
                    <div
                      className={`p-2 rounded-lg ${priorityConfig.bgColor} shrink-0`}
                    >
                      <Icon className={`w-4 h-4 ${priorityConfig.color}`} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          className={`${priorityConfig.bgColor} ${priorityConfig.color} text-xs`}
                        >
                          {priorityConfig.label}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm">{rec.missingItem}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="max-w-xs">
                  <div className="px-4 pb-4 pt-0 space-y-4 border-t bg-muted/30">
                    {/* Regulatory Reason */}
                    <div className="pt-4">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Lý do pháp lý
                      </h4>
                      <p className="text-sm">{rec.regulatoryReason}</p>
                    </div>

                    {/* Business Impact */}
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Ảnh hưởng nếu thiếu
                      </h4>
                      <p className="text-sm text-orange-700 bg-orange-50 p-2 rounded">
                        {rec.businessImpact}
                      </p>
                    </div>

                    {/* Recommended Actions */}
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Hướng dẫn thực hiện
                      </h4>
                      <ul className="space-y-1">
                        {rec.recommendedAction.map((action, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Button */}
                    <div className="flex flex-col md:flex-row gap-2 pt-2 h-full">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onAction(rec.ctaAction, rec.id)}
                        className="flex-1 py-2"
                      >
                        {rec.ctaLabel}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAction("view_guide", rec.id)}
                      >
                        Xem hướng dẫn
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default ComplianceRecommendations;
