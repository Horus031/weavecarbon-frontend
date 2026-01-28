"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface TransportScopeSelectorProps {
  value: "domestic" | "international";
  onChange: (value: "domestic" | "international") => void;
}

const TransportScopeSelector: React.FC<TransportScopeSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Phạm vi vận chuyển</CardTitle>
        <CardDescription>Chọn loại vận chuyển chính</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={value}
          onValueChange={(v) => onChange(v as "domestic" | "international")}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="domestic" id="domestic" />
            <Label htmlFor="domestic">Nội địa Việt Nam</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="international" id="international" />
            <Label htmlFor="international">Quốc tế</Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

export default TransportScopeSelector;
