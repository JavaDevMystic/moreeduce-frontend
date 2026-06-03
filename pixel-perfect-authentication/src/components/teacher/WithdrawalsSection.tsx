import { useState } from "react";
import { Wallet, Plus, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getTeacherWithdrawals,
  requestWithdrawal,
  WithdrawalDto,
} from "@/lib/teacher-api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  PENDING: { label: "Kutilmoqda", color: "#ca8a04", bg: "rgba(234, 179, 8, 0.1)", icon: Clock },
  APPROVED: { label: "Tasdiqlangan", color: "#16a34a", bg: "rgba(34, 197, 94, 0.1)", icon: CheckCircle },
  REJECTED: { label: "Rad etilgan", color: "#dc2626", bg: "rgba(239, 68, 68, 0.1)", icon: XCircle },
};

const WithdrawalsSection = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["teacher-withdrawals"],
    queryFn: getTeacherWithdrawals,
    retry: 1,
  });

  const withdrawals = Array.isArray(data) ? data : [];

  const handleSubmit = async () => {
    const num = Number(amount);
    if (!num || num <= 0) {
      toast.error("Miqdorni to'g'ri kiriting");
      return;
    }
    setSubmitting(true);
    try {
      await requestWithdrawal({ amount: num });
      toast.success("Pul yechish so'rovi yuborildi");
      setOpen(false);
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["teacher-withdrawals"] });
    } catch (e: any) {
      toast.error(e.message || "So'rov yuborishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Wallet size={18} />
            Pul Yechish So'rovlari
          </CardTitle>
          <CardDescription>
            Hisobingizdan pul yechish so'rovlari tarixi.
          </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus size={16} />
              Yangi So'rov
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pul Yechish So'rovi</DialogTitle>
              <DialogDescription>
                Yechmoqchi bo'lgan miqdorni kiriting. So'rov admin tomonidan ko'rib chiqiladi.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="amount">Miqdor (so'm)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="100000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={1}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Bekor qilish
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Yuborilmoqda..." : "So'rov yuborish"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Miqdor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>So'rov sanasi</TableHead>
                <TableHead>Bajarilgan sana</TableHead>
                <TableHead>Admin izohi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Yuklanmoqda...
                  </TableCell>
                </TableRow>
              ) : withdrawals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Hali pul yechish so'rovlari yo'q.
                  </TableCell>
                </TableRow>
              ) : (
                withdrawals.map((w) => {
                  const cfg = statusConfig[w.status || "PENDING"];
                  return (
                    <TableRow key={w.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold">
                        {w.amount.toLocaleString()} so'm
                      </TableCell>
                      <TableCell>
                        <Badge
                          className="text-xs font-semibold px-2 py-0.5"
                          style={{
                            backgroundColor: cfg.bg,
                            color: cfg.color,
                            border: "none",
                          }}
                        >
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(w.requestedAt)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(w.processedAt)}
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {w.adminComment || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default WithdrawalsSection;
