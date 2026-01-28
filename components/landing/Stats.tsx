"use client";

import { TrendingUp } from "lucide-react";

const Stats = () => {
  const stats = [
    {
      value: "50K+",
      labelKey: "stats.co2Tracked",
      description: "Carbon footprints calculated monthly",
    },
    {
      value: "2.5M",
      labelKey: "kg CO₂e",
      description: "Total emissions documented",
    },
    {
      value: "180K",
      labelKey: "stats.recycled",
      description: "Through Circular Hub network",
    },
    {
      value: "98%",
      labelKey: "stats.exports",
      description: "Compliance success rate",
    },
  ];

  const getLabel = (key: string) => {
    const translated = key;
    return translated !== key ? translated : key;
  };

  return (
    <section
      id="impact"
      className="py-24 md:py-32 bg-gradient-forest text-primary-foreground relative overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full border border-primary-foreground/30" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full border border-primary-foreground/20" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-foreground/10 text-primary-foreground text-sm font-medium mb-4">
            <TrendingUp className="w-4 h-4" />
            Impact
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
            Making Real Impact
          </h2>
          <p className="text-lg text-primary-foreground/80">
            Measurable progress towards a sustainable fashion industry
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat) => (
            <div
              key={stat.labelKey}
              className="text-center p-8 rounded-2xl bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10 hover:bg-primary-foreground/10 transition-colors"
            >
              <div className="text-4xl md:text-5xl font-display font-bold mb-2">
                {stat.value}
              </div>
              <div className="font-semibold mb-1">
                {getLabel(stat.labelKey)}
              </div>
              <div className="text-sm text-primary-foreground/70">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
