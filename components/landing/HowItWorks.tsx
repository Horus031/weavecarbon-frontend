"use client";
import { motion, useInView } from "motion/react";
import {
  CheckCircle2,
  ClipboardList,
  FileCheck,
  Package,
  Recycle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

const HowItWorks = () => {
  const t = useTranslations("howItWorks");
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  const steps = [
    {
      number: "01",
      icon: <ClipboardList className="w-7 h-7" />,
      titleKey: "step1.title",
      descKey: "step1.desc",
      items: ["step1.item1", "step1.item2", "step1.item3"],
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      number: "02",
      icon: <Package className="w-7 h-7" />,
      titleKey: "step2.title",
      descKey: "step2.desc",
      items: ["step2.item1", "step2.item2", "step2.item3"],
      color: "from-cyan-500 to-blue-600",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/20",
    },
    {
      number: "03",
      icon: <Recycle className="w-7 h-7" />,
      titleKey: "step3.title",
      descKey: "step3.desc",
      items: ["step3.item1", "step3.item2", "step3.item3"],
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
    {
      number: "04",
      icon: <FileCheck className="w-7 h-7" />,
      titleKey: "step4.title",
      descKey: "step4.desc",
      items: ["step4.item1", "step4.item2", "step4.item3"],
      color: "from-teal-500 to-cyan-600",
      bgColor: "bg-teal-500/10",
      borderColor: "border-teal-500/20",
    },
  ];

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="py-12 md:py-16 bg-linear-to-t from-primary via-primary/5 to-background relative overflow-hidden"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Timeline Steps */}
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            {/* Animated vertical line for mobile/tablet */}
            <motion.div
              initial={{ height: 0 }}
              animate={isInView ? { height: "100%" } : { height: 0 }}
              transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
              className="lg:hidden absolute left-8 top-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20"
            />

            {steps.map((step, index) => {
              const isEven = index % 2 === 0;
              
              return (
                <div key={step.number} className="relative">
                  {/* Desktop Layout - Alternating sides */}
                  <div className="hidden lg:block">
                    <div className={`flex items-center gap-12 mb-24 ${isEven ? "" : "flex-row-reverse"}`}>
                      {/* Content Card */}
                      <motion.div
                        initial={{ opacity: 0, x: isEven ? -60 : 60 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: index * 0.15 }}
                        className="flex-1"
                      >
                        <motion.div
                          whileHover={{ scale: 1.02, y: -8 }}
                          transition={{ duration: 0.3 }}
                          className={`relative bg-card/80 backdrop-blur-sm border ${step.borderColor} rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 group`}
                        >
                          {/* Gradient overlay on hover */}
                          <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                          
                          <div className="relative z-10">
                            {/* Number */}
                            <div className="flex items-center justify-between mb-6">
                              <span className="text-7xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary/30 to-primary/10">
                                {step.number}
                              </span>
                              <motion.div
                                whileHover={{ rotate: 360, scale: 1.1 }}
                                transition={{ duration: 0.6 }}
                                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg`}
                              >
                                {step.icon}
                              </motion.div>
                            </div>

                            <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                              {t(step.titleKey)}
                            </h3>
                            <p className="text-muted-foreground mb-6 leading-relaxed">
                              {t(step.descKey)}
                            </p>

                            {/* Checklist */}
                            <ul className="space-y-3">
                              {step.items.map((item, itemIndex) => (
                                <motion.li
                                  key={item}
                                  initial={{ opacity: 0, x: -10 }}
                                  whileInView={{ opacity: 1, x: 0 }}
                                  viewport={{ once: true }}
                                  transition={{ delay: index * 0.15 + itemIndex * 0.1 }}
                                  className="flex items-start gap-3 text-sm text-muted-foreground group/item"
                                >
                                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                                  <span className="group-hover/item:text-foreground transition-colors">
                                    {t(item)}
                                  </span>
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      </motion.div>

                      {/* Center Node */}
                      <div className="relative flex-shrink-0">
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: index * 0.15 + 0.3 }}
                          className="relative"
                        >
                          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-2xl font-bold shadow-2xl ring-8 ring-background`}>
                            {step.number}
                          </div>
                          {/* Pulse effect */}
                          <motion.div
                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                            className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.color} -z-10`}
                          />
                        </motion.div>

                        {/* Connecting line */}
                        {index < steps.length - 1 && (
                          <motion.div
                            initial={{ height: 0 }}
                            whileInView={{ height: "100%" }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: index * 0.15 + 0.5 }}
                            className="absolute left-1/2 top-20 w-1 -translate-x-1/2 bg-gradient-to-b from-primary to-primary/20"
                            style={{ height: "calc(100% + 6rem)" }}
                          />
                        )}
                      </div>

                      {/* Empty space for alternating layout */}
                      <div className="flex-1" />
                    </div>
                  </div>

                  {/* Mobile/Tablet Layout */}
                  <div className="lg:hidden mb-12">
                    <div className="flex gap-6">
                      {/* Timeline node */}
                      <div className="relative flex-shrink-0">
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: index * 0.15 }}
                          className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-lg shadow-xl ring-4 ring-background relative z-10`}
                        >
                          {step.number}
                        </motion.div>
                      </div>

                      {/* Content */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: index * 0.15 }}
                        className="flex-1 pb-8"
                      >
                        <div className={`bg-card/80 backdrop-blur-sm border ${step.borderColor} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300`}>
                          <div className="flex items-center gap-4 mb-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white`}>
                              {step.icon}
                            </div>
                            <h3 className="text-xl font-bold text-foreground flex-1">
                              {t(step.titleKey)}
                            </h3>
                          </div>
                          
                          <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                            {t(step.descKey)}
                          </p>

                          <ul className="space-y-2">
                            {step.items.map((item) => (
                              <li
                                key={item}
                                className="flex items-start gap-2 text-sm text-muted-foreground"
                              >
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <span>{t(item)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
