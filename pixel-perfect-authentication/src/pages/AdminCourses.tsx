import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminCourses,
  approveCourse,
  rejectCourse,
  deleteCourse,
  updateAdminCourse,
  AdminCourse,
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Check,
  X,
  Trash2,
  BookOpen,
  Search,
  ExternalLink,
  Users,
  Edit2,
} from "lucide-react";

const STATUS_LABELS: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  APPROVED: { label: "Tasdiqlangan", variant: "default" },
  PENDING: { label: "Kutilmoqda", variant: "secondary" },
  REJECTED: { label: "Rad etilgan", variant: "destructive" },
};

const AdminCourses = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Edit State
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    price: 0,
    public: false,
  });

  const {
    data: courses,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: getAdminCourses,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateAdminCourse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Kurs muvaffaqiyatli yangilandi");
      setEditingCourse(null);
    },
    onError: (err: any) => toast.error(err.message || "Yangilashda xatolik"),
  });

  const approveMutation = useMutation({
    mutationFn: approveCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Kurs tasdiqlandi");
    },
    onError: (err: any) => toast.error(err.message || "Tasdiqlashda xatolik"),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Kurs rad etildi");
    },
    onError: (err: any) => toast.error(err.message || "Rad etishda xatolik"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Kurs o'chirildi");
    },
    onError: (err: any) => toast.error(err.message || "O'chirishda xatolik"),
  });

  const handleEditClick = (course: AdminCourse) => {
    setEditingCourse(course);
    setEditFormData({
      title: course.title,
      description: course.description,
      price: course.price,
      public: !!course.public,
    });
  };

  const handleSaveEdit = () => {
    if (!editingCourse) return;
    updateMutation.mutate({
      id: editingCourse.id,
      data: editFormData,
    });
  };

  const filtered = courses?.filter((c) => {
    const matchSearch =
      !search ||
      `${c.title} ${c.teacherName} ${c.category}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = (courses || []).filter(
    (c) => c.status === "PENDING",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Kurslar</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {courses?.length ?? 0} ta kurs
              {pendingCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {pendingCount} ta kutilmoqda
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Kurs nomi, o'qituvchi, kategoriya..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Holat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Barchasi</SelectItem>
            <SelectItem value="PENDING">Kutilmoqda</SelectItem>
            <SelectItem value="APPROVED">Tasdiqlangan</SelectItem>
            <SelectItem value="REJECTED">Rad etilgan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Kurs</TableHead>
              <TableHead>O'qituvchi</TableHead>
              <TableHead>Narx</TableHead>
              <TableHead>Talabalar</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead className="text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    Yuklanmoqda...
                  </div>
                </TableCell>
              </TableRow>
            ) : !Array.isArray(courses) || isError ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-destructive bg-destructive/5"
                >
                  <div className="flex flex-col items-center gap-2">
                    <p className="font-semibold">
                      Kurslarni yuklashda xatolik yuz berdi
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        queryClient.invalidateQueries({
                          queryKey: ["admin-courses"],
                        })
                      }
                    >
                      Qayta urinish
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : courses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground font-medium"
                >
                  Kurslar hali mavjud emas
                </TableCell>
              </TableRow>
            ) : filtered && filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  Filtr bo'yicha kurslar topilmadi
                </TableCell>
              </TableRow>
            ) : (
              Array.isArray(filtered) &&
              filtered.map((course) => {
                const statusInfo = STATUS_LABELS[course.status] || {
                  label: course.status,
                  variant: "outline",
                };
                return (
                  <TableRow
                    key={course.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        {course.thumbnailUrl ? (
                          <div className="relative group">
                            <img
                              src={course.thumbnailUrl}
                              alt={course.title}
                              className="h-12 w-20 object-cover rounded-md shadow-sm border border-border group-hover:opacity-90 transition-opacity"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://placehold.co/80x48?text=No+Image";
                              }}
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-20 rounded-md bg-muted flex items-center justify-center border border-dashed border-muted-foreground/30">
                            <BookOpen className="h-5 w-5 text-muted-foreground/50" />
                          </div>
                        )}
                        <div className="space-y-1">
                          <p className="font-semibold text-sm text-foreground leading-tight group-hover:text-primary transition-colors">
                            {course.title}
                          </p>
                          {course.category && (
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase tracking-wider h-4 px-1.5 font-medium bg-muted/50 text-muted-foreground border-none"
                            >
                              {course.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary font-bold">
                          {course.teacherName?.charAt(0)}
                        </div>
                        {course.teacherName}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-bold text-foreground whitespace-nowrap">
                      {course.price.toLocaleString()} so'm
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{course.studentsCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusInfo.variant}
                        className={`capitalize font-semibold shadow-sm ${
                          course.status === "APPROVED"
                            ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/25"
                            : course.status === "PENDING"
                              ? "bg-amber-500/15 text-amber-600 border-amber-500/20 hover:bg-amber-500/25"
                              : "bg-rose-500/15 text-rose-600 border-rose-500/20 hover:bg-rose-500/25"
                        }`}
                      >
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1 px-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full transition-all"
                          title="Ko'rish"
                          asChild
                        >
                          <a
                            href={`/course/${course.id}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-all"
                          title="Tahrirlash"
                          onClick={() => handleEditClick(course)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        {course.status !== "APPROVED" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-all"
                            title="Tasdiqlash"
                            onClick={() => approveMutation.mutate(course.id)}
                            disabled={approveMutation.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {course.status !== "REJECTED" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-full transition-all"
                            title="Rad etish"
                            onClick={() => rejectMutation.mutate(course.id)}
                            disabled={rejectMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-full transition-all"
                          title="O'chirish"
                          onClick={() => {
                            if (
                              confirm(
                                `"${course.title}" kursini o'chirishni tasdiqlaysizmi?`,
                              )
                            )
                              deleteMutation.mutate(course.id);
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Course Modal */}
      <Dialog
        open={!!editingCourse}
        onOpenChange={(open) => !open && setEditingCourse(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Kursni Tahrirlash</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Kurs nomi</Label>
              <Input
                id="title"
                value={editFormData.title}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Tavsif</Label>
              <Textarea
                id="description"
                rows={4}
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Narxi (so'm)</Label>
                <Input
                  id="price"
                  type="number"
                  value={editFormData.price}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      price: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="public"
                  checked={editFormData.public}
                  onCheckedChange={(checked) =>
                    setEditFormData({ ...editFormData, public: !!checked })
                  }
                />
                <Label
                  htmlFor="public"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Ommaviy (Public)
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCourse(null)}>
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

export default AdminCourses;
