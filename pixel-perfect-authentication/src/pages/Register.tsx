import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signUp, type SignUpRequest } from "@/lib/auth-api";
import { toast } from "sonner";
import VerifyEmailDialog from "@/components/VerifyEmailDialog";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Role = "TEACHER" | "STUDENT";

const Register = () => {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState<Role>("TEACHER");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !firstName || !lastName || !password) {
      toast.error("Barcha maydonlarni to'ldiring");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Parollar mos kelmadi");
      return;
    }
    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    if (!passwordRegex.test(password)) {
      toast.error("Parol kamida 8 ta belgi, katta harf, kichik harf va raqam bo'lishi kerak");
      return;
    }
    setLoading(true);
    try {
      const data: SignUpRequest = {
        firstName,
        lastName,
        email,
        password,
        role: activeRole,
      };
      await signUp(data);
      setVerifyEmail(email);
      setVerifyOpen(true);
      toast.success("Tasdiqlash kodi emailga yuborildi");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="bg-muted border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-2 text-sm text-muted-foreground">
          Homepage &gt; Register
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="border border-border rounded-md p-8 w-full max-w-md">
          {/* Role tabs */}
          <div className="text-center mb-6">
            <button
              onClick={() => setActiveRole("TEACHER")}
              className={`text-lg font-semibold mr-4 transition-colors ${activeRole === "TEACHER" ? "text-primary" : "text-muted-foreground"}`}
            >
              Teacher
            </button>
            <button
              onClick={() => setActiveRole("STUDENT")}
              className={`text-lg font-bold transition-colors ${activeRole === "STUDENT" ? "text-foreground" : "text-muted-foreground"}`}
            >
              Student
            </button>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-6">Register</h2>
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <Input
              placeholder="yourgmail@gmail.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-sm border-border rounded-md"
            />
            <Input
              placeholder="Ism (FirstName)"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="h-12 text-sm border-border rounded-md"
            />
            <Input
              placeholder="Familiya (LastName)"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="h-12 text-sm border-border rounded-md"
            />
            <div className="relative">
              <Input
                type={showPass ? "text" : "password"}
                placeholder="Parol (kamida 8 ta belgi)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 text-sm border-border rounded-md pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                placeholder="Parolni tasdiqlang"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 text-sm border-border rounded-md pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <Button variant="auth" type="submit" disabled={loading}>
              {loading ? "Yuborilmoqda..." : "Register"}
            </Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Akkauntingiz bormi? </span>
              <Link to="/login" className="text-primary hover:underline">Login</Link>
            </div>
          </form>
        </div>
      </main>

      <Footer />

      <VerifyEmailDialog
        open={verifyOpen}
        email={verifyEmail}
        onVerified={() => {
          setVerifyOpen(false);
          toast.success("Endi login qismidan tizimga kiring");
          navigate("/login");
        }}
        onClose={() => setVerifyOpen(false)}
      />
    </div>
  );
};

export default Register;
