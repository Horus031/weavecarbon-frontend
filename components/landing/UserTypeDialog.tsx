"use client";

import { Building2, User, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface UserTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserTypeDialog = ({ open, onOpenChange }: UserTypeDialogProps) => {
  const t = useTranslations("userType");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {t("title")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-6">
          
          <Link
            href="/auth?type=b2b&forceLogin=1"
            onClick={() => onOpenChange(false)}
            className="group flex items-center gap-4 p-5 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-300">

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

          
          <Link
            href="/auth?type=b2c&forceLogin=1"
            onClick={() => onOpenChange(false)}
            className="group flex items-center gap-4 p-5 rounded-xl border-2 border-border bg-card hover:border-accent/50 hover:bg-accent/5 transition-all duration-300">

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

        </div>
      </DialogContent>
    </Dialog>);

};

export default UserTypeDialog;