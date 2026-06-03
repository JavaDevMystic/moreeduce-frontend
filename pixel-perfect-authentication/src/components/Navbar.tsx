import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  LayoutDashboard,
  PlusCircle,
  BookOpen,
  Users,
  ShieldCheck,
  GraduationCap,
  ChevronDown,
  Search,
  BrainCircuit,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getUser, logout } from "@/lib/auth-api";

// ─── Role meta ───────────────────────────────────────────────────
const ROLE_META: Record<
  string,
  { label: string; color: string; dashPath: string; dashLabel: string }
> = {
  STUDENT: {
    label: "Talaba",
    color: "bg-blue-100 text-blue-700",
    dashPath: "/student/dashboard",
    dashLabel: "Talaba paneli",
  },
  TEACHER: {
    label: "O'qituvchi",
    color: "bg-green-100 text-green-700",
    dashPath: "/teacher/dashboard",
    dashLabel: "O'qituvchi paneli",
  },
  ADMIN: {
    label: "Admin",
    color: "bg-orange-100 text-orange-700",
    dashPath: "/admin",
    dashLabel: "Admin paneli",
  },
  SUPER_ADMIN: {
    label: "Super Admin",
    color: "bg-red-100 text-red-700",
    dashPath: "/admin",
    dashLabel: "Super Admin paneli",
  },
};

const NAV_LINKS: Record<string, { label: string; to: string }[]> = {
  GUEST: [
    { label: "Bosh sahifa", to: "/" },
    { label: "Kurslar", to: "/courses" },
    { label: "Ustozlar Uchun", to: "/" },
    { label: "O'quvchilar Uchun", to: "/" },
  ],
  STUDENT: [
    { label: "Bosh sahifa", to: "/" },
    { label: "Kurslar", to: "/courses" },
    { label: "Mening kurslarim", to: "/student/dashboard" },
    { label: "Panel", to: "/student/dashboard" },
  ],
  TEACHER: [
    { label: "Bosh sahifa", to: "/" },
    { label: "Kurslar", to: "/courses" },
    { label: "Mening kurslarim", to: "/teacher/dashboard" },
    { label: "Baholash", to: "/teacher/grading" },
    { label: "Kurs yaratish", to: "/teacher/courses/new" },
  ],
  ADMIN: [
    { label: "Bosh sahifa", to: "/" },
    { label: "Kurslar", to: "/courses" },
    { label: "Foydalanuvchilar", to: "/admin/users" },
    { label: "Admin Panel", to: "/admin" },
  ],
  SUPER_ADMIN: [
    { label: "Bosh sahifa", to: "/" },
    { label: "Kurslar", to: "/courses" },
    { label: "Foydalanuvchilar", to: "/admin/users" },
    { label: "Admin Panel", to: "/admin" },
  ],
};

