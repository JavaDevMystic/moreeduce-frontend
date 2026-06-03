import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAuditLogs,
  getAuditLogsByUser,
  getAuditLogsByAction,
  deleteAuditLogs,
} from "@/lib/admin-api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ScrollText,
  Search,
  X,
  User,
  Activity,
  Trash2,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  LOGIN: "bg-purple-100 text-purple-800",
  APPROVE: "bg-emerald-100 text-emerald-800",
  REJECT: "bg-orange-100 text-orange-800",
};

const AdminAuditLogs = () => {
  const queryClient = useQueryClient();
  const [emailFilter, setEmailFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<"none" | "email" | "action">(
    "none",
  );

  // Clear Logs State
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [beforeDate, setBeforeDate] = useState(() => {
    // Default to 30 days ago
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });

  const { data: allLogs, isLoading: loadingAll } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: getAuditLogs,
    enabled: activeFilter === "none",
  });

  const { data: emailLogs, isLoading: loadingEmail } = useQuery({
    queryKey: ["audit-logs-user", emailFilter],
    queryFn: () => getAuditLogsByUser(emailFilter),
    enabled: activeFilter === "email" && emailFilter.length > 0,
  });

  const { data: actionLogs, isLoading: loadingAction } = useQuery({
    queryKey: ["audit-logs-action", actionFilter],
    queryFn: () => getAuditLogsByAction(actionFilter),
    enabled: activeFilter === "action" && actionFilter.length > 0,
  });

  const deleteLogsMutation = useMutation({
    mutationFn: deleteAuditLogs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      toast.success("Loglar muvaffaqiyatli tozalandi");
      setIsClearModalOpen(false);
    },
    onError: (err: any) => toast.error(err.message || "Tozalashda xatolik"),
  });

  const logs =
    activeFilter === "email"
      ? emailLogs
      : activeFilter === "action"
        ? actionLogs
        : allLogs;
  const isLoading =
    (activeFilter === "none" && loadingAll) ||
    (activeFilter === "email" && loadingEmail) ||
    (activeFilter === "action" && loadingAction);

  const handleEmailSearch = () => {
    if (emailFilter.trim()) setActiveFilter("email");
  };

  const handleActionSearch = () => {
    if (actionFilter.trim()) setActiveFilter("action");
  };

  const handleReset = () => {
    setEmailFilter("");
    setActionFilter("");
    setActiveFilter("none");
  };

  const handleClearLogs = () => {
    if (!beforeDate) return;
    deleteLogsMutation.mutate(beforeDate);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScrollText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Audit Loglar</h1>
        </div>
        <Button
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 gap-2"
          onClick={() => setIsClearModalOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
          Tozalash
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtrlash</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-2 flex-1 min-w-48">
              <div className="relative flex-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Email bo'yicha qidirish..."
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEmailSearch()}
                />
              </div>
              <Button
                variant="secondary"
                size="icon"
                onClick={handleEmailSearch}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2 flex-1 min-w-48">
              <div className="relative flex-1">
                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Harakat turi bo'yicha..."
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleActionSearch()}
                />
              </div>
              <Button
                variant="secondary"
                size="icon"
                onClick={handleActionSearch}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            {activeFilter !== "none" && (
              <Button variant="ghost" onClick={handleReset} className="gap-2">
                <X className="h-4 w-4" />
                Tozalash
              </Button>
            )}
          </div>
          {activeFilter !== "none" && (
            <p className="text-sm text-muted-foreground mt-2">
              Filtr:{" "}
              <strong>
                {activeFilter === "email" ? emailFilter : actionFilter}
              </strong>
            </p>
          )}
        </CardContent>
      </Card>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Harakat</TableHead>
              <TableHead>Tavsif</TableHead>
              <TableHead>Kim tomonidan</TableHead>
              <TableHead>Vaqt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    Yuklanmoqda...
                  </div>
                </TableCell>
              </TableRow>
            ) : !logs || !Array.isArray(logs) || logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  Loglar topilmadi
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/20">
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ACTION_COLORS[log.action?.toUpperCase()] ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {log.action || "UNSET"}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-sm">
                    <p className="text-sm leading-relaxed">{log.description}</p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {log.performedBy}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {log.timestamp
                      ? new Date(log.timestamp).toLocaleString("uz-UZ", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {Array.isArray(logs) && logs.length > 0 && (
        <p className="text-sm text-muted-foreground text-right">
          Jami: <strong>{logs.length}</strong> ta log
        </p>
      )}

      {/* Clear Logs Modal */}
      <Dialog open={isClearModalOpen} onOpenChange={setIsClearModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Loglarni Tozalash
            </DialogTitle>
            <DialogDescription>
              Belgilangan sanadan oldingi barcha audit loglari butunlay o'chirib
              tashlanadi.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="beforeDate"
                className="text-sm font-medium flex items-center gap-2"
              >
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Sana gacha o'chirish:
              </label>
              <Input
                id="beforeDate"
                type="date"
                value={beforeDate}
                onChange={(e) => setBeforeDate(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Tanlangan sanadan (shu jumladan) oldingi loglar o'chiriladi.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsClearModalOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearLogs}
              disabled={deleteLogsMutation.isPending}
            >
              {deleteLogsMutation.isPending
                ? "Tozalanmoqda..."
                : "Tozalashni Tasdiqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAuditLogs;
