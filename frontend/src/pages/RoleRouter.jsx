import React from "react";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import AppLayout from "@/components/layout/AppLayout";
import { Navigate } from "react-router-dom";
import { BookOpen, Loader2 } from "lucide-react";

export default function RoleRouter() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
        <div className="flex flex-col items-center text-center max-w-sm p-8 animate-in fade-in duration-500">
          {/* Ikon Branding SIBAYA */}
          <div className="w-16 h-16 bg-primary/10 rounded-md flex items-center justify-center mb-6 border border-primary/20 shadow-sm">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>

          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />

          <h2 className="text-xl font-black text-foreground tracking-wide">
            SIBAYA
          </h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 mb-4">
            Universitas Yatsi Madani
          </p>

          <div className="h-px w-12 bg-border mb-4" />

          <p className="text-sm font-medium text-muted-foreground">
            Menginisialisasi ruang kerja Anda...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!user.role) {
    return <Navigate to="/setup-role" replace />;
  }

  return <AppLayout user={user} />;
}
