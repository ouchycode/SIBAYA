import React, { useState } from "react";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  History,
  CalendarDays,
  Clock,
  Video,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Filter,
  UserCheck,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useEntityList } from "@/lib/hooks/useEntityList";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

const ITEMS_PER_PAGE = 5;

export default function HistoryPage() {
  // ==========================================
  // LOGIKA TETAP UTUH (TIDAK ADA YANG DIUBAH)
  // ==========================================
  const { data: user } = useCurrentUser();
  const { data: allBookings = [] } = useEntityList("Booking");

  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const bookings = allBookings
    .filter((b) => {
      if (b.student_email !== user?.email) return false;
      const isHistoryStatus = ["completed", "rejected", "cancelled"].includes(
        b.status,
      );
      if (!isHistoryStatus) return false;
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalPages = Math.ceil(bookings.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentBookings = bookings.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const handleFilterChange = (val) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // ==========================================
  // PERUBAHAN PADA UI/UX (FRONTEND KAKU, FORMAL, & LEGA)
  // ==========================================
  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header Halaman */}
      <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">
            Riwayat
          </p>
          <h1 className="text-base font-semibold text-foreground">
            Riwayat Bimbingan
          </h1>
        </div>

        {/* Dropdown Filter Status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-[11px] font-medium text-muted-foreground">
              Filter:
            </span>
          </div>
          <Select value={statusFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px] h-9 rounded text-xs bg-background shadow-none border-border/60 focus:ring-primary/20">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent className="rounded-md border-border/50 shadow-md">
              <SelectItem value="all" className="text-xs">
                Semua Status
              </SelectItem>
              <SelectItem value="completed" className="text-xs">
                Selesai
              </SelectItem>
              <SelectItem value="rejected" className="text-xs">
                Ditolak
              </SelectItem>
              <SelectItem value="cancelled" className="text-xs">
                Dibatalkan
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          icon={History}
          title={
            statusFilter === "all" ? "Belum ada riwayat" : "Tidak ada data"
          }
          description={
            statusFilter === "all"
              ? "Belum ada riwayat aktivitas bimbingan akademik yang tercatat di sistem."
              : "Tidak ada riwayat bimbingan dengan status spesifik tersebut."
          }
        />
      ) : (
        <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/50">
            <History className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              Daftar Riwayat Bimbingan
            </h2>
          </div>

          <div className="divide-y divide-border/40">
            {currentBookings.map((b) => (
              <div
                key={b.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-5 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div className="flex-shrink-0 w-10 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none">
                      {format(new Date(b.date), "MMM", { locale: localeId })}
                    </p>
                    <p className="text-xl font-semibold text-foreground leading-tight">
                      {format(new Date(b.date), "dd")}
                    </p>
                  </div>

                  <div className="hidden sm:block w-px h-10 bg-border/50 flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {format(new Date(b.date), "EEEE, dd MMMM yyyy", {
                        locale: localeId,
                      })}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {b.start_time} – {b.end_time}
                      </p>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {b.mode === "online" ? (
                          <Video className="w-3 h-3" />
                        ) : (
                          <MapPin className="w-3 h-3" />
                        )}
                        {b.mode === "online" ? "Daring" : "Luring"}
                        {b.location ? ` • ${b.location}` : ""}
                      </p>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        {b.supervisor_name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <StatusBadge status={b.status} />
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
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 rounded text-xs shadow-none border-border/60 hover:bg-background"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Selanjutnya
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
