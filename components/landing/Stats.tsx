"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import StatsWave from "@/components/icons/StatsWave";

const Stats = () => {
  const t = useTranslations("stats");
  const stats = [
  {
    value: "50K+",
    labelKey: "co2Tracked.title",
    description: "co2Tracked.description"
  },
  {
    value: "2.5M",
    labelKey: "carbon.title",
    description: "carbon.description"
  },
  {
    value: "180K",
    labelKey: "recycled.title",
    description: "recycled.description"
  },
  {
    value: "98%",
    labelKey: "exports.title",
    description: "exports.description"
  }];


  return (
    <section
      id="impact"
      className="pt-14 pb-24 md:pt-16 md:pb-32 relative bg-linear-to-b from-primary to-forest-dark text-primary-foreground overflow-hidden">

      
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full border border-primary-foreground/30" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full border border-primary-foreground/20" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
          {stats.map((stat, index) =>
          <motion.div
            key={stat.labelKey}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
              delay: index * 0.08
            }}
            whileHover={{ y: -4 }}
            className="text-center h-full min-h-[220px] rounded-2xl px-6 py-8 md:px-8 md:py-10 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/15 hover:bg-primary-foreground/15 transition-colors flex flex-col items-center">

              <div className="text-4xl md:text-5xl font-display font-bold mb-3 leading-none">
                {stat.value}
              </div>
              <div className="font-semibold mb-3 leading-tight">
                {t(stat.labelKey)}
              </div>
              <div className="text-sm text-primary-foreground/80 leading-relaxed max-w-[24ch]">
                {t(stat.description)}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="absolute -bottom-[28rem] md:-bottom-[30rem] left-0 right-0 z-0 pointer-events-none">
        <StatsWave />
      </div>
    </section>);

};

export default Stats;