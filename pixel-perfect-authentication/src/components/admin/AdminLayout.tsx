import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { getUser } from "@/lib/auth-api";

const AdminLayout = () => {
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    if (!user) {
      console.warn("Unauthorized access to admin area. Redirecting to login.");
      navigate("/login");
    } else if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      console.warn(
        "Insufficient permissions for admin area. Redirecting to home.",
      );
      navigate("/");
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
        <p className="text-muted-foreground font-medium animate-pulse">
          Tekshirilmoqda...
        </p>
      </div>
    );
  }

  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-screen text-destructive font-medium">
        Sizda ushbu sahifaga kirish huquqi yo'q. Bosh sahifaga
        yo'naltirilmoqda...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
