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
  Target,
  PenTool,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useEntityList } from "@/lib/hooks/useEntityList";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

const ITEMS_PER_PAGE = 5;

export default function StudentLogbook() {
  const { data: user } = useCurrentUser();
  const { data: allLogs = [] } = useEntityList("Logbook");

  const baseStudentLogs = allLogs
    .filter((log) => log.student_email === user?.email)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((log, index) => ({
      ...log,
      logNumber: index + 1,
    }));

  const uniqueMonths = Array.from(
    new Set(
      baseStudentLogs.map((log) => format(new Date(log.date), "yyyy-MM")),
    ),
  ).sort((a, b) => b.localeCompare(a));

  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("all");

  const filteredLogs = baseStudentLogs
    .filter((l) => {
      if (dateFilter === "all") return true;
      return format(new Date(l.date), "yyyy-MM") === dateFilter;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentLogs = filteredLogs.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

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
    <div className="space-y-5 max-w-7xl">
      <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">
            Logbook
          </p>
          <h1 className="text-base font-semibold text-foreground">
            Logbook Bimbingan
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-[11px] font-medium text-muted-foreground">
              Filter:
            </span>
          </div>
          <Select value={dateFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px] h-9 rounded text-xs bg-background shadow-none border-border/60 focus:ring-primary/20">
              <SelectValue placeholder="Semua Tanggal" />
            </SelectTrigger>
            <SelectContent className="rounded-md border-border/50 shadow-md">
              <SelectItem value="all" className="text-xs">
                Semua Tanggal
              </SelectItem>
              {uniqueMonths.map((month) => (
                <SelectItem key={month} value={month} className="text-xs">
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
        <EmptyState
          icon={BookOpen}
          title={
            dateFilter === "all"
              ? "Belum ada catatan"
              : "Tidak ada data pada bulan ini"
          }
          description={
            dateFilter === "all"
              ? "Logbook akan terisi secara otomatis setelah sesi bimbingan diselesaikan dan dicatat."
              : "Tidak ada catatan logbook pada periode waktu yang Anda pilih."
          }
        />
      ) : (
        <div className="space-y-4">
          {currentLogs.map((log) => (
            <div
              key={log.id}
              className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary-foreground">
                      {log.logNumber}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      {format(new Date(log.date), "EEEE, dd MMMM yyyy", {
                        locale: localeId,
                      })}
                    </h2>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                      Jurnal Bimbingan
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0">
                  {log.validated_by_supervisor ? (
                    <span className="text-[10px] text-white bg-emerald-500 border border-emerald-600 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Telah Divalidasi
                    </span>
                  ) : (
                    <span className="text-[10px] text-white bg-amber-500 border border-amber-600 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Menunggu Validasi
                    </span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-5">
                {/* Progres Pengerjaan */}
                {log.progress_percentage != null && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-foreground">
                        Progres Pengerjaan
                      </span>
                      <span className="text-xs font-semibold text-primary">
                        {log.progress_percentage}%
                      </span>
                    </div>
                    <Progress
                      value={log.progress_percentage}
                      className="h-2 rounded bg-muted-foreground/10"
                    />
                  </div>
                )}

                {/* Ringkasan & Revisi */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {log.summary && (
                    <div className="space-y-1.5 p-4 rounded bg-muted/30 border border-border/50">
                      <h4 className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                        Ringkasan Bimbingan
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {log.summary}
                      </p>
                    </div>
                  )}

                  {log.revisions && (
                    <div className="space-y-1.5 p-4 rounded bg-destructive/5 border border-destructive/10">
                      <h4 className="text-[11px] font-semibold text-destructive flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5" />
                        Catatan Revisi
                      </h4>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {log.revisions}
                      </p>
                    </div>
                  )}
                </div>

                {/* Target Selanjutnya */}
                {log.next_steps && (
                  <div className="p-4 rounded bg-accent/5 border border-accent/10">
                    <h4 className="text-[11px] font-semibold text-accent-foreground flex items-center gap-1.5 mb-1.5">
                      <Target className="w-3.5 h-3.5" />
                      Target Selanjutnya
                    </h4>
                    <p className="text-sm text-foreground leading-relaxed">
                      {log.next_steps}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-5 py-3.5 flex items-center justify-between">
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
