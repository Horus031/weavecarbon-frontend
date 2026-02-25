"use client";

import { toast } from "sonner";
import { NO_PERMISSION_MESSAGE } from "@/lib/permissions";

export const showNoPermissionToast = () => {
  toast.info(NO_PERMISSION_MESSAGE, { duration: 3000 });
};
