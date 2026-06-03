import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Wallet,
  CreditCard,
  MessageSquare,
  Shield,
  LogOut,
  ScrollText,
  Settings,
  BarChart3,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout, getUser } from "@/lib/auth-api";
import { useNavigate } from "react-router-dom";

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Users, label: "Foydalanuvchilar", path: "/admin/users" },
  { icon: BookOpen, label: "Kurslar", path: "/admin/courses" },
  { icon: ClipboardList, label: "Yozilishlar", path: "/admin/enrollments" },
  { icon: Wallet, label: "Pul yechish", path: "/admin/withdrawals" },
  { icon: CreditCard, label: "To'lovlar", path: "/admin/payments" },
  { icon: MessageSquare, label: "Izohlar", path: "/admin/comments" },
  { icon: BarChart3, label: "Statistika", path: "/admin/statistics" },
  { icon: ScrollText, label: "Audit Loglar", path: "/admin/audit-logs" },
  { icon: Settings, label: "Sozlamalar", path: "/admin/settings" },
];

const superAdminMenuItems = [
  { icon: Shield, label: "Adminlar", path: "/admin/admins" },
];

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) =>
    path === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(path);

  return (
    <div className="w-64 border-r bg-sidebar h-screen flex flex-col sticky top-0">
      {/* Header */}
      <div className="p-5 border-b">
        <h2 className="text-lg font-bold text-primary">MoreEduce</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Admin Panel</p>
        {user && (
          <p className="text-xs font-medium mt-2 text-foreground truncate">
            {user.firstName} {user.lastName}
            <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
              {user.role}
            </span>
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {adminMenuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {isSuperAdmin && (
          <>
            <div className="pt-3 pb-1">
              <p className="px-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Super Admin
              </p>
            </div>
            {superAdminMenuItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Chiqish
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;
