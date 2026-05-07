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
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Halaman Formal & Lega */}
      <div className="bg-card border border-primary/15 p-6 sm:p-8 rounded-sm shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
        <div className="pl-2">
          <h1 className="text-2xl font-black text-primary uppercase tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 shrink-0" />
            Audit Trail Sistem
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-2 border-l-2 border-primary/30 pl-3">
            Rekaman kronologis dan pemantauan seluruh aktivitas kritikal
            pengguna di dalam infrastruktur SIBAYA.
          </p>
        </div>
        <div className="bg-muted/30 border-2 border-primary/10 p-3 rounded-sm shrink-0 flex items-center gap-3">
          <Terminal className="w-5 h-5 text-primary" />
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">
              Status Log
            </span>
            <span className="text-xs font-black text-primary uppercase mt-1 leading-none">
              Real-time Active
            </span>
          </div>
        </div>
      </div>

      {/* Tabel Header Semu */}
      <div className="hidden lg:flex items-center px-6 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted/40 border-2 border-border rounded-t-sm border-b-0">
        <div className="w-[240px] flex items-center gap-2">
          <User className="w-3.5 h-3.5" /> AKTOR AKTIVITAS
        </div>
        <div className="flex-1 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" /> DESKRIPSI KEGIATAN
        </div>
        <div className="w-[200px] text-right flex items-center justify-end gap-2">
          <Clock className="w-3.5 h-3.5" /> WAKTU KEJADIAN
        </div>
      </div>

      <div className="space-y-0 border-2 border-t-0 border-border rounded-b-sm bg-card overflow-hidden">
        {currentLogs.map((log, index) => (
          <div
            key={log.id}
            className={cn(
              "flex flex-col lg:flex-row lg:items-center p-5 lg:px-6 gap-4 transition-all hover:bg-muted/30 relative",
              index !== currentLogs.length - 1 && "border-b border-border/60",
            )}
          >
            {/* Kolom Aktor */}
            <div className="lg:w-[240px] flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-sm bg-muted border-2 border-border flex items-center justify-center shrink-0 shadow-inner">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-black text-foreground uppercase tracking-wide truncate">
                  {log.actor_name || log.actor_email.split("@")[0]}
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    "font-black uppercase tracking-widest text-[8px] px-1.5 py-0 rounded-none border shadow-none",
                    roleColors[log.actor_role] ||
                      "bg-muted text-muted-foreground border-border",
                  )}
                >
                  {log.actor_role || "UNKNOWN"}
                </Badge>
              </div>
            </div>

            {/* Kolom Deskripsi & Action */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <Badge
                  variant="outline"
                  className={cn(
                    "font-black uppercase tracking-widest text-[9px] px-2 py-0.5 rounded-sm border-2",
                    actionColors[log.action] ||
                      "bg-muted text-muted-foreground border-border",
                  )}
                >
                  {log.action?.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="text-sm font-semibold text-foreground/80 leading-relaxed border-l-2 border-primary/20 pl-3">
                {log.description}
              </p>
            </div>

            {/* Kolom Timestamp */}
            <div className="lg:w-[200px] shrink-0 lg:text-right pt-3 lg:pt-0 border-t lg:border-0 border-dashed border-border">
              <div className="inline-flex flex-col lg:items-end bg-muted/50 lg:bg-transparent p-2 lg:p-0 rounded-sm w-full lg:w-auto">
                <span className="text-[10px] font-black text-foreground uppercase tracking-widest">
                  {log.created_date &&
                    format(new Date(log.created_date), "dd MMM yyyy", {
                      locale: localeId,
                    })}
                </span>
                <span className="text-[11px] font-mono font-bold text-primary mt-0.5">
                  {log.created_date &&
                    format(new Date(log.created_date), "HH:mm:ss 'WIB'")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Kontrol Pagination Formal - Box Kaku */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-muted/20 border-2 border-primary/10 p-4 rounded-sm mt-6 gap-4">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
            HALAMAN {currentPage} DARI {totalPages}
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-4 rounded-sm shadow-none font-black text-[10px] uppercase tracking-wider border-2 border-border hover:bg-background"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1.5" />
              SEBELUMNYA
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-4 rounded-sm shadow-none font-black text-[10px] uppercase tracking-wider border-2 border-border hover:bg-background"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              SELANJUTNYA
              <ChevronRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
