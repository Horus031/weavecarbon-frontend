// Section G - AI Improvement Suggestions
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  TrendingDown,
  Leaf,
  Truck,
  Factory,
  Package,
  Recycle,
} from "lucide-react";
import { ImprovementSuggestion } from "@/lib/carbonDetailData";

interface ImprovementSuggestionsProps {
  suggestions: ImprovementSuggestion[];
}

const TYPE_ICON = {
  material: Leaf,
  transport: Truck,
  manufacturing: Factory,
  packaging: Package,
  end_of_life: Recycle,
};

const DIFFICULTY_CONFIG = {
  easy: { label: "Dễ", color: "bg-green-100 text-green-700" },
  medium: { label: "Trung bình", color: "bg-yellow-100 text-yellow-700" },
  hard: { label: "Khó", color: "bg-red-100 text-red-700" },
};

const ImprovementSuggestions: React.FC<ImprovementSuggestionsProps> = ({
  suggestions,
}) => {
  if (suggestions.length === 0) {
    return null;
  }

  // Sort by potential reduction descending
  const sortedSuggestions = [...suggestions].sort(
    (a, b) => b.potentialReduction - a.potentialReduction,
  );

  return (
    <Card className="bg-linear-to-br from-amber-50/50 to-transparent border-amber-200/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="w-5 h-5 text-amber-600" />
          Gợi ý cải thiện từ AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedSuggestions.map((suggestion) => {
          const Icon = TYPE_ICON[suggestion.type];
          const difficulty = DIFFICULTY_CONFIG[suggestion.difficulty];

          return (
            <div
              key={suggestion.id}
              className="p-4 rounded-lg bg-white border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium">{suggestion.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {suggestion.description}
                    </p>
                    <Badge className={difficulty.color} variant="secondary">
                      {difficulty.label}
                    </Badge>
                  </div>
                </div>

                {suggestion.potentialReduction > 0 && (
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingDown className="w-4 h-4" />
                      <span className="text-lg font-bold">
                        -{suggestion.potentialReduction}%
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      CO₂e giảm
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <p className="text-xs text-center text-muted-foreground pt-2">
          💡 Đây là gợi ý từ AI dựa trên dữ liệu sản phẩm. Kết quả thực tế có
          thể khác biệt.
        </p>
      </CardContent>
    </Card>
  );
};

export default ImprovementSuggestions;
