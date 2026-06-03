import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminPayments, approvePayment } from "@/lib/admin-api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X, ExternalLink, CreditCard } from "lucide-react";

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Kutilmoqda", cls: "bg-yellow-100 text-yellow-800" },
  APPROVED: { label: "Tasdiqlangan", cls: "bg-blue-100 text-blue-800" },
  ACTIVE: { label: "Faol", cls: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rad etilgan", cls: "bg-red-100 text-red-800" },
};

const AdminPayments = () => {
  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: getAdminPayments,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      approvePayment(id, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      toast.success(
        vars.status === "APPROVED" ? "To'lov tasdiqlandi" : "To'lov rad etildi",
      );
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi"),
  });

  const pending = (payments || []).filter((p) => p.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Platforma To'lovlari</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {Array.isArray(payments) ? payments.length : 0} ta to'lov
            {pending > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {pending} ta kutilmoqda
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>O'qituvchi</TableHead>
              <TableHead>Miqdor</TableHead>
              <TableHead>Sana</TableHead>
              <TableHead>Chek</TableHead>
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
            ) : !Array.isArray(payments) ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-destructive"
                >
                  Yuklashda xatolik yuz berdi
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  To'lovlar topilmadi
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => {
                const s = STATUS_STYLES[payment.status] || {
                  label: payment.status,
                  cls: "bg-gray-100 text-gray-800",
                };
                return (
                  <TableRow key={payment.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium">
                      {payment.teacherName}
                    </TableCell>
                    <TableCell className="font-semibold text-green-700">
                      {payment.amount.toLocaleString()} so'm
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {payment.createdAt
                        ? new Date(payment.createdAt).toLocaleDateString(
                            "uz-UZ",
                          )
                        : "–"}
                    </TableCell>
                    <TableCell>
                      {payment.paymentReceiptUrl ? (
                        <a
                          href={payment.paymentReceiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium"
                        >
                          Ko'rish <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">–</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.cls}`}
                      >
                        {s.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {payment.status === "PENDING" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Tasdiqlash"
                              onClick={() =>
                                approveMutation.mutate({
                                  id: payment.id,
                                  status: "APPROVED",
                                })
                              }
                              disabled={approveMutation.isPending}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Rad etish"
                              onClick={() =>
                                approveMutation.mutate({
                                  id: payment.id,
                                  status: "REJECTED",
                                })
                              }
                              disabled={approveMutation.isPending}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
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
    </div>
  );
};

export default AdminPayments;
