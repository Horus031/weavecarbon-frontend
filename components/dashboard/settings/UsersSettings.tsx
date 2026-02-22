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
  CardDescription } from
"@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from
"@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter } from
"@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, UserPlus, Mail, MoreHorizontal, Check, X, Eye, EyeOff, RefreshCw, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";

interface TeamMember {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: "admin" | "editor" | "member" | "viewer";
  status: "active" | "invited" | "pending" | "inactive" | "disabled";
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
  const [invitePassword, setInvitePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [inviteRole, setInviteRole] = useState<"member" | "viewer">("member");

  const generateTemporaryPassword = () => {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghijkmnopqrstuvwxyz";
    const numbers = "23456789";
    const symbols = "!@#$%^&*";
    const all = `${upper}${lower}${numbers}${symbols}`;
    const pick = (chars: string) =>
    chars.charAt(Math.floor(Math.random() * chars.length));
    const core = Array.from({ length: 8 }, () => pick(all)).join("");
    return `${pick(upper)}${pick(lower)}${pick(numbers)}${pick(symbols)}${core}`;
  };

  const loadMembers = useCallback(async () => {
    if (!companyId) {
      setMembers([]);
      setLoadingMembers(false);
      return;
    }

    setLoadingMembers(true);
    try {
      const data = await api.get<TeamMember[]>("/company/members");
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

    const passwordToSend = invitePassword.trim() || generateTemporaryPassword();
    if (passwordToSend.length < 8) {
      toast.error(t("passwordTooShort"));
      return;
    }

    if (!companyId) {
      toast.error("Company is not set.");
      return;
    }

    setUpdating(true);
    try {
      const inviteFullName =
      inviteName.trim() || inviteEmail.split("@")[0] || "Team Member";
      const created = await api.post<TeamMember | null>(
        "/company/members",
        {
          full_name: inviteFullName,
          email: inviteEmail,
          password: passwordToSend,
          role: inviteRole,
          send_notification_email: true
        }
      );

      if (created?.id) {
        setMembers((prev) => [created, ...prev]);
      } else {
        await loadMembers();
      }

      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInvitePassword("");
      setShowPassword(false);
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
    if (!companyId || !member.email) return;

    try {
      await api.post("/auth/verify-email/resend", { email: member.email });
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
    member.status === "active" ? "inactive" : "active";

    setUpdating(true);
    try {
      const updated = await api.put<TeamMember | null>(
        `/company/members/${member.id}`,
        { status: nextStatus }
      );

      if (updated?.id) {
        setMembers((prev) =>
        prev.map((m) => m.id === member.id ? updated : m)
        );
      } else {
        setMembers((prev) =>
        prev.map((m) =>
        m.id === member.id ? { ...m, status: nextStatus } : m
        )
        );
      }

      toast.success(
        t("toggleSuccess", {
          action:
          member.status === "active" ?
          t("toggleDisabled") :
          t("toggleEnabled"),
          email: member.email || ""
        })
      );
    } catch (error) {
      console.error("Failed to update member status:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update member."
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
      await api.delete(`/company/members/${member.id}`);
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
          <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
            {t("active")}
          </Badge>);

      case "invited":
      case "pending":
        return (
          <Badge className="border border-amber-200 bg-amber-50 text-amber-700">
            {t("invited")}
          </Badge>);

      case "inactive":
      case "disabled":
        return (
          <Badge className="border border-rose-200 bg-rose-50 text-rose-700">
            {t("disabled")}
          </Badge>);

      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="border border-primary/25 bg-primary/10 text-primary">
            {t("admin")}
          </Badge>);

      case "member":
      case "editor":
        return (
          <Badge className="border border-slate-200 bg-slate-100 text-slate-700">
            {t("member")}
          </Badge>);

      case "viewer":
        return (
          <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
            {t("viewer")}
          </Badge>);

      default:
        return (
          <Badge variant="secondary" className="border border-slate-200 bg-slate-100 text-slate-700">
            {role}
          </Badge>);

    }
  };

  const isLoading = loadingMembers || updating;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border border-slate-200 shadow-sm">
        <CardHeader className="rounded-t-[inherit] border-b border-slate-200 bg-slate-50/70">
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
                <Button
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  disabled={!companyId || isLoading}>

                  <UserPlus className="w-4 h-4 mr-2" />
                  {t("createAccount")}
                </Button>
              </DialogTrigger>
              <DialogContent className="border border-slate-200 bg-white">
                <DialogHeader>
                  <DialogTitle>{t("createAccountTitle")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>{t("fullName")}</Label>
                    <Input
                      className="border-slate-200 bg-white"
                      type="text"
                      placeholder={t("fullNamePlaceholder")}
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)} />

                  </div>
                  <div className="space-y-2">
                    <Label>{t("email")}</Label>
                    <Input
                      className="border-slate-200 bg-white"
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)} />

                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{t("password")}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => {
                          const pwd = generateTemporaryPassword();
                          setInvitePassword(pwd);
                          setShowPassword(true);
                        }}>
                        <RefreshCw className="w-3 h-3" />
                        {t("generatePassword")}
                      </Button>
                    </div>
                    <div className="relative">
                      <Input
                        className="border-slate-200 bg-white pr-20"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("passwordPlaceholder")}
                        value={invitePassword}
                        onChange={(e) => setInvitePassword(e.target.value)} />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                        {invitePassword && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-slate-600"
                            onClick={() => {
                              navigator.clipboard.writeText(invitePassword);
                              toast.success(t("passwordCopied"));
                            }}>
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-slate-600"
                          onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      {t("passwordHint")}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("role")}</Label>
                    <Select
                      value={inviteRole}
                      onValueChange={(v: "member" | "viewer") =>
                      setInviteRole(v)
                      }>

                      <SelectTrigger className="border-slate-200 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-slate-200 bg-white">
                        <SelectItem value="member">
                          <div>
                            <span className="font-medium">{t("member")}</span>
                            <span className="ml-2 text-slate-600">
                              - {t("memberDesc")}
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="viewer">
                          <div>
                            <span className="font-medium">{t("viewer")}</span>
                            <span className="ml-2 text-slate-600">
                              - {t("viewerDesc")}
                            </span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-600">
                      {t("roleDescription")}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    onClick={() => setInviteOpen(false)}
                    disabled={isLoading}>

                    {t("cancel")}
                  </Button>
                  <Button
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={handleInvite}
                    disabled={isLoading}>

                    <UserPlus className="w-4 h-4 mr-2" />
                    {t("createAccount")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="bg-white">
          {!companyId ?
          <p className="text-sm text-slate-600">
              Company context is missing.
            </p> :
          isLoading && members.length === 0 ?
          <div className="h-20 animate-pulse rounded-md border border-slate-200 bg-slate-100/70" /> :

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <Table className="w-full">
                <TableHeader className="bg-slate-50/80">
                  <TableRow className="border-slate-200">
                    <TableHead className="font-semibold text-slate-700">{t("memberHeaderName")}</TableHead>
                    <TableHead className="font-semibold text-slate-700">{t("memberHeaderRole")}</TableHead>
                    <TableHead className="font-semibold text-slate-700">{t("memberHeaderStatus")}</TableHead>
                    <TableHead className="font-semibold text-slate-700">{t("memberHeaderLastLogin")}</TableHead>
                    <TableHead className="w-12.5"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {members.length === 0 ?
                <TableRow>
                    <TableCell
                    colSpan={5}
                    className="py-8 text-center text-sm text-slate-600">

                      No team members found.
                    </TableCell>
                  </TableRow> :

                members.map((member) =>
                <TableRow key={member.id} className="border-slate-200 hover:bg-slate-50/70">
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {member.full_name || t("noName")}
                          </p>
                          <p className="text-sm text-slate-600">
                            {member.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(member.role)}</TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell className="text-slate-600">
                        {member.last_login ?
                    format(new Date(member.last_login), "dd/MM/yyyy HH:mm") :
                    t("neverLogged")}
                      </TableCell>
                      <TableCell>
                        {member.role !== "admin" &&
                    <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-600 hover:bg-slate-100"
                          disabled={isLoading}>

                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                        align="end"
                        className="border-slate-200 bg-white">

                              {member.status === "invited" &&
                        <DropdownMenuItem
                          className="text-slate-700 focus:bg-slate-100 focus:text-slate-800"
                          onClick={() => handleResendInvite(member)}>

                                  <Mail className="w-4 h-4 mr-2" />
                                  {t("resendInvite")}
                                </DropdownMenuItem>
                        }
                              <DropdownMenuItem
                          className="text-slate-700 focus:bg-slate-100 focus:text-slate-800"
                          onClick={() => handleToggleStatus(member)}>

                                {member.status === "active" ?
                          <>
                                    <X className="w-4 h-4 mr-2" />
                                    {t("disable")}
                                  </> :

                          <>
                                    <Check className="w-4 h-4 mr-2" />
                                    {t("enable")}
                                  </>
                          }
                              </DropdownMenuItem>
                              <DropdownMenuItem
                          onClick={() => handleRemove(member)}
                          className="text-rose-600 focus:bg-rose-50 focus:text-rose-700">

                                <X className="w-4 h-4 mr-2" />
                                {t("removeAccount")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                    }
                      </TableCell>
                    </TableRow>
                )
                }
                </TableBody>
              </Table>
            </div>
          }
        </CardContent>
      </Card>
    </div>);

};

export default UsersSettings;
