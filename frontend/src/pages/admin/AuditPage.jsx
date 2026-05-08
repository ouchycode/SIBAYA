import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Activity,
  Terminal,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useEntityList } from "@/lib/hooks/useEntityList";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

const actionColors = {
  create_booking: "bg-primary/10 text-primary border-primary/20",
  cancelled_booking: "bg-amber-50 text-amber-700 border-amber-300",
  approved_booking: "bg-emerald-50 text-emerald-700 border-emerald-300",
  rejected_booking: "bg-destructive/10 text-destructive border-destructive/20",
  completed_booking: "bg-blue-50 text-blue-700 border-blue-300",
  create_slot: "bg-primary/10 text-primary border-primary/20",
  delete_slot: "bg-destructive/10 text-destructive border-destructive/20",
  create_mapping: "bg-emerald-50 text-emerald-700 border-emerald-300",
  deactivate_mapping: "bg-amber-50 text-amber-700 border-amber-300",
  create_period: "bg-primary/10 text-primary border-primary/20",
  activate_period: "bg-emerald-50 text-emerald-700 border-emerald-300",
  deactivate_period: "bg-amber-50 text-amber-700 border-amber-300",
  update_user: "bg-purple-50 text-purple-700 border-purple-300",
};

const roleColors = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  dosen: "bg-primary/10 text-primary border-primary/20",
  mahasiswa: "bg-emerald-50 text-emerald-700 border-emerald-300",
};

export default function AuditPage() {
  // ==========================================
  // LOGIKA TETAP UTUH (TIDAK ADA YANG DIUBAH)
  // ==========================================
  const { data: activityLogs = [] } = useEntityList("ActivityLog");
  const logs = [...activityLogs].sort(
    (a, b) => new Date(b.created_date) - new Date(a.created_date),
  );

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentLogs = logs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // ==========================================
  // PERUBAHAN PADA UI/UX (FRONTEND KAKU & ARSIP)
  // ==========================================
 
  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header Halaman */}
      <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1">
            Log Aktivitas
          </p>
          <h1 className="text-base font-semibold text-foreground">
            Audit Trail Sistem
          </h1>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-primary/5 rounded-md border border-primary/10">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-medium text-primary">
            Real-time Active
          </span>
        </div>
      </div>

      <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Tabel Header Semu */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 text-xs font-medium text-muted-foreground border-b border-border/50 bg-muted/20">
          <div className="col-span-3 flex items-center gap-2">
            <User className="w-3.5 h-3.5" /> Aktor
          </div>
          <div className="col-span-6 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" /> Aktivitas
          </div>
          <div className="col-span-3 text-right flex items-center justify-end gap-2">
            <Clock className="w-3.5 h-3.5" /> Waktu
          </div>
        </div>

        <div className="divide-y divide-border/40">
          {currentLogs.map((log) => (
            <div
              key={log.id}
              className="flex flex-col lg:grid lg:grid-cols-12 gap-4 px-5 py-4 hover:bg-muted/40 transition-colors"
            >
              {/* Kolom Aktor */}
              <div className="lg:col-span-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {log.actor_name || log.actor_email.split("@")[0]}
                  </p>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-medium",
                      roleColors[log.actor_role] ||
                        "bg-muted text-muted-foreground"
                    )}
                  >
                    {log.actor_role || "Unknown"}
                  </span>
                </div>
              </div>

              {/* Kolom Deskripsi & Action */}
              <div className="lg:col-span-6 flex flex-col justify-center min-w-0">
                <div className="mb-1">
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-sm font-medium border",
                      actionColors[log.action] ||
                        "bg-muted text-muted-foreground border-border"
                    )}
                  >
                    {log.action?.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {log.description}
                </p>
              </div>

              {/* Kolom Timestamp */}
              <div className="lg:col-span-3 flex lg:flex-col items-center lg:items-end justify-between lg:justify-center text-xs">
                <span className="text-muted-foreground">
                  {log.created_date &&
                    format(new Date(log.created_date), "dd MMM yyyy", {
                      locale: localeId,
                    })}
                </span>
                <span className="font-medium text-foreground">
                  {log.created_date &&
                    format(new Date(log.created_date), "HH:mm:ss 'WIB'")}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-border/50 flex items-center justify-between bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Halaman {currentPage} dari {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 rounded text-xs shadow-none border-border/60 hover:bg-background"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 rounded text-xs shadow-none border-border/60 hover:bg-background"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Selanjutnya
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
