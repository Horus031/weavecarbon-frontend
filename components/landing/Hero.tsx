"use client";

import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { ArrowRight, BarChart3, Recycle, Shield } from "lucide-react";
import { useState } from "react";
import UserTypeDialog from "./UserTypeDialog";
import Link from "next/link";
import { useTranslations } from "next-intl";

const Hero = () => {
  const [showUserTypeDialog, setShowUserTypeDialog] = useState(false);
  const t = useTranslations("hero");
  const tFeatures = useTranslations("features");

  return (
    <section className="relative h-fit flex items-center justify-center pt-32 pb-20 overflow-hidden bg-gradient-hero">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-soft delay-500" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8"
          >
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">
              {t("badge")}
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
            className="text-4xl md:text-5xl lg:text-7xl font-bold text-foreground mb-6"
          >
            {t("title")}{" "}
            <span className="text-gradient-forest">{t("titleHighlight")}</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            {t("subtitle")}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Button
              variant="hero"
              size="xl"
              className="w-full sm:w-auto"
              onClick={() => setShowUserTypeDialog(true)}
            >
              {t("cta.demo")}
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Link href="/calculator">
              <Button
                variant="heroOutline"
                size="xl"
                className="w-full sm:w-auto"
              >
                {t("cta.calculate")}
              </Button>
            </Link>
          </motion.div>

          {/* Feature highlights */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title={tFeatures("carbonProxy.title")}
              description={tFeatures("carbonProxy.desc")}
            />
            <FeatureCard
              icon={<Recycle className="w-6 h-6" />}
              title={tFeatures("circularHub.title")}
              description={tFeatures("circularHub.desc")}
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title={tFeatures("exportReady.title")}
              description={tFeatures("exportReady.desc")}
            />
          </motion.div>

          {/* Trust badge */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.25 }}
            className="mt-12 text-sm text-muted-foreground"
          >
            {t("trust")}
          </motion.p>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-background to-transparent" />

      {/* User Type Selection Dialog */}
      <UserTypeDialog
        open={showUserTypeDialog}
        onOpenChange={setShowUserTypeDialog}
      />
    </section>
  );
};

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.5 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    whileHover={{ y: -4, scale: 1.02 }}
    className="glass-card rounded-2xl p-6 text-left transition-transform duration-300"
  >
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
      {icon}
    </div>
    <h3 className="font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </motion.div>
);

export default Hero;
