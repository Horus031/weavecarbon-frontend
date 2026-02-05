"use client";
import { motion } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileCheck,
  Package,
  Recycle,
} from "lucide-react";
import { useTranslations } from "next-intl";

const HowItWorks = () => {
  const t = useTranslations("howItWorks");

  const steps = [
    {
      number: "01",
      icon: <ClipboardList className="w-8 h-8" />,
      titleKey: "step1.title",
      descKey: "step1.desc",
      items: ["step1.item1", "step1.item2", "step1.item3"],
    },
    {
      number: "02",
      icon: <Package className="w-8 h-8" />,
      titleKey: "step2.title",
      descKey: "step2.desc",
      items: ["step2.item1", "step2.item2", "step2.item3"],
    },
    {
      number: "03",
      icon: <Recycle className="w-8 h-8" />,
      titleKey: "step3.title",
      descKey: "step3.desc",
      items: ["step3.item1", "step3.item2", "step3.item3"],
    },
    {
      number: "04",
      icon: <FileCheck className="w-8 h-8" />,
      titleKey: "step4.title",
      descKey: "step4.desc",
      items: ["step4.item1", "step4.item2", "step4.item3"],
    },
  ];

  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            {t("badge")}
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6">
            {t("title")}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.08 }}
                whileHover={{ y: -4 }}
                className="relative"
              >
                {/* Step card */}
                <div className="bg-card border border-border rounded-2xl p-8 hover:border-primary/30 hover:shadow-lg transition-all duration-300 h-full">
                  {/* Number badge */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-forest flex items-center justify-center text-primary-foreground relative z-10">
                      {step.icon}
                    </div>
                    <span className="text-5xl font-display font-bold text-primary/50">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {t(step.titleKey)}
                  </h3>
                  <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                    {t(step.descKey)}
                  </p>

                  {/* Checklist */}
                  <ul className="space-y-2">
                    {step.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        {t(item)}
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
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
