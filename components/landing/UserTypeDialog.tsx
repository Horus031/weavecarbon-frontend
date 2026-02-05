/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Building2, User, ArrowRight, Play, History } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface DemoSession {
  id: string;
  type: "b2b" | "b2c";
  createdAt: string;
  email: string;
}

interface UserTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserTypeDialog = ({ open, onOpenChange }: UserTypeDialogProps) => {
  const router = useRouter();
  const { signInAsDemo } = useAuth();
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [demoHistory, setDemoHistory] = useState<DemoSession[]>([]);
  const t = useTranslations("userType");

  useEffect(() => {
    // Load demo history from localStorage
    const history = localStorage.getItem("demo_sessions");
    if (history) {
      setDemoHistory(JSON.parse(history));
    }
  }, [open]);

  const handleDemoLogin = async (type: "b2b" | "b2c") => {
    setIsLoadingDemo(true);
    try {
      const { error } = await signInAsDemo();
      if (error) {
        toast.error("auth.error", { description: error.message });
        return;
      }

      // Save demo session to history
      const newSession: DemoSession = {
        id: Date.now().toString(),
        type,
        createdAt: new Date().toISOString(),
        email: `demo_${Date.now()}@weavecarbon.demo`,
      };

      const history = localStorage.getItem("demo_sessions");
      const sessions: DemoSession[] = history ? JSON.parse(history) : [];
      sessions.unshift(newSession);
      // Keep only last 10 sessions
      const trimmedSessions = sessions.slice(0, 10);
      localStorage.setItem("demo_sessions", JSON.stringify(trimmedSessions));

      onOpenChange(false);

      router.push(type === "b2b" ? "/overview" : "/b2c");
    } catch (err) {
      toast.error("auth.error");
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem("demo_sessions");
    setDemoHistory([]);
    toast.success("Đã xóa lịch sử demo");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {showHistory ? t("demoHistory") : t("title")}
          </DialogTitle>
        </DialogHeader>

        {showHistory ? (
          <div className="py-4">
            {demoHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Chưa có lịch sử demo nào
              </p>
            ) : (
              <div className="space-y-3 max-h-75 overflow-y-auto">
                {demoHistory.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        session.type === "b2b"
                          ? "bg-primary/10 text-primary"
                          : "bg-accent/10 text-accent"
                      }`}
                    >
                      {session.type === "b2b" ? (
                        <Building2 className="w-5 h-5" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {session.type === "b2b" ? "Demo B2B" : "Demo B2C"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(session.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowHistory(false)}
              >
                Quay lại
              </Button>
              {demoHistory.length > 0 && (
                <Button variant="destructive" onClick={clearHistory}>
                  Xóa lịch sử
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 py-6">
            {/* B2B Option */}
            <Link
              href="/auth?type=b2b"
              onClick={() => onOpenChange(false)}
              className="group flex items-center gap-4 p-5 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Building2 className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg mb-1">
                  {t("b2b")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("b2bDesc")}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>

            {/* B2C Option */}
            <Link
              href="/auth?type=b2c"
              onClick={() => onOpenChange(false)}
              className="group flex items-center gap-4 p-5 rounded-xl border-2 border-border bg-card hover:border-accent/50 hover:bg-accent/5 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                <User className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg mb-1">
                  {t("b2c")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("b2cDesc")}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
            </Link>

            {/* Divider */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t("orTry")}
                </span>
              </div>
            </div>

            {/* Demo Options */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="flex items-center gap-2 h-auto py-3"
                onClick={() => handleDemoLogin("b2b")}
                disabled={isLoadingDemo}
              >
                <Play className="w-4 h-4" />
                <span>{t("demoB2B")}</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 h-auto py-3"
                onClick={() => handleDemoLogin("b2c")}
                disabled={isLoadingDemo}
              >
                <Play className="w-4 h-4" />
                <span>{t("demoB2C")}</span>
              </Button>
            </div>

            {/* History Button */}
            {demoHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => setShowHistory(true)}
              >
                <History className="w-4 h-4 mr-2" />
                {t("viewHistory")} ({demoHistory.length})
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserTypeDialog;