// ─── Component ───────────────────────────────────────────────────
const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [hovered, setHovered] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-read user on every route change (fixes same-tab login issue)
  useEffect(() => {
    setUser(getUser());
  }, [location.pathname]);

  // Also sync on storage event (multi-tab)
  useEffect(() => {
    const sync = () => setUser(getUser());
    window.addEventListener("storage", sync);
    window.addEventListener("auth-changed", sync); // custom event
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("auth-changed", sync);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    setHovered(false);
    navigate("/");
    window.location.reload();
  };

  const role: string = user?.role || "GUEST";
  const meta = ROLE_META[role];
  const navLinks = NAV_LINKS[role] ?? NAV_LINKS.GUEST;
  const displayName = user
    ? `${user.firstName || user.first_name || user.name || "Foydalanuvchi"} ${user.lastName || user.last_name || ""}`.trim()
    : "";
  const email = user?.email || "";
  const initial = displayName.charAt(0).toUpperCase() || "?";

  // Hover logic with delay so mouse can move into dropdown
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHovered(true);
  };
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setHovered(false), 180);
  };

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shadow-sm">
            <BrainCircuit className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-black tracking-tight">
            MoreEduce
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.to + link.label}
              to={link.to}
              className="text-[15px] font-semibold text-black hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-4">
              {/* Search Button */}
              <button
                onClick={() => navigate("/courses")}
                className="w-10 h-10 rounded-full border-2 border-[#FF6B35] flex items-center justify-center text-[#FF6B35] hover:bg-[#FF6B35]/5 transition-colors"
                title="Kurslarni qidirish"
              >
                <Search size={20} strokeWidth={2.5} />
              </button>

              {/* Profile Menu */}
              <div
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {/* Avatar trigger */}
                <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-border hover:border-primary/40 bg-white hover:bg-slate-50 transition-all shadow-sm">
                  {/* Avatar circle */}
                  <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0 shadow">
                    {initial}
                  </div>
                  <div className="hidden sm:block text-left max-w-[140px]">
                    <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                      {displayName}
                    </p>
                    {meta && (
                      <p className="text-[10px] text-slate-400 leading-tight">
                        {meta.label}
                      </p>
                    )}
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-200 ${hovered ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Hover dropdown */}
                {hovered && (
                  <div
                    className="absolute right-0 mt-1 w-64 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-50"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Profile card */}
                    <div className="p-4 bg-gradient-to-br from-slate-50 to-white border-b">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white text-xl font-extrabold shadow-md">
                          {initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {displayName}
                          </p>
                          {email && (
                            <p className="text-xs text-slate-400 truncate">
                              {email}
                            </p>
                          )}
                          {meta && (
                            <span
                              className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.color}`}
                            >
                              {meta.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="py-1">
                      {meta && (
                        <Link
                          to={meta.dashPath}
                          onClick={() => setHovered(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors font-medium"
                        >
                          <LayoutDashboard size={16} className="text-primary" />
                          {meta.dashLabel}
                        </Link>
                      )}

                      {(role === "TEACHER" ||
                        role === "ADMIN" ||
                        role === "SUPER_ADMIN") && (
                        <Link
                          to="/teacher/grading"
                          onClick={() => setHovered(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors font-medium"
                        >
                          <GraduationCap size={16} className="text-primary" />
                          Baholash markazi
                        </Link>
                      )}

                      {role === "TEACHER" && (
                        <Link
                          to="/teacher/courses/new"
                          onClick={() => setHovered(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                        >
                          <PlusCircle size={16} className="text-green-500" />
                          Yangi kurs yaratish
                        </Link>
                      )}

                      {role === "STUDENT" && (
                        <Link
                          to="/"
                          onClick={() => setHovered(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <BookOpen size={16} className="text-blue-500" />
                          Kurslarni ko'rish
                        </Link>
                      )}

                      {(role === "ADMIN" || role === "SUPER_ADMIN") && (
                        <>
                          <Link
                            to="/admin/users"
                            onClick={() => setHovered(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-orange-50 transition-colors"
                          >
                            <Users size={16} className="text-orange-500" />{" "}
                            Foydalanuvchilar
                          </Link>
                          <Link
                            to="/admin/courses"
                            onClick={() => setHovered(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-orange-50 transition-colors"
                          >
                            <BookOpen size={16} className="text-orange-500" />{" "}
                            Kurslar
                          </Link>
                          {role === "SUPER_ADMIN" && (
                            <Link
                              to="/admin/admins"
                              onClick={() => setHovered(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-red-50 transition-colors"
                            >
                              <ShieldCheck size={16} className="text-red-500" />{" "}
                              Adminlar
                            </Link>
                          )}
                        </>
                      )}

                      <div className="border-t my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                      >
                        <LogOut size={16} />
                        Chiqish (Logout)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-[15px] font-semibold text-black">
                <Link
                  to="/login"
                  className="hover:text-primary transition-colors"
                >
                  Login
                </Link>
                <span className="text-slate-300">/</span>
                <Link
                  to="/register"
                  className="hover:text-primary transition-colors"
                >
                  Register
                </Link>
              </div>
              <button className="w-10 h-10 rounded-full border-2 border-[#FF6B35] flex items-center justify-center text-[#FF6B35] hover:bg-[#FF6B35]/5 transition-colors">
                <Search size={20} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
