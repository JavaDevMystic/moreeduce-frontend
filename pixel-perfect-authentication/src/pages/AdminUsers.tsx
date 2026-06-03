import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminUsers,
  deleteUser,
  blockUser,
  unblockUser,
  verifyUser,
  updateUser,
  AdminUser,
} from "@/lib/admin-api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Trash2,
  ShieldCheck,
  Ban,
  Unlock,
  Users,
  Search,
  Edit2,
} from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  STUDENT: "bg-blue-100 text-blue-800",
  TEACHER: "bg-purple-100 text-purple-800",
  ADMIN: "bg-orange-100 text-orange-800",
  SUPER_ADMIN: "bg-red-100 text-red-800",
};

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Edit State
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "STUDENT" as AdminUser["role"],
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAdminUsers,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Foydalanuvchi ma'lumotlari yangilandi");
      setEditingUser(null);
    },
    onError: (err: any) => toast.error(err.message || "Yangilashda xatolik"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Foydalanuvchi o'chirildi");
    },
    onError: (err: any) => toast.error(err.message || "O'chirishda xatolik"),
  });

  const blockMutation = useMutation({
    mutationFn: blockUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Foydalanuvchi bloklandi");
    },
    onError: (err: any) => toast.error(err.message || "Bloklashda xatolik"),
  });

  const unblockMutation = useMutation({
    mutationFn: unblockUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Foydalanuvchi blokdan chiqarildi");
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi"),
  });

  const verifyMutation = useMutation({
    mutationFn: verifyUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("O'qituvchi tasdiqlandi");
    },
    onError: (err: any) => toast.error(err.message || "Tasdiqlashda xatolik"),
  });

  const handleEditClick = (user: AdminUser) => {
    setEditingUser(user);
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    });
  };

  const handleSaveEdit = () => {
    if (!editingUser) return;
    updateMutation.mutate({
      id: editingUser.id,
      data: {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        role: editFormData.role,
      },
    });
  };

  const filtered = users?.filter((u) => {
    const matchSearch =
      !search ||
      `${u.firstName} ${u.lastName} ${u.email}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Foydalanuvchilar</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {users?.length ?? 0} ta foydalanuvchi
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Ism, email bo'yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Barchasi</SelectItem>
            <SelectItem value="STUDENT">Talaba</SelectItem>
            <SelectItem value="TEACHER">O'qituvchi</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Ism Sharif</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead className="text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    Yuklanmoqda...
                  </div>
                </TableCell>
              </TableRow>
            ) : !Array.isArray(users) ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-destructive bg-destructive/5"
                >
                  <div className="flex flex-col items-center gap-2">
                    <p className="font-semibold">
                      Ma'lumotlarni yuklashda xatolik yuz berdi
                    </p>
                    <p className="text-sm opacity-80">
                      Iltimos, sahifani yangilang yoki qayta kiring.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        queryClient.invalidateQueries({
                          queryKey: ["admin-users"],
                        })
                      }
                    >
                      Qayta urinish
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground font-medium"
                >
                  Foydalanuvchilar mavjud emas
                </TableCell>
              </TableRow>
            ) : filtered && filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground font-medium"
                >
                  Filtr bo'yicha foydalanuvchilar topilmadi
                </TableCell>
              </TableRow>
            ) : (
              Array.isArray(filtered) &&
              filtered.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ROLE_COLORS[user.role] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5 flex-wrap">
                      {user.verified ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Tasdiqlangan
                        </Badge>
                      ) : user.role === "TEACHER" ? (
                        <Badge
                          variant="outline"
                          className="border-yellow-400 text-yellow-700"
                        >
                          Kutilmoqda
                        </Badge>
                      ) : null}
                      {user.blocked && (
                        <Badge variant="destructive">Bloklangan</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Tahrirlash"
                        onClick={() => handleEditClick(user)}
                      >
                        <Edit2 className="h-4 w-4 text-blue-600" />
                      </Button>
                      {user.role === "TEACHER" && !user.verified && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Tasdiqlash"
                          onClick={() => verifyMutation.mutate(user.id)}
                          disabled={verifyMutation.isPending}
                        >
                          <ShieldCheck className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title={user.blocked ? "Blokdan chiqarish" : "Bloklash"}
                        onClick={() =>
                          user.blocked
                            ? unblockMutation.mutate(user.id)
                            : blockMutation.mutate(user.id)
                        }
                        disabled={
                          blockMutation.isPending || unblockMutation.isPending
                        }
                      >
                        {user.blocked ? (
                          <Unlock className="h-4 w-4 text-green-600" />
                        ) : (
                          <Ban className="h-4 w-4 text-orange-600" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="O'chirish"
                        onClick={() => {
                          if (
                            confirm(
                              "Foydalanuvchini o'chirishni tasdiqlaysizmi?",
                            )
                          )
                            deleteMutation.mutate(user.id);
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit User Modal */}
      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Foydalanuvchini Tahrirlash</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Ism</Label>
                <Input
                  id="firstName"
                  value={editFormData.firstName}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      firstName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Sharif</Label>
                <Input
                  id="lastName"
                  value={editFormData.lastName}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      lastName: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editFormData.email}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={editFormData.role}
                onValueChange={(val: any) =>
                  setEditFormData({ ...editFormData, role: val })
                }
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Talaba</SelectItem>
                  <SelectItem value="TEACHER">O'qituvchi</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Bekor qilish
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
