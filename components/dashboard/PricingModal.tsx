import React from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Sparkles, Zap, Crown, MessageCircle } from "lucide-react";

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
  onSelectPlan?: (plan: string) => void;
}

type PlanId = "starter" | "standard" | "export";

const pricingPlans: Array<{
  id: PlanId;
  icon: typeof Zap;
  color: string;
  popular: boolean;
  contact?: boolean;
  featureKeys: string[];
}> = [
  {
    id: "starter",
    icon: Zap,
    color: "bg-blue-500",
    popular: false,
    featureKeys: [
      "basicSku",
      "simpleProxy",
      "domesticTransport",
      "pdfReport",
      "detailedBreakdown",
      "exportReadiness"
    ]
  },
  {
    id: "standard",
    icon: Sparkles,
    color: "bg-primary",
    popular: true,
    featureKeys: [
      "basicSku",
      "simpleProxy",
      "domesticTransport",
      "detailedBreakdown",
      "exportTransport",
      "exportReadiness"
    ]
  },
  {
    id: "export",
    icon: Crown,
    color: "bg-amber-500",
    popular: false,
    contact: true,
    featureKeys: [
      "allStandard",
      "usEuCompliance",
      "circularCredit",
      "advancedAudit",
      "erpApi",
      "dedicatedManager"
    ]
  }
];

const includedFeaturesByPlan: Record<PlanId, Set<string>> = {
  starter: new Set(["basicSku", "simpleProxy", "domesticTransport"]),
  standard: new Set([
    "basicSku",
    "simpleProxy",
    "domesticTransport",
    "detailedBreakdown",
    "exportTransport",
    "exportReadiness"
  ]),
  export: new Set([
    "allStandard",
    "usEuCompliance",
    "circularCredit",
    "advancedAudit",
    "erpApi",
    "dedicatedManager"
  ])
};

const PricingModal: React.FC<PricingModalProps> = ({
  open,
  onClose,
  onSelectPlan
}) => {
  const t = useTranslations("pricingModal");

  const handleSelectPlan = (planId: string) => {
    if (onSelectPlan) {
      onSelectPlan(planId);
    }

    localStorage.setItem("weavecarbon_pricing_seen", "true");
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem("weavecarbon_pricing_seen", "true");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleSkip()}>
      <DialogContent className="max-w-4xl! max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold">{t("title")}</DialogTitle>
          <DialogDescription className="text-base">{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4 mt-4">
          {pricingPlans.map((plan) => {
            const Icon = plan.icon;

            return (
              <Card
                key={plan.id}
                className={`relative transition-all hover:shadow-lg ${
                  plan.popular ? "ring-2 ring-primary shadow-md" : ""
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    {t("popularBadge")}
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <div
                    className={`mx-auto w-12 h-12 rounded-full ${plan.color} flex items-center justify-center mb-3`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">
                    {t(`plans.${plan.id}.name`)}
                    <span className="block text-sm font-normal text-muted-foreground">
                      {t(`plans.${plan.id}.description`)}
                    </span>
                  </CardTitle>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">{t(`plans.${plan.id}.price`)}</span>
                    <span className="text-sm text-muted-foreground block">{t("currencyPerMonth")}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.featureKeys.map((featureKey) => {
                      const included = includedFeaturesByPlan[plan.id].has(featureKey);

                      return (
                        <li key={`${plan.id}-${featureKey}`} className="flex items-start gap-2 text-sm">
                          {included ? (
                            <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          )}
                          <span className={included ? "" : "text-muted-foreground"}>
                            {t(`features.${featureKey}`)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {plan.contact ? (
                    <Button variant="outline" className="w-full" onClick={() => handleSelectPlan(plan.id)}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {t("contact")}
                    </Button>
                  ) : (
                    <Button
                      variant={plan.popular ? "default" : "outline"}
                      className="w-full"
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      {t("selectPlan")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center mt-6">
          <Button variant="ghost" onClick={handleSkip}>
            {t("skip")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PricingModal;
