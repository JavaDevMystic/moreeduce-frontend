import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { verifyEmail } from "@/lib/auth-api";
import { toast } from "sonner";

interface Props {
  open: boolean;
  email: string;
  onVerified: () => void;
  onClose: () => void;
}

const VerifyEmailDialog = ({ open, email, onVerified, onClose }: Props) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      await verifyEmail(email, code.trim());
      toast.success("Email tasdiqlandi! Endi tizimga kirishingiz mumkin.");
      onVerified();
    } catch (err: any) {
      toast.error(err.message || "Tasdiqlash kodi noto'g'ri");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Emailni tasdiqlang</DialogTitle>
          <DialogDescription>
            <span className="font-medium">{email}</span> ga tasdiqlash kodi yuborildi.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-2">
          <Input
            placeholder="Tasdiqlash kodi"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="h-12 text-base"
          />
          <Button variant="auth" onClick={handleVerify} disabled={loading}>
            {loading ? "Tekshirilmoqda..." : "Tasdiqlash"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VerifyEmailDialog;
