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

const ITEMS_PER_PAGE = 5;

export default function HistoryPage() {
  // ==========================================
  // LOGIKA TETAP UTUH (TIDAK ADA YANG DIUBAH)
  // ==========================================
  const { data: allBookings = [] } = useEntityList("Booking");

  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const bookings = allBookings
    .filter((b) => {
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
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Halaman Formal & Filter Bar - Dibuat lega dan tidak mentok */}
      <div className="bg-card border border-primary/15 p-6 sm:p-8 rounded-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
        <div className="pl-2">
          <h1 className="text-2xl font-black text-primary uppercase tracking-tight">
            Riwayat Bimbingan
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-2 border-l-2 border-primary/30 pl-3">
            Rekam jejak aktivitas bimbingan yang telah selesai, ditolak, atau
            dibatalkan.
          </p>
        </div>

        {/* Dropdown Filter Status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 bg-muted/30 p-3 rounded-sm border border-border">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Filter Status:
            </span>
          </div>
          <Select value={statusFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-sm border-2 border-border font-bold text-xs uppercase tracking-wider shadow-none focus:ring-primary/50">
              <SelectValue placeholder="SEMUA STATUS" />
            </SelectTrigger>
            <SelectContent className="rounded-sm border-2 border-border shadow-md">
              <SelectItem
                value="all"
                className="text-xs font-bold uppercase tracking-wider focus:bg-primary/10"
              >
                SEMUA STATUS
              </SelectItem>
              <SelectItem
                value="completed"
                className="text-xs font-bold uppercase tracking-wider focus:bg-primary/10"
              >
                SELESAI
              </SelectItem>
              <SelectItem
                value="rejected"
                className="text-xs font-bold uppercase tracking-wider focus:bg-primary/10"
              >
                DITOLAK
              </SelectItem>
              <SelectItem
                value="cancelled"
                className="text-xs font-bold uppercase tracking-wider focus:bg-primary/10"
              >
                DIBATALKAN
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="border border-border rounded-sm bg-card mt-6">
          <EmptyState
            icon={History}
            title={
              statusFilter === "all" ? "BELUM ADA RIWAYAT" : "TIDAK ADA DATA"
            }
            description={
              statusFilter === "all"
                ? "Belum ada riwayat aktivitas bimbingan akademik yang tercatat di sistem."
                : "Tidak ada riwayat bimbingan dengan status spesifik tersebut."
            }
          />
        </div>
      ) : (
        <div className="space-y-6 mt-6">
          {/* Daftar Riwayat */}
          <div className="space-y-4">
            {currentBookings.map((b) => (
              <Card
                key={b.id}
                className="rounded-sm border-2 border-primary/10 shadow-sm bg-card overflow-hidden transition-all hover:border-primary/30"
              >
                <CardContent className="p-0">
                  {/* Header Kartu Riwayat - Solid Bar */}
                  <div className="bg-muted/40 border-b border-primary/10 px-5 py-3 flex items-center justify-between gap-4 border-l-4 border-l-primary">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="w-5 h-5 text-primary" />
                      <p className="text-sm font-black text-foreground uppercase tracking-wider">
                        {format(new Date(b.date), "EEEE, dd MMMM yyyy", {
                          locale: localeId,
                        })}
                      </p>
                    </div>
                    {/* Status Badge pindah ke header */}
                    <StatusBadge status={b.status} />
                  </div>

                  <div className="p-5 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    {/* Detail Informasi */}
                    <div className="space-y-4 flex-1">
                      {/* Waktu & Mode - Gaya Badge Kaku */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                            Waktu (WIB)
                          </span>
                          <span className="text-xs font-mono font-black bg-primary/10 text-primary px-2.5 py-1 rounded-sm border border-primary/20 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            {b.start_time} - {b.end_time}
                          </span>
                        </div>

                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                            Metode Pelaksanaan
                          </span>
                          <span className="text-xs font-bold text-foreground uppercase bg-muted/50 px-2.5 py-1 rounded-sm border border-border flex items-center gap-2">
                            {b.mode === "online" ? (
                              <Video className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <MapPin className="w-3.5 h-3.5 text-amber-600" />
                            )}
                            {b.mode === "online"
                              ? "DARING (ONLINE)"
                              : "LURING (TATAP MUKA)"}
                          </span>
                        </div>
                      </div>

                      {/* Dosen Pembimbing */}
                      <div className="flex items-center gap-2 text-xs pt-1">
                        <UserCheck className="w-4 h-4 text-muted-foreground" />
                        <span className="font-bold text-muted-foreground uppercase tracking-wider">
                          Dosen Pembimbing:
                        </span>
                        <span className="font-black text-foreground uppercase tracking-wide">
                          {b.supervisor_name}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Kontrol Pagination Formal - Box Kaku */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between bg-muted/20 border-2 border-primary/10 p-4 rounded-sm mt-8 gap-4">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                HALAMAN {currentPage} DARI {totalPages}
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-4 rounded-sm shadow-none font-black text-[10px] uppercase tracking-wider border-2 border-border hover:bg-background"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1.5" />
                  SEBELUMNYA
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-4 rounded-sm shadow-none font-black text-[10px] uppercase tracking-wider border-2 border-border hover:bg-background"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  SELANJUTNYA
                  <ChevronRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
