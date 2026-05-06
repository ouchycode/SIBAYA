import React, { useState } from "react";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  CheckCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
  CalendarDays,
  Clock,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale"; // Import untuk format tanggal Indonesia
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntityList } from "@/lib/hooks/useEntityList";

const ITEMS_PER_PAGE = 5;

export default function StudentLogbook() {
  const { data: user } = useCurrentUser();
  const { data: allLogs = [] } = useEntityList("Logbook");

  // Ambil semua log milik mahasiswa ini, lalu urutkan dari yang TERLAMA ke TERBARU
  // untuk memberikan nomor urut absolut (Jurnal #1, #2, dst.)
  const baseStudentLogs = allLogs
    .filter((l) => l.student_email === user?.email)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((log, index) => ({
      ...log,
      logNumber: index + 1, // Nomor jurnal absolut yang tidak akan berubah
    }));

  // Ekstrak bulan & tahun unik untuk dropdown (format: YYYY-MM)
  const uniqueMonths = Array.from(
    new Set(
      baseStudentLogs.map((log) => format(new Date(log.date), "yyyy-MM")),
    ),
  ).sort((a, b) => b.localeCompare(a)); // Urutkan bulan dari yang terbaru

  // State untuk Pagination & Filter
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("all");

  // ==============================================================
  // LOGIKA FILTER TANGGAL & PENGURUTAN (TERBARU KE TERLAMA)
  // ==============================================================
  const filteredLogs = baseStudentLogs
    .filter((l) => {
      if (dateFilter === "all") return true;
      return format(new Date(l.date), "yyyy-MM") === dateFilter;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Balik urutan untuk tampilan (Terbaru di atas)

  // Logika Pagination
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentLogs = filteredLogs.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  // Jika filter diubah, reset ke halaman 1
  const handleFilterChange = (val) => {
    setDateFilter(val);
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
            Logbook Bimbingan
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Buku catatan resmi hasil bimbingan dan pemantauan progres pengerjaan
            Anda.
          </p>
        </div>

        {/* Dropdown Filter Tanggal (Bulan/Tahun) */}
        <div className="flex items-center gap-2 shrink-0">
          <CalendarDays className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <Select value={dateFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px] h-9 rounded-sm border-border font-medium text-xs shadow-none">
              <SelectValue placeholder="Semua Tanggal" />
            </SelectTrigger>
            <SelectContent className="rounded-sm border-border">
              <SelectItem value="all" className="text-xs font-bold">
                Semua Tanggal
              </SelectItem>
              {uniqueMonths.map((month) => (
                <SelectItem
                  key={month}
                  value={month}
                  className="text-xs font-medium"
                >
                  {format(parseISO(`${month}-01`), "MMMM yyyy", {
                    locale: localeId,
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="border border-border rounded-md bg-card">
          <EmptyState
            icon={BookOpen}
            title={
              dateFilter === "all" ? "Belum Ada Catatan" : "Tidak Ada Data"
            }
            description={
              dateFilter === "all"
                ? "Logbook akan terisi secara otomatis setelah sesi bimbingan diselesaikan dan dicatat."
                : "Tidak ada catatan logbook pada bulan yang dipilih."
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-4">
            {currentLogs.map((log) => (
              <Card
                key={log.id}
                className="rounded-md border border-border shadow-none bg-card overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Header Logbook Card */}
                  <div className="bg-muted/30 border-b border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-primary text-primary-foreground flex items-center justify-center font-black border border-primary-foreground/20 shadow-sm shrink-0">
                        {/* Memanggil logNumber absolut yang sudah kita set di atas */}
                        #{log.logNumber}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground uppercase tracking-wide">
                          {format(new Date(log.date), "EEEE, dd MMMM yyyy", {
                            locale: localeId,
                          })}
                        </p>
                        <p className="text-xs font-medium text-muted-foreground mt-0.5 flex items-center gap-1">
                          <FileText className="w-3 h-3" /> Jurnal Bimbingan
                        </p>
                      </div>
                    </div>

                    {log.validated_by_supervisor ? (
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-300 gap-1.5 px-2.5 py-1 rounded-sm font-bold uppercase tracking-wider text-[10px]"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Telah Divalidasi
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700 border-amber-300 gap-1.5 px-2.5 py-1 rounded-sm font-bold uppercase tracking-wider text-[10px]"
                      >
                        <Clock className="w-3.5 h-3.5" /> Menunggu Validasi
                      </Badge>
                    )}
                  </div>

                  {/* Body Logbook Card */}
                  <div className="p-5 space-y-5">
                    {log.progress_percentage != null && (
                      <div className="bg-muted/30 p-3 rounded-md border border-border/50">
                        <div className="flex justify-between items-center text-xs mb-2">
                          <span className="font-bold text-foreground uppercase tracking-wide">
                            Progres Pengerjaan
                          </span>
                          <span className="font-black text-primary bg-primary/10 px-2 py-0.5 rounded-sm border border-primary/20">
                            {log.progress_percentage}%
                          </span>
                        </div>
                        <Progress
                          value={log.progress_percentage}
                          className="h-2.5 rounded-sm bg-muted-foreground/20"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {log.summary && (
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            Ringkasan Bimbingan
                          </h4>
                          <p className="text-sm text-foreground leading-relaxed text-justify">
                            {log.summary}
                          </p>
                        </div>
                      )}

                      {log.revisions && (
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            Catatan Revisi
                          </h4>
                          <p className="text-sm text-foreground leading-relaxed text-justify">
                            {log.revisions}
                          </p>
                        </div>
                      )}
                    </div>

                    {log.next_steps && (
                      <div className="pt-2">
                        <div className="p-3 rounded-md bg-accent/5 border border-accent/20">
                          <h4 className="text-xs font-bold text-accent-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                            Target / Langkah Selanjutnya
                          </h4>
                          <p className="text-sm font-medium text-foreground">
                            {log.next_steps}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Kontrol Pagination Formal */}
          {totalPages > 1 && (
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
          )}
        </div>
      )}
    </div>
  );
}
