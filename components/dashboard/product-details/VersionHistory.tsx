
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  History,
  Eye,
  GitCompare,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  User,
  Clock } from
"lucide-react";
import { VersionHistoryItem } from "@/lib/carbonDetailData";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger } from
"@/components/ui/collapsible";

interface VersionHistoryProps {
  versions: VersionHistoryItem[];
  currentVersion?: string;
  onView?: (version: string) => void;
  onCompare?: (v1: string, v2: string) => void;
  onRestore?: (version: string) => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({
  versions,
  currentVersion,
  onView,
  onCompare,
  onRestore
}) => {
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<string | null>(
    null
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleCompareClick = (version: string) => {
    if (selectedForCompare === null) {
      setSelectedForCompare(version);
    } else if (selectedForCompare !== version) {
      onCompare?.(selectedForCompare, version);
      setSelectedForCompare(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="w-5 h-5 text-primary" />
          Lịch sử phiên bản
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {versions.length === 0 ?
        <p className="text-sm text-muted-foreground text-center py-4">
            Chưa có lịch sử phiên bản
          </p> :

        <>
            {versions.map((version, index) => {
            const isLatest = index === 0;
            const isCurrent = version.version === currentVersion;

            return (
              <Collapsible
                key={version.version}
                open={expandedVersion === version.version}
                onOpenChange={() =>
                setExpandedVersion(
                  expandedVersion === version.version ?
                  null :
                  version.version
                )
                }>
                
                  <div
                  className={`border rounded-lg ${isCurrent ? "border-primary bg-primary/5" : ""}`}>
                  
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium">
                                {version.version}
                              </span>
                              {isLatest &&
                            <Badge variant="secondary" className="text-xs">
                                  Mới nhất
                                </Badge>
                            }
                              {isCurrent &&
                            <Badge className="text-xs bg-primary/20 text-primary">
                                  Hiện tại
                                </Badge>
                            }
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(version.timestamp)}</span>
                              <User className="w-3 h-3 ml-2" />
                              <span>{version.updatedBy}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {expandedVersion === version.version ?
                        <ChevronUp className="w-4 h-4" /> :

                        <ChevronDown className="w-4 h-4" />
                        }
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-3 pb-3 space-y-3">
                        
                        <p className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
                          {version.note}
                        </p>

                        
                        {version.changes && version.changes.length > 0 &&
                      <div className="text-sm">
                            <span className="font-medium">Thay đổi:</span>
                            <ul className="list-disc list-inside text-muted-foreground mt-1">
                              {version.changes.map((change, i) =>
                          <li key={i}>{change}</li>
                          )}
                            </ul>
                          </div>
                      }

                        
                        <div className="flex gap-2 pt-2">
                          <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onView?.(version.version)}
                          disabled={!onView}>
                          
                            <Eye className="w-3 h-3 mr-1" />
                            Xem
                          </Button>
                          <Button
                          variant={
                          selectedForCompare === version.version ?
                          "default" :
                          "outline"
                          }
                          size="sm"
                          onClick={() => handleCompareClick(version.version)}
                          disabled={!onCompare}>
                          
                            <GitCompare className="w-3 h-3 mr-1" />
                            {selectedForCompare === version.version ?
                          "Chọn để so sánh" :
                          "So sánh"}
                          </Button>
                          {!isLatest &&
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRestore?.(version.version)}
                          disabled={!onRestore}>
                          
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Khôi phục
                            </Button>
                        }
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>);

          })}

            {selectedForCompare &&
          <p className="text-xs text-center text-primary">
                Chọn một phiên bản khác để so sánh với {selectedForCompare}
              </p>
          }
          </>
        }
      </CardContent>
    </Card>);

};

export default VersionHistory;