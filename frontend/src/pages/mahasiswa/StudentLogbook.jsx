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

const ITEMS_PER_PAGE = 5;

export default function StudentLogbook() {
  const { data: allLogs = [] } = useEntityList("Logbook");

  const baseStudentLogs = allLogs
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
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="bg-card border border-primary/15 p-6 sm:p-8 rounded-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
        <div className="pl-2">
          <h1 className="text-2xl font-black text-primary uppercase tracking-tight">
            Logbook Bimbingan
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-2 border-l-2 border-primary/30 pl-3">
            Buku catatan resmi hasil bimbingan dan pemantauan progres pengerjaan
            Anda.
          </p>
        </div>

        {/* Dropdown Filter Tanggal (Bulan/Tahun) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 bg-muted/30 p-3 rounded-sm border border-border">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Filter:
            </span>
          </div>
          <Select value={dateFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-sm border-2 border-border font-bold text-xs uppercase tracking-wider shadow-none focus:ring-primary/50">
              <SelectValue placeholder="SEMUA TANGGAL" />
            </SelectTrigger>
            <SelectContent className="rounded-sm border-2 border-border shadow-md">
              <SelectItem
                value="all"
                className="text-xs font-bold uppercase tracking-wider focus:bg-primary/10"
              >
                SEMUA TANGGAL
              </SelectItem>
              {uniqueMonths.map((month) => (
                <SelectItem
                  key={month}
                  value={month}
                  className="text-xs font-bold uppercase tracking-wider focus:bg-primary/10"
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
        <div className="border border-border rounded-sm bg-card mt-6">
          <EmptyState
            icon={BookOpen}
            title={
              dateFilter === "all"
                ? "BELUM ADA CATATAN"
                : "TIDAK ADA DATA PADA BULAN INI"
            }
            description={
              dateFilter === "all"
                ? "Logbook akan terisi secara otomatis setelah sesi bimbingan diselesaikan dan dicatat."
                : "Tidak ada catatan logbook pada periode waktu yang Anda pilih."
            }
          />
        </div>
      ) : (
        <div className="space-y-6 mt-6">
          <div className="space-y-6">
            {currentLogs.map((log) => (
              <Card
                key={log.id}
                className="rounded-sm border-2 border-primary/10 shadow-sm bg-card overflow-hidden transition-all hover:border-primary/30"
              >
                <CardContent className="p-0">
                  {/* Header Logbook Card - Solid Bar */}
                  <div className="bg-muted/40 border-b-2 border-primary/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-primary">
                    <div className="flex items-center gap-4">
                      {/* Kotak Nomor Jurnal */}
                      <div className="w-12 h-12 rounded-sm bg-primary text-primary-foreground flex flex-col items-center justify-center border border-primary-foreground/20 shadow-inner shrink-0">
                        <span className="text-[9px] font-black uppercase tracking-widest leading-none opacity-80 mb-0.5">
                          Vol
                        </span>
                        <span className="text-lg font-black leading-none">
                          {log.logNumber}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground uppercase tracking-wider">
                          {format(new Date(log.date), "EEEE, dd MMMM yyyy", {
                            locale: localeId,
                          })}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 flex items-center gap-1.5 bg-background px-2 py-0.5 rounded-sm border border-border w-fit">
                          <FileText className="w-3 h-3" /> JURNAL BIMBINGAN
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0">
                      {log.validated_by_supervisor ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-300 gap-1.5 px-3 py-1.5 rounded-sm font-black uppercase tracking-widest text-[10px]"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> TELAH
                          DIVALIDASI
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-300 gap-1.5 px-3 py-1.5 rounded-sm font-black uppercase tracking-widest text-[10px]"
                        >
                          <Clock className="w-3.5 h-3.5" /> MENUNGGU VALIDASI
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Body Logbook Card - Diberi padding luas */}
                  <div className="p-6 space-y-6">
                    {/* Progres Pengerjaan - Kotak Kaku */}
                    {log.progress_percentage != null && (
                      <div className="bg-background border-2 border-border p-4 rounded-sm">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                            Progres Pengerjaan
                          </span>
                          <span className="font-black text-primary bg-primary/10 px-3 py-1 rounded-sm border border-primary/20 text-xs">
                            {log.progress_percentage}%
                          </span>
                        </div>
                        <Progress
                          value={log.progress_percentage}
                          className="h-3 rounded-sm bg-muted-foreground/20"
                        />
                      </div>
                    )}

                    {/* Ringkasan & Revisi - Grid Tabular */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {log.summary && (
                        <div className="space-y-2 border border-border rounded-sm p-4 bg-muted/10">
                          <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-2 border-b border-border/50 pb-2 mb-2">
                            <div className="w-2 h-2 rounded-none bg-primary" />
                            Ringkasan Bimbingan
                          </h4>
                          <p className="text-sm text-muted-foreground font-medium leading-relaxed text-justify whitespace-pre-wrap">
                            {log.summary}
                          </p>
                        </div>
                      )}

                      {log.revisions && (
                        <div className="space-y-2 border border-destructive/20 rounded-sm p-4 bg-destructive/5">
                          <h4 className="text-[10px] font-black text-destructive uppercase tracking-widest flex items-center gap-2 border-b border-destructive/20 pb-2 mb-2">
                            <PenTool className="w-3 h-3" />
                            Catatan Revisi
                          </h4>
                          <p className="text-sm text-foreground font-medium leading-relaxed text-justify whitespace-pre-wrap">
                            {log.revisions}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Target Selanjutnya - Aksen Banner */}
                    {log.next_steps && (
                      <div className="pt-2">
                        <div className="p-4 rounded-sm bg-accent/5 border-2 border-accent/20">
                          <h4 className="text-[10px] font-black text-accent-foreground uppercase tracking-widest flex items-center gap-2 mb-2">
                            <Target className="w-3.5 h-3.5" />
                            Target / Langkah Selanjutnya
                          </h4>
                          <p className="text-sm font-semibold text-foreground leading-relaxed">
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
