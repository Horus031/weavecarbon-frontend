"use client";

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  canAccessSettings,
  canAccessSystemSettings,
  canAccessUsersSettings,
  canMutateData,
  resolveCompanyRole,
  type CompanyRole
} from "@/lib/permissions";

export const usePermissions = () => {
  const { user } = useAuth();

  return useMemo(() => {
    const fallbackRole = user?.user_type === "admin" ? "root" : "member";
    const role = resolveCompanyRole(
      {
        role: user?.company_role,
        isRoot: user?.is_root
      },
      fallbackRole
    );

    return {
      role,
      isRoot: role === "root",
      isMember: role === "member",
      isViewer: role === "viewer",
      canMutate: canMutateData(role),
      canAccessSettings: canAccessSettings(role),
      canAccessSystemSettings: canAccessSystemSettings(role),
      canAccessUsersSettings: canAccessUsersSettings(role)
    } as {
      role: CompanyRole;
      isRoot: boolean;
      isMember: boolean;
      isViewer: boolean;
      canMutate: boolean;
      canAccessSettings: boolean;
      canAccessSystemSettings: boolean;
      canAccessUsersSettings: boolean;
    };
  }, [user?.company_role, user?.is_root, user?.user_type]);
};
