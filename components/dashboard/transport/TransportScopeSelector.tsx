"use client";

import React from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("transport");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("scopeTitle")}</CardTitle>
        <CardDescription>{t("scopeDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={value}
          onValueChange={(v) => onChange(v as "domestic" | "international")}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="domestic" id="domestic" />
            <Label htmlFor="domestic">{t("scopeDomestic")}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="international" id="international" />
            <Label htmlFor="international">{t("scopeInternational")}</Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

export default TransportScopeSelector;
