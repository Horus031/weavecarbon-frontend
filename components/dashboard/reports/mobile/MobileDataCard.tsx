"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileDataCardProps {

  title: string;

  subtitle?: string;

  metrics?: Array<{
    label?: string;
    value: string | number;
    unit?: string;
    className?: string;
  }>;

  tags?: string[];

  icon?: React.ReactNode;

  onClick?: () => void;

  actions?: React.ReactNode;

  className?: string;

  showChevron?: boolean;
}

const MobileDataCard: React.FC<MobileDataCardProps> = ({
  title,
  subtitle,
  metrics,
  tags,
  icon,
  onClick,
  actions,
  className,
  showChevron = true
}) => {
  return (
    <Card
      className={cn(
        "border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-md",
        onClick && "cursor-pointer active:scale-[0.99]",
        className
      )}
      onClick={onClick}>

      <CardContent className="p-4">
        
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {icon &&
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                {icon}
              </div>
            }
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-sm font-medium text-slate-900">{title}</h3>
              {subtitle &&
              <p className="mt-0.5 truncate text-xs text-slate-600">
                  {subtitle}
                </p>
              }
            </div>
          </div>
        </div>

        
        {tags && tags.length > 0 &&
        <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((tag, i) =>
          <Badge
            key={i}
            variant="outline"
            className="border-slate-200 bg-white text-xs text-slate-700">

                {tag}
              </Badge>
          )}
            {tags.length > 3 &&
          <Badge
            variant="outline"
            className="border-slate-200 bg-white text-xs text-slate-700">

                +{tags.length - 3}
              </Badge>
          }
          </div>
        }

        
        {metrics && metrics.length > 0 &&
        <div className="flex items-center gap-4 flex-wrap">
            {metrics.map((metric, i) =>
          <div key={i} className="flex items-baseline gap-1">
                <span className={cn("font-semibold text-sm", metric.className)}>
                  {metric.value}
                </span>
                {metric.unit &&
            <span className="text-xs text-slate-600">
                    {metric.unit}
                  </span>
            }
                {metric.label &&
            <span className="text-xs text-slate-600">
                    {metric.label}
                  </span>
            }
              </div>
          )}
          </div>
        }

        
        {(actions || showChevron) &&
        <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
            <div className="flex items-center gap-2">{actions}</div>
            {showChevron && onClick &&
          <Button variant="ghost" size="sm" className="h-8 px-2">
                <span className="mr-1 text-xs text-slate-600">Xem</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
          }
          </div>
        }
      </CardContent>
    </Card>);

};

export default MobileDataCard;
