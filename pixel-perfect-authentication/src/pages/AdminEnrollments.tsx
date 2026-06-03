import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminEnrollments,
  updateEnrollmentStatus,
  type AdminEnrollment,
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
import { toast } from "sonner";
import {
  Check,
  X,
  ExternalLink,
  ClipboardList,
  Eye,
  BookOpen,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  PENDING: { label: "Kutilmoqda", variant: "secondary" },
  APPROVED: { label: "Tasdiqlangan", variant: "default" },
  ACTIVE: { label: "Faol", variant: "default" },
  REJECTED: { label: "Rad etilgan", variant: "destructive" },
};

const AdminEnrollments = () => {
  const queryClient = useQueryClient();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const {
    data: enrollments,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-enrollments"],
    queryFn: getAdminEnrollments,
    refetchInterval: 30000, // auto-refresh every 30s
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: "APPROVED" | "REJECTED";
    }) => updateEnrollmentStatus(id, status),
    onMutate: ({ id }) => setProcessingId(id),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
      toast.success(
        vars.status === "APPROVED"
          ? "✅ Yozilish tasdiqlandi — talaba kursga qo'shildi"
          : "❌ Yozilish rad etildi",
      );
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi"),
    onSettled: () => setProcessingId(null),
  });

  const pendingCount = (enrollments || []).filter(
    (e) => e.status === "PENDING",
  ).length;

  const isReceiptImage = (url: string) =>
    /\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i.test(url);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-indigo-50">
          <ClipboardList className="h-7 w-7 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Yozilish So'rovlari</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Talabalarning to'lov cheklarini ko'rib tasdiqlang yoki rad eting
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 animate-pulse">
                {pendingCount} ta yangi
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Stats bar */}
      {Array.isArray(enrollments) && enrollments.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {[
            {
              label: "Jami",
              value: enrollments.length,
              cls: "bg-gray-100 text-gray-700",
            },
            {
              label: "Kutilayotgan",
              value: enrollments.filter((e) => e.status === "PENDING").length,
              cls: "bg-amber-100 text-amber-800",
            },
            {
              label: "Tasdiqlangan",
              value: enrollments.filter(
                (e) => e.status === "APPROVED" || e.status === "ACTIVE",
              ).length,
              cls: "bg-green-100 text-green-800",
            },
            {
              label: "Rad etilgan",
              value: enrollments.filter((e) => e.status === "REJECTED").length,
              cls: "bg-red-100 text-red-800",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${s.cls}`}
            >
              {s.label}: <span className="font-bold">{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-10">#</TableHead>
              <TableHead>Talaba</TableHead>
              <TableHead>Kurs</TableHead>
              <TableHead>To'lov Cheki</TableHead>
              <TableHead>Sana</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead className="text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                    Yuklanmoqda...
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-destructive"
                >
                  Yuklashda xatolik yuz berdi
                </TableCell>
              </TableRow>
            ) : !Array.isArray(enrollments) || enrollments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <ClipboardList className="h-10 w-10 opacity-20" />
                    <p className="text-sm">Hozircha yozilish so'rovlari yo'q</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              enrollments.map((enrollment: AdminEnrollment, index) => {
                const statusConf = STATUS_CONFIG[enrollment.status] || {
                  label: enrollment.status,
                  variant: "outline" as const,
                };
                const isPending = enrollment.status === "PENDING";
                const isProcessing = processingId === enrollment.enrollmentId;

                return (
                  <TableRow
                    key={enrollment.enrollmentId}
                    className={`hover:bg-muted/20 transition-colors ${isPending ? "bg-amber-50/30" : ""}`}
                  >
                    <TableCell className="text-muted-foreground text-sm">
                      {index + 1}
                    </TableCell>

                    {/* Student */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {enrollment.studentName ||
                              `#${enrollment.studentId}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {enrollment.studentId}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Course */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-violet-500 shrink-0" />
                        <div>
                          <p className="font-medium text-sm line-clamp-1 max-w-[180px]">
                            {enrollment.courseName ||
                              `Kurs #${enrollment.courseId}`}
                          </p>
                          {enrollment.amount !== undefined && (
                            <p className="text-xs font-semibold text-green-700">
                              {enrollment.amount.toLocaleString()} so'm
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Receipt */}
                    <TableCell>
                      {enrollment.paymentReceiptUrl ? (
                        <div className="flex items-center gap-2">
                          {isReceiptImage(enrollment.paymentReceiptUrl) && (
                            <button
                              onClick={() =>
                                setPreviewUrl(enrollment.paymentReceiptUrl!)
                              }
                              className="h-10 w-10 rounded-lg border overflow-hidden hover:ring-2 hover:ring-primary transition-all shrink-0"
                              title="Chekni kattalashtirish"
                            >
                              <img
                                src={enrollment.paymentReceiptUrl}
                                alt="Chek"
                                className="w-full h-full object-cover"
                              />
                            </button>
                          )}
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() =>
                                setPreviewUrl(enrollment.paymentReceiptUrl!)
                              }
                              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                            >
                              <Eye className="h-3 w-3" />
                              Ko'rish
                            </button>
                            <a
                              href={enrollment.paymentReceiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-xs"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Yangi tab
                            </a>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm italic">
                          Chek yo'q
                        </span>
                      )}
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-sm text-muted-foreground">
                      {enrollment.createdAt
                        ? new Date(enrollment.createdAt).toLocaleDateString(
                            "uz-UZ",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : "–"}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge variant={statusConf.variant} className="text-xs">
                        {statusConf.label}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {isPending ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Tasdiqlash"
                              onClick={() =>
                                statusMutation.mutate({
                                  id: enrollment.enrollmentId,
                                  status: "APPROVED",
                                })
                              }
                              disabled={isProcessing}
                              className="h-8 px-2.5 text-green-700 hover:text-green-800 hover:bg-green-50 gap-1.5"
                            >
                              {isProcessing ? (
                                <div className="h-3.5 w-3.5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              Tasdiqlash
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Rad etish"
                              onClick={() =>
                                statusMutation.mutate({
                                  id: enrollment.enrollmentId,
                                  status: "REJECTED",
                                })
                              }
                              disabled={isProcessing}
                              className="h-8 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5"
                            >
                              <X className="h-3.5 w-3.5" />
                              Rad etish
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground pr-2">
                            Bajarildi
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Receipt Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-indigo-600" />
              To'lov Cheki
            </DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="space-y-3">
              {isReceiptImage(previewUrl) ? (
                <div className="rounded-lg overflow-hidden border bg-muted/20 flex items-center justify-center min-h-[300px]">
                  <img
                    src={previewUrl}
                    alt="To'lov cheki"
                    className="max-w-full max-h-[60vh] object-contain"
                  />
                </div>
              ) : (
                <div className="rounded-lg border p-8 flex flex-col items-center justify-center gap-3 text-muted-foreground bg-muted/20 min-h-[200px]">
                  <ExternalLink className="h-10 w-10 opacity-40" />
                  <p className="text-sm text-center">
                    Bu fayl rasm emas. Pastdagi havola orqali oching.
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPreviewUrl(null)}>
                  Yopish
                </Button>
                <Button asChild>
                  <a href={previewUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    To'liq ochish
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEnrollments;
