"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/apiClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, UserPlus, Mail, MoreHorizontal, Check, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";

interface TeamMember {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: "admin" | "member" | "viewer";
  status: "active" | "invited" | "disabled";
  last_login: string | null;
  created_at: string;
}

const UsersSettings: React.FC = () => {
  const t = useTranslations("settings.users");
  const { user } = useAuth();
  const companyId = user?.company_id || null;

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "viewer">("member");

  const loadMembers = useCallback(async () => {
    if (!companyId) {
      setMembers([]);
      setLoadingMembers(false);
      return;
    }

    setLoadingMembers(true);
    try {
      const data = await api.get<TeamMember[]>(`/companies/${companyId}/members`);
      setMembers(data || []);
    } catch (error) {
      console.error("Failed to load members:", error);
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error(t("emailRequired"));
      return;
    }

    if (!companyId) {
      toast.error("Company is not set.");
      return;
    }

    setUpdating(true);
    try {
      const created = await api.post<TeamMember | null>(
        `/companies/${companyId}/members/invite`,
        {
          full_name: inviteName || null,
          email: inviteEmail,
          role: inviteRole,
        },
      );

      if (created?.id) {
        setMembers((prev) => [created, ...prev]);
      } else {
        await loadMembers();
      }

      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("member");
      toast.success(t("inviteSuccess", { email: inviteEmail }));
    } catch (error) {
      console.error("Failed to invite member:", error);
      toast.error(error instanceof Error ? error.message : "Invite failed.");
    } finally {
      setUpdating(false);
    }
  };

  const handleResendInvite = async (member: TeamMember) => {
    if (!companyId) return;

    try {
      await api.post(`/companies/${companyId}/members/${member.id}/resend-invite`);
      toast.success(t("resendSuccess", { email: member.email || "" }));
    } catch (error) {
      console.error("Failed to resend invite:", error);
      toast.error(error instanceof Error ? error.message : "Resend failed.");
    }
  };

  const handleToggleStatus = async (member: TeamMember) => {
    if (member.role === "admin") {
      toast.error(t("cannotDisableAdmin"));
      return;
    }
    if (!companyId) return;

    const nextStatus: TeamMember["status"] =
      member.status === "active" ? "disabled" : "active";

    setUpdating(true);
    try {
      const updated = await api.patch<TeamMember | null>(
        `/companies/${companyId}/members/${member.id}`,
        { status: nextStatus },
      );

      if (updated?.id) {
        setMembers((prev) =>
          prev.map((m) => (m.id === member.id ? updated : m)),
        );
      } else {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === member.id ? { ...m, status: nextStatus } : m,
          ),
        );
      }

      toast.success(
        t("toggleSuccess", {
          action:
            member.status === "active"
              ? t("toggleDisabled")
              : t("toggleEnabled"),
          email: member.email || "",
        }),
      );
    } catch (error) {
      console.error("Failed to update member status:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update member.",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async (member: TeamMember) => {
    if (member.role === "admin") {
      toast.error(t("cannotRemoveAdmin"));
      return;
    }
    if (!companyId) return;

    setUpdating(true);
    try {
      await api.delete(`/companies/${companyId}/members/${member.id}`);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      toast.success(t("removeSuccess", { email: member.email || "" }));
    } catch (error) {
      console.error("Failed to remove member:", error);
      toast.error(error instanceof Error ? error.message : "Remove failed.");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            {t("active")}
          </Badge>
        );
      case "invited":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
            {t("invited")}
          </Badge>
        );
      case "disabled":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            {t("disabled")}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20">
            {t("admin")}
          </Badge>
        );
      case "member":
        return <Badge variant="secondary">{t("member")}</Badge>;
      case "viewer":
        return <Badge variant="outline">{t("viewer")}</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const isLoading = loadingMembers || updating;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {t("teamMembersCount", { count: members.length })}
              </CardTitle>
              <CardDescription>{t("teamMembersDesc")}</CardDescription>
            </div>
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button disabled={!companyId || isLoading}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t("createAccount")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("createAccountTitle")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>{t("fullName")}</Label>
                    <Input
                      type="text"
                      placeholder={t("fullNamePlaceholder")}
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("email")}</Label>
                    <Input
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("role")}</Label>
                    <Select
                      value={inviteRole}
                      onValueChange={(v: "member" | "viewer") =>
                        setInviteRole(v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">
                          <div>
                            <span className="font-medium">{t("member")}</span>
                            <span className="text-muted-foreground ml-2">
                              - {t("memberDesc")}
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="viewer">
                          <div>
                            <span className="font-medium">{t("viewer")}</span>
                            <span className="text-muted-foreground ml-2">
                              - {t("viewerDesc")}
                            </span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {t("roleDescription")}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setInviteOpen(false)}
                    disabled={isLoading}
                  >
                    {t("cancel")}
                  </Button>
                  <Button onClick={handleInvite} disabled={isLoading}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {t("createAccount")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!companyId ? (
            <p className="text-sm text-muted-foreground">
              Company context is missing.
            </p>
          ) : isLoading && members.length === 0 ? (
            <div className="h-20 bg-muted rounded-md animate-pulse" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("memberHeaderName")}</TableHead>
                  <TableHead>{t("memberHeaderRole")}</TableHead>
                  <TableHead>{t("memberHeaderStatus")}</TableHead>
                  <TableHead>{t("memberHeaderLastLogin")}</TableHead>
                  <TableHead className="w-12.5"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-sm text-muted-foreground py-8"
                    >
                      No team members found.
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {member.full_name || t("noName")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(member.role)}</TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.last_login
                          ? format(new Date(member.last_login), "dd/MM/yyyy HH:mm")
                          : t("neverLogged")}
                      </TableCell>
                      <TableCell>
                        {member.role !== "admin" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={isLoading}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {member.status === "invited" && (
                                <DropdownMenuItem
                                  onClick={() => handleResendInvite(member)}
                                >
                                  <Mail className="w-4 h-4 mr-2" />
                                  {t("resendInvite")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(member)}
                              >
                                {member.status === "active" ? (
                                  <>
                                    <X className="w-4 h-4 mr-2" />
                                    {t("disable")}
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-4 h-4 mr-2" />
                                    {t("enable")}
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRemove(member)}
                                className="text-destructive"
                              >
                                <X className="w-4 h-4 mr-2" />
                                {t("removeAccount")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersSettings;
