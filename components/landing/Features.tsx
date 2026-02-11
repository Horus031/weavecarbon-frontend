/* eslint-disable react-hooks/purity */
"use client";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart3,
  Globe,
  Leaf,
  Package,
  PieChart,
  Recycle,
  Scale,
  TrendingUp,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

const Features = () => {
  const t = useTranslations("features");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const features = [
    {
      icon: <Scale className="w-6 h-6" />,
      titleKey: "carbonProxy.title",
      descKey: "carbonProxy.desc",
      color: "from-emerald-500 to-teal-600",
      position: { x: 150, y: 120 },
    },
    {
      icon: <Package className="w-6 h-6" />,
      titleKey: "materialDb.title",
      descKey: "materialDb.desc",
      color: "from-green-500 to-emerald-600",
      position: { x: 380, y: 80 },
    },
    {
      icon: <Globe className="w-6 h-6" />,
      titleKey: "transportCalc.title",
      descKey: "transportCalc.desc",
      color: "from-teal-500 to-cyan-600",
      position: { x: 650, y: 140 },
    },
    {
      icon: <Recycle className="w-6 h-6" />,
      titleKey: "circularHub.title",
      descKey: "circularHub.desc",
      color: "from-emerald-600 to-green-700",
      position: { x: 900, y: 100 },
    },
    {
      icon: <Users className="w-6 h-6" />,
      titleKey: "ngoPartner.title",
      descKey: "ngoPartner.desc",
      color: "from-green-600 to-emerald-700",
      position: { x: 200, y: 350 },
    },
    {
      icon: <Leaf className="w-6 h-6" />,
      titleKey: "carbonCredits.title",
      descKey: "carbonCredits.desc",
      color: "from-lime-500 to-green-600",
      position: { x: 500, y: 380 },
    },
    {
      icon: <PieChart className="w-6 h-6" />,
      titleKey: "exportReady.title",
      descKey: "exportReady.desc",
      color: "from-teal-600 to-emerald-700",
      position: { x: 820, y: 340 },
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      titleKey: "recommendations.title",
      descKey: "recommendations.desc",
      color: "from-emerald-500 to-green-600",
      position: { x: 280, y: 620 },
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      titleKey: "esgReports.title",
      descKey: "esgReports.desc",
      color: "from-green-500 to-teal-600",
      position: { x: 700, y: 600 },
    },
  ];

  return (
    <section
      id="features"
      className="relative z-30 pt-6 pb-10 md:pt-12 md:pb-14 bg-linear-to-b from-muted/30 to-background overflow-hidden"
    >
      <div className="container mx-auto px-6">
        {/* Interactive circular constellation */}
        <div className="relative max-w-5xl mx-auto h-225 flex items-center justify-center">
          {/* Circular path SVG */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient
                id="circle-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity="0.3"
                />
                <stop
                  offset="50%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity="0.6"
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity="0.3"
                />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Main circle */}
            <motion.circle
              cx="50%"
              cy="50%"
              r="340"
              stroke="url(#circle-gradient)"
              strokeWidth="2"
              fill="none"
              filter="url(#glow)"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 2,
                ease: "easeInOut",
              }}
            />

            {/* Hidden path for animation */}
            <path
              id="circle-path"
              d="M 50%,50% m -340,0 a 340,340 0 1,0 680,0 a 340,340 0 1,0 -680,0"
              fill="none"
            />
          </svg>

          {/* Feature icons positioned around the circle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="relative z-10 max-w-2xl text-center px-8"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              {t("badge")}
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6">
              {t("title")}
            </h2>
            <p className="text-lg text-muted-foreground">{t("subtitle")}</p>
          </motion.div>

          {features.map((feature, index) => {
            const angle = (index / features.length) * 2 * Math.PI - Math.PI / 2; // Start from top
            const radius = 340; // Match the SVG circle radius
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <motion.div
                key={feature.titleKey}
                className="absolute"
                style={{
                  left: `calc(47.5% + ${x}px)`,
                  top: `calc(47% + ${y}px)`,
                  transform: "translate(-50%, -50%)",
                }}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: 0.5 + index * 0.1,
                  ease: "backOut",
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Pulsing glow ring */}
                <motion.div
                  className={`absolute inset-0 w-20 h-20 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full bg-linear-to-br ${feature.color} opacity-30 blur-xl`}
                  animate={{
                    scale: hoveredIndex === index ? [1, 1.5, 1] : 1,
                    opacity: hoveredIndex === index ? [0.3, 0.7, 0.3] : 0.2,
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {/* Icon container */}
                <motion.div
                  className={`relative z-10 w-16 h-16 rounded-2xl bg-linear-to-br ${feature.color} flex items-center justify-center text-white shadow-lg cursor-pointer`}
                  whileHover={{ scale: 1.2, rotate: 8 }}
                  whileTap={{ scale: 0.9 }}
                  animate={{
                    y: hoveredIndex === index ? -6 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {feature.icon}
                </motion.div>

                {/* Hover card - positioned intelligently based on angle */}
                <AnimatePresence>
                  {hoveredIndex === index && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="absolute z-50 w-80"
                      style={{
                        // Position card away from center based on angle
                        left:
                          Math.cos(angle) > 0 ? "calc(100% + 20px)" : "auto",
                        right:
                          Math.cos(angle) <= 0 ? "calc(100% + 20px)" : "auto",
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    >
                      <motion.div
                        className="relative p-6 rounded-2xl bg-card/95 backdrop-blur-md border border-primary/20 shadow-2xl"
                        whileHover={{ scale: 1.02 }}
                      >
                        {/* Gradient accent bar */}
                        <div
                          className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${feature.color} rounded-t-2xl`}
                        />

                        <h3 className="text-xl font-bold text-foreground mb-3 mt-2">
                          {t(feature.titleKey)}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {t(feature.descKey)}
                        </p>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

        </div>
      </div>
    </section>
  );
};

export default Features;
