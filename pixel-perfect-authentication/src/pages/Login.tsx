import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { signIn, saveTokens, saveUser, fetchMe } from "@/lib/auth-api";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email va parolni kiriting");
      return;
    }
    setLoading(true);
    try {
      const res = await signIn({ email, password });
      console.log("Login full response:", res);

      if (res.accessToken) {
        saveTokens(res.accessToken, res.refreshToken);

        // Try to get full profile from backend first
        let userData: any = await fetchMe();

        // Fallback to response data or JWT-decoded data
        if (!userData) {
          userData = res.user || (res as any).data?.user || (res as any).data || null;
        }

        if (userData && typeof userData === "object") {
          saveUser(userData);
          console.log("Saved user data:", userData);
        }

        toast.success("Muvaffaqiyatli kirdingiz!");

        // Role-based redirect
        const role: string = (
          userData?.role ||
          (res as any).role ||
          ""
        ).toUpperCase();

        console.log("Detected role for redirect:", role);

        if (role === "TEACHER") {
          navigate("/teacher/dashboard");
        } else if (role === "STUDENT") {
          navigate("/student/dashboard");
        } else if (role === "ADMIN" || role === "SUPER_ADMIN") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else {
        toast.success("Tizimga kirdingiz");
        navigate("/");
      }
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
          Homepage &gt; Login
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="border border-border rounded-md p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-foreground mb-6">Login</h2>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Input
              placeholder="Email or telefon no'mer*"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-sm border-border rounded-md"
            />
            <div className="relative">
              <Input
                type={showPass ? "text" : "password"}
                placeholder="Parol*"
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
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(!!v)}
              />
              <label
                htmlFor="remember"
                className="text-sm text-foreground cursor-pointer"
              >
                Remember me
              </label>
            </div>
            <Button variant="auth" type="submit" disabled={loading}>
              {loading ? "Kirish..." : "Login"}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <a href="#" className="text-foreground hover:text-primary">
                Lost your password?
              </a>
              <Link to="/register" className="text-primary hover:underline">
                Register
              </Link>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
