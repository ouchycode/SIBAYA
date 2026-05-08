import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { BookOpen, Loader2 } from "lucide-react";

export function RoleBasedRoute({ allowedRoles }) {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
        <div className="flex flex-col items-center text-center max-w-sm p-8">
          <div className="w-16 h-16 bg-primary text-primary-foreground rounded-md flex items-center justify-center mb-6 border border-primary shadow-sm">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <h2 className="text-xl font-black text-foreground tracking-wide">SIBAYA</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Memeriksa hak akses...
          </p>
        </div>
      </div>
    );
  }

  // Belum login → arahkan ke halaman login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role tidak diizinkan → kembalikan ke dashboard utama
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
