"use client";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileCheck,
  Package,
  Recycle,
} from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      icon: <ClipboardList className="w-8 h-8" />,
      titleKey: "Connect Your Data",
      descKey: "Import your product SKUs and supply chain information",
      items: ["Multi-role support", "Team collaboration", "API integrations"],
    },
    {
      number: "02",
      icon: <Package className="w-8 h-8" />,
      titleKey: "Calculate Emissions",
      descKey: "Our engine computes accurate CO₂e using industry factors",
      items: ["Material library", "Transport mapping", "Batch upload"],
    },
    {
      number: "03",
      icon: <Recycle className="w-8 h-8" />,
      titleKey: "Track & Reduce",
      descKey: "Monitor your progress and identify reduction opportunities",
      items: ["AI sorting", "NGO matching", "Impact tracking"],
    },
    {
      number: "04",
      icon: <FileCheck className="w-8 h-8" />,
      titleKey: "Report & Export",
      descKey: "Generate compliant reports for international markets",
      items: ["EU DPP ready", "Carbon certificates", "Audit trails"],
    },
  ];

  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent-foreground text-sm font-medium mb-4">
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Get started in minutes with our simple four-step process
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Step card */}
                <div className="bg-card border border-border rounded-2xl p-8 hover:border-primary/30 hover:shadow-lg transition-all duration-300 h-full">
                  {/* Number badge */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-forest flex items-center justify-center text-primary-foreground relative z-10">
                      {step.icon}
                    </div>
                    <span className="text-5xl font-display font-bold text-muted/50">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {step.titleKey}
                  </h3>
                  <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                    {step.descKey}
                  </p>

                  {/* Checklist */}
                  <ul className="space-y-2">
                    {step.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Arrow connector for larger screens */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20">
                    <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
