import React from "react";
import { useTranslations } from "next-intl";

const PlanInfo = () => {
  const t = useTranslations("onboarding");

  return (
    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-foreground">{t("starterPlan")}</p>
          <p className="text-sm text-muted-foreground">{t("starterPlanDesc")}</p>
        </div>
        <span className="text-lg font-bold text-primary">{t("starterPlanPriceRange")}</span>
      </div>
    </div>
  );
};

export default PlanInfo;
