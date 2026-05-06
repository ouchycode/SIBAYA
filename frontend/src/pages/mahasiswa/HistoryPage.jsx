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
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntityList } from "@/lib/hooks/useEntityList";

const ITEMS_PER_PAGE = 5;

export default function HistoryPage() {
  const { data: user } = useCurrentUser();
  const { data: allBookings = [] } = useEntityList("Booking");

  // State untuk Pagination dan Filter
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  // ==============================================================
  // LOGIKA PENGURUTAN & FILTER DATA KHUSUS RIWAYAT
  // ==============================================================
  const bookings = allBookings
    .filter((b) => {
      // 1. Pastikan milik mahasiswa ini
      if (b.student_email !== user?.email) return false;

      // 2. Pastikan statusnya adalah status "Riwayat" (bukan aktif)
      const isHistoryStatus = ["completed", "rejected", "cancelled"].includes(
        b.status,
      );
      if (!isHistoryStatus) return false;

      // 3. Terapkan filter dari dropdown jika tidak "all"
      if (statusFilter !== "all" && b.status !== statusFilter) return false;

      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Diurutkan dari yang terbaru

  // Logika Pagination (Harus dihitung setelah array di-filter)
  const totalPages = Math.ceil(bookings.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentBookings = bookings.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  // Jika filter berubah, kembalikan ke halaman 1
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

  return (
    <div className="space-y-6">
      {/* Header Halaman Formal & Filter Bar */}
      <div className="bg-card border border-border p-5 rounded-md shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Riwayat Bimbingan
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Rekam jejak aktivitas bimbingan yang telah selesai, ditolak, atau
            dibatalkan.
          </p>
        </div>

        {/* Dropdown Filter Status */}
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <Select value={statusFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px] h-9 rounded-sm border-border font-medium text-xs shadow-none">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent className="rounded-sm border-border">
              <SelectItem value="all" className="text-xs font-bold">
                Semua Status
              </SelectItem>
              <SelectItem value="completed" className="text-xs font-medium">
                Selesai
              </SelectItem>
              <SelectItem value="rejected" className="text-xs font-medium">
                Ditolak
              </SelectItem>
              <SelectItem value="cancelled" className="text-xs font-medium">
                Dibatalkan
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="border border-border rounded-md bg-card">
          <EmptyState
            icon={History}
            title={
              statusFilter === "all" ? "Belum Ada Riwayat" : "Tidak Ada Data"
            }
            description={
              statusFilter === "all"
                ? "Belum ada riwayat bimbingan yang tercatat di sistem."
                : "Tidak ada riwayat bimbingan dengan status tersebut."
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Daftar Riwayat yang Ditampilkan per Halaman */}
          <div className="space-y-3">
            {currentBookings.map((b) => (
              <Card
                key={b.id}
                className="rounded-md border border-border shadow-none bg-card"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                    <div className="flex items-start sm:items-center gap-4">
                      {/* Ikon Kotak Solid */}
                      <div className="w-12 h-12 rounded bg-muted border border-border flex items-center justify-center shrink-0">
                        <CalendarDays className="w-5 h-5 text-muted-foreground" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">
                          {format(new Date(b.date), "dd MMMM yyyy", {
                            locale: localeId,
                          })}
                        </p>

                        {/* Badge Atribut dengan gaya formal */}
                        <div className="flex flex-wrap items-center gap-3 mt-1.5">
                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-sm border border-border/50">
                            <Clock className="w-3.5 h-3.5" />
                            {b.start_time} - {b.end_time} WIB
                          </span>
                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-sm border border-border/50">
                            {b.mode === "online" ? (
                              <Video className="w-3.5 h-3.5" />
                            ) : (
                              <MapPin className="w-3.5 h-3.5" />
                            )}
                            {b.mode === "online"
                              ? "Online (Daring)"
                              : "Offline (Tatap Muka)"}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-foreground mt-2">
                          Dosen:{" "}
                          <span className="font-bold">{b.supervisor_name}</span>
                        </p>
                      </div>
                    </div>

                    {/* Status Badge di sebelah kanan */}
                    <div className="flex items-center justify-start sm:justify-end border-t border-border sm:border-0 pt-3 sm:pt-0 mt-2 sm:mt-0 w-full sm:w-auto">
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Kontrol Pagination Formal */}
          <div className="flex items-center justify-between bg-card border border-border p-3 rounded-md shadow-sm mt-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Halaman {currentPage} dari {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 rounded-sm shadow-none font-bold text-xs"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 rounded-sm shadow-none font-bold text-xs"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
