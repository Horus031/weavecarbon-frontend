"use client";

import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { ArrowRight, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import UserTypeDialog from "./UserTypeDialog";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Waves from "../icons/Waves";
import dynamic from "next/dynamic";

const LeafHero3D = dynamic(() => import("./LeafHero3D"), {
  ssr: false,
  loading: () => null
});

const Hero = () => {
  const [showUserTypeDialog, setShowUserTypeDialog] = useState(false);
  const [shouldRenderLeafHero, setShouldRenderLeafHero] = useState(false);
  const t = useTranslations("hero");


  useEffect(() => {
    let cancelled = false;
    let idleCleanup: (() => void) | null = null;
    const win = window as Window & {
      requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions)
      => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const activateLeafHero = () => {
      if (!cancelled) {
        setShouldRenderLeafHero(true);
      }
    };

    const scheduleAfterIdle = () => {
      if (typeof win.requestIdleCallback === "function") {
        const idleId = win.requestIdleCallback(
          () => {
            activateLeafHero();
          },
          { timeout: 1500 }
        );

        idleCleanup = () => {
          if (typeof win.cancelIdleCallback === "function") {
            win.cancelIdleCallback(idleId);
          }
        };
        return;
      }

      const timeoutId = window.setTimeout(() => {
        activateLeafHero();
      }, 250);
      idleCleanup = () => window.clearTimeout(timeoutId);
    };


    const rafId = window.requestAnimationFrame(() => {
      scheduleAfterIdle();
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      if (idleCleanup) {
        idleCleanup();
      }
    };
  }, []);

  return (
    <section className="relative h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden bg-gradient-hero">
      
      <div className="absolute inset-0 bg-linear-to-tr from-primary-foreground to-secondary overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-16 left-20 w-96 h-96 bg-primary/50 rounded-full blur-3xl"
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 0.5 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }} />
        
        <motion.div
          className="absolute top-1/4 right-20 w-80 h-80 bg-accent/50 rounded-full blur-3xl"
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 0.5 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }} />
        
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-primary/3 rounded-full blur-3xl"
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 0.3 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }} />
        
      </div>

      <div className="container px-6 relative z-10">
        <div className="max-w-4xl">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8">
            
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">{t("badge")}</span>
          </motion.div>

          
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
            className="text-4xl md:text-5xl lg:text-7xl font-bold text-foreground mb-6">
            
            {t("title")}{" "}
            <span className="text-gradient-forest">{t("titleHighlight")}</span>
          </motion.h1>

          
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10">
            
            {t("subtitle")}
          </motion.p>

          
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
            className="flex flex-col sm:flex-row items-center  gap-4 mb-16">
            
            <Button
              variant="hero"
              size="xl"
              className="w-full sm:w-auto"
              onClick={() => setShowUserTypeDialog(true)}>
              
              {t("cta.start")}
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Link href="/calculator">
              <Button
                variant="heroOutline"
                size="xl"
                className="w-full sm:w-auto">
                
                {t("cta.calculate")}
              </Button>
            </Link>
          </motion.div>

          
          

          
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.25 }}
            className="mt-12 text-sm text-muted-foreground">
            
            {t("trust")}
          </motion.p>
        </div>
      </div>

      {shouldRenderLeafHero ? <LeafHero3D /> : null}

      
      <div className="absolute top-0 left-0 right-0 hero-waves-soft pointer-events-none">
        <Waves />
      </div>

      
      <UserTypeDialog
        open={showUserTypeDialog}
        onOpenChange={setShowUserTypeDialog} />
      
    </section>);

};


























export default Hero;