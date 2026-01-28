import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

const pricingPlans = [
  {
    id: "starter",
    name: "Starter",
    nameVi: "Khởi động",
    price: "149k - 299k",
    currency: "VNĐ/tháng",
    icon: Zap,
    color: "bg-blue-500",
    popular: false,
    features: [
      { text: "Nhập SKU cơ bản", included: true },
      { text: "Carbon proxy đơn giản", included: true },
      { text: "Vận chuyển nội địa", included: true },
      { text: "Xuất PDF báo cáo", included: false },
      { text: "Breakdown CO₂ chi tiết", included: false },
      { text: "Export readiness score", included: false },
    ],
  },
  {
    id: "standard",
    name: "Standard",
    nameVi: "Tiêu chuẩn",
    price: "599k - 1.2M",
    currency: "VNĐ/tháng",
    icon: Sparkles,
    color: "bg-primary",
    popular: true,
    features: [
      { text: "Nhập SKU cơ bản", included: true },
      { text: "Carbon proxy đơn giản", included: true },
      { text: "Vận chuyển nội địa", included: true },
      { text: "Breakdown CO₂ chi tiết", included: true },
      { text: "Vận chuyển xuất khẩu", included: true },
      { text: "Export readiness score", included: true },
    ],
  },
  {
    id: "export",
    name: "Export",
    nameVi: "Xuất khẩu",
    price: "3M - 6M",
    currency: "VNĐ/tháng",
    icon: Crown,
    color: "bg-amber-500",
    popular: false,
    contact: true,
    features: [
      { text: "Tất cả tính năng Standard", included: true },
      { text: "Báo cáo US/EU compliance", included: true },
      { text: "Circular credit tracking", included: true },
      { text: "Hỗ trợ audit chuyên sâu", included: true },
      { text: "API tích hợp ERP", included: true },
      { text: "Dedicated account manager", included: true },
    ],
  },
];

const PricingModal: React.FC<PricingModalProps> = ({
  open,
  onClose,
  onSelectPlan,
}) => {
  const handleSelectPlan = (planId: string) => {
    if (onSelectPlan) {
      onSelectPlan(planId);
    }
    // Mark as seen in localStorage
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
          <DialogTitle className="text-2xl font-bold">
            Chọn gói phù hợp với doanh nghiệp của bạn
          </DialogTitle>
          <DialogDescription className="text-base">
            Bắt đầu theo dõi carbon footprint và chuẩn bị cho xuất khẩu bền vững
          </DialogDescription>
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
                    Phổ biến nhất
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <div
                    className={`mx-auto w-12 h-12 rounded-full ${plan.color} flex items-center justify-center mb-3`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">
                    {plan.name}
                    <span className="block text-sm font-normal text-muted-foreground">
                      {plan.nameVi}
                    </span>
                  </CardTitle>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground block">
                      {plan.currency}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        )}
                        <span
                          className={
                            feature.included ? "" : "text-muted-foreground"
                          }
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {plan.contact ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Liên hệ
                    </Button>
                  ) : (
                    <Button
                      variant={plan.popular ? "default" : "outline"}
                      className="w-full"
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      Chọn gói này
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center mt-6">
          <Button variant="ghost" onClick={handleSkip}>
            Bỏ qua, khám phá trước
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PricingModal;
