import React from "react";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import AppLayout from "@/components/layout/AppLayout";
import { Navigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RoleRouter() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex w-full animate-in fade-in duration-500 z-50 fixed inset-0">
        {/* Sidebar Skeleton (Hidden on Mobile) */}
        <div className="hidden lg:flex flex-col w-[260px] border-r border-border bg-primary p-4 shrink-0">
          <div className="flex items-center gap-4 mb-8 pt-4 px-1">
            <Skeleton className="w-12 h-12 rounded-md bg-primary-foreground/20" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-24 bg-primary-foreground/20" />
              <Skeleton className="h-3 w-16 bg-primary-foreground/20" />
            </div>
          </div>
          <div className="space-y-3 px-1">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md bg-primary-foreground/10" />
            ))}
          </div>
          <div className="mt-auto p-1">
            <Skeleton className="h-16 w-full rounded-md bg-primary-foreground/10" />
          </div>
        </div>

        {/* Main Content Area Skeleton */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header Skeleton */}
          <div className="h-[72px] border-b border-border bg-card flex items-center px-4 md:px-8 justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-md lg:hidden" />
              <Skeleton className="h-6 w-32 md:w-48" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="hidden md:block space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
          </div>

          {/* Page Content Skeleton */}
          <div className="p-4 md:p-6 lg:p-8 space-y-6 overflow-hidden">
            <div className="flex items-center justify-between">
               <div className="space-y-2">
                 <Skeleton className="h-8 w-48 md:w-64" />
                 <Skeleton className="h-4 w-32 md:w-48" />
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-md" />
              ))}
            </div>
            <Skeleton className="h-[300px] w-full rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.role) {
    return <Navigate to="/setup-role" replace />;
  }

  return <AppLayout user={user} />;
}
