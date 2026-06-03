import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
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
import { Wallet, Check, X, Clock, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Kutilmoqda",
  APPROVED: "Tasdiqlangan",
  REJECTED: "Rad etilgan",
};

const AdminWithdrawals = () => {
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: getAdminWithdrawals,
  });

  const approveMutation = useMutation({
    mutationFn: approveWithdrawal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      toast.success("So'rov tasdiqlandi");
    },
    onError: (err: any) => toast.error(err.message || "Tasdiqlashda xatolik"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      rejectWithdrawal(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      toast.success("So'rov rad etildi");
      setRejectId(null);
      setRejectReason("");
    },
    onError: (err: any) => toast.error(err.message || "Rad etishda xatolik"),
  });

  const handleOpenReject = (id: number) => {
    setRejectId(id);
    setRejectReason("");
  };

  const handleRejectConfirm = () => {
    if (!rejectId) return;
    if (!rejectReason.trim()) {
      toast.error("Iltimos, rad etish sababini kiriting");
      return;
    }
    rejectMutation.mutate({ id: rejectId, reason: rejectReason });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Wallet className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Pul Yechish So'rovlari</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {withdrawals?.length ?? 0} ta jami so'rov
          </p>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>O'qituvchi</TableHead>
              <TableHead>Summa</TableHead>
              <TableHead>Karta raqami</TableHead>
              <TableHead>Sana</TableHead>
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
            ) : !Array.isArray(withdrawals) ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-destructive"
                >
                  Yuklashda xatolik yuz berdi
                </TableCell>
              </TableRow>
            ) : withdrawals.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  So'rovlar topilmadi
                </TableCell>
              </TableRow>
            ) : (
              withdrawals.map((w) => (
                <TableRow key={w.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="font-medium text-sm">{w.teacherName}</div>
                    <div className="text-xs text-muted-foreground">
                      ID: {w.teacherId}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">
                    {w.amount.toLocaleString()} so'm
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {w.cardNumber || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {w.createdAt
                      ? new Date(w.createdAt).toLocaleDateString("uz-UZ")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${STATUS_COLORS[w.status] || "bg-gray-100"}`}
                    >
                      {STATUS_LABELS[w.status] || w.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {w.status === "PENDING" && (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Tasdiqlash"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => approveMutation.mutate(w.id)}
                          disabled={approveMutation.isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Rad etish"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleOpenReject(w.id)}
                          disabled={rejectMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Reject Reason Modal */}
      <Dialog
        open={rejectId !== null}
        onOpenChange={(open) => !open && setRejectId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              So'rovni Rad Etish
            </DialogTitle>
            <DialogDescription>
              Iltimos, o'qituvchiga so'rov nima sababdan rad etilganini
              tushuntirib bering.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason" className="mb-2 block">
              Rad etish sababi
            </Label>
            <Textarea
              id="reason"
              placeholder="Masalan: Karta ma'lumotlari noto'g'ri..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Yuborilmoqda..." : "Rad etish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawals;
