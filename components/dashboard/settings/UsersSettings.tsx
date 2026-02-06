"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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

// Demo data for team members
const DEMO_TEAM: TeamMember[] = [
  {
    id: "1",
    user_id: "11111111-1111-1111-1111-111111111111",
    full_name: "Admin (Root)",
    email: "admin@egolism.com",
    role: "admin",
    status: "active",
    last_login: new Date().toISOString(),
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    user_id: "22222222-2222-2222-2222-222222222222",
    full_name: "Team Member",
    email: "member@egolism.com",
    role: "member",
    status: "active",
    last_login: new Date(Date.now() - 86400000).toISOString(),
    created_at: "2024-02-01T10:00:00Z",
  },
  {
    id: "3",
    user_id: "33333333-3333-3333-3333-333333333333",
    full_name: "Viewer User",
    email: "viewer@egolism.com",
    role: "viewer",
    status: "invited",
    last_login: null,
    created_at: "2024-03-01T10:00:00Z",
  },
];

const ROLES = [
  { value: "member", label: "Member", description: "Xem và chỉnh sửa dữ liệu" },
  { value: "viewer", label: "Viewer", description: "Chỉ xem dữ liệu" },
];

const UsersSettings: React.FC = () => {
  const { user } = useAuth();
  const isDemoTenant = user?.is_demo_user || false;
  const [members, setMembers] = useState<TeamMember[]>(DEMO_TEAM);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "viewer">("member");

  const handleInvite = () => {
    if (!inviteEmail) {
      toast.error("Vui lòng nhập email");
      return;
    }

    // Demo: just add to local state
    const newMember: TeamMember = {
      id: Date.now().toString(),
      user_id: crypto.randomUUID(),
      full_name: inviteName || null,
      email: inviteEmail,
      role: inviteRole,
      status: "invited",
      last_login: null,
      created_at: new Date().toISOString(),
    };

    setMembers((prev) => [...prev, newMember]);
    setInviteOpen(false);
    setInviteEmail("");
    setInviteName("");
    toast.success(`Đã tạo tài khoản cho ${inviteEmail}`);
  };

  const handleResendInvite = (member: TeamMember) => {
    toast.success(`Đã gửi lại lời mời đến ${member.email}`);
  };

  const handleToggleStatus = (member: TeamMember) => {
    if (member.role === "admin") {
      toast.error("Không thể vô hiệu hóa tài khoản Admin");
      return;
    }
    setMembers((prev) =>
      prev.map((m) =>
        m.id === member.id
          ? {
              ...m,
              status: m.status === "active" ? "disabled" : ("active" as const),
            }
          : m,
      ),
    );
    toast.success(
      `Đã ${member.status === "active" ? "vô hiệu hóa" : "kích hoạt"} tài khoản ${member.email}`,
    );
  };

  const handleRemove = (member: TeamMember) => {
    if (member.role === "admin") {
      toast.error("Không thể xóa tài khoản Admin");
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    toast.success(`Đã xóa ${member.email} khỏi hệ thống`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            Hoạt động
          </Badge>
        );
      case "invited":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
            Chờ xác nhận
          </Badge>
        );
      case "disabled":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            Vô hiệu
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
            Admin (Root)
          </Badge>
        );
      case "member":
        return <Badge variant="secondary">Member</Badge>;
      case "viewer":
        return <Badge variant="outline">Viewer</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Người dùng ({members.length})
              </CardTitle>
              <CardDescription>
                Admin tạo tài khoản cho thành viên với vai trò Member hoặc
                Viewer
              </CardDescription>
            </div>
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Tạo tài khoản
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tạo tài khoản mới</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Họ tên</Label>
                    <Input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="email@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vai trò</Label>
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
                        {ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div>
                              <span className="font-medium">{role.label}</span>
                              <span className="text-muted-foreground ml-2">
                                - {role.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Member: Có thể xem và chỉnh sửa dữ liệu. Viewer: Chỉ có
                      thể xem.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setInviteOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button onClick={handleInvite}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Tạo tài khoản
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thành viên</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Đăng nhập gần nhất</TableHead>
                <TableHead className="w-12.5"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {member.full_name || "Chưa có tên"}
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
                      : "Chưa đăng nhập"}
                  </TableCell>
                  <TableCell>
                    {member.role !== "admin" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {member.status === "invited" && (
                            <DropdownMenuItem
                              onClick={() => handleResendInvite(member)}
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Gửi lại email kích hoạt
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(member)}
                          >
                            {member.status === "active" ? (
                              <>
                                <X className="w-4 h-4 mr-2" />
                                Vô hiệu hóa
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                Kích hoạt
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRemove(member)}
                            className="text-destructive"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Xóa tài khoản
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isDemoTenant && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-sm text-amber-600">
            ⚠️ Tài khoản Demo: Các thay đổi về người dùng chỉ được lưu trong
            phiên làm việc này.
          </p>
        </div>
      )}
    </div>
  );
};

export default UsersSettings;
