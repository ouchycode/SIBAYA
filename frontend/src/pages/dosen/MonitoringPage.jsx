import React, { useState } from "react";
import StatsCard from "@/components/shared/StatsCard";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  AlertCircle,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, subDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntityList } from "@/lib/hooks/useEntityList";
import { cn } from "@/lib/utils";

export default function MonitoringPage() {
  // ==========================================
  // LOGIKA TETAP UTUH (TIDAK ADA YANG DIUBAH)
  // ==========================================
  const { data: user } = useCurrentUser();
  const { data: mappingsAll = [] } = useEntityList("Mapping");
  const { data: bookingsAll = [] } = useEntityList("Booking");
  const { data: logsAll = [] } = useEntityList("Logbook");

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const mappings = mappingsAll.filter((m) => m.status === "active");
  const bookings = bookingsAll;
  const logs = logsAll;
  const thirtyDaysAgo = subDays(new Date(), 30);

  const studentStats = mappings.map((m) => {
    const studentBookings = bookings.filter(
      (b) => b.student_email === m.student_email,
    );
    const studentLogs = logs.filter((l) => l.student_email === m.student_email);
    const completedCount = studentBookings.filter(
      (b) => b.status === "completed",
    ).length;

    const lastLog = studentLogs.sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    )[0];

    const lastBookingDate = studentBookings
      .filter((b) => b.status === "completed")
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.date;

    const isInactive =
      !lastBookingDate || new Date(lastBookingDate) < thirtyDaysAgo;

    const latestProgress = lastLog?.progress_percentage || 0;

    return {
      ...m,
      completedCount,
      lastBookingDate,
      isInactive,
      latestProgress,
    };
  });

  const activeCount = studentStats.filter((s) => !s.isInactive).length;
  const inactiveCount = studentStats.filter((s) => s.isInactive).length;

  const filteredStudents = studentStats.filter((s) => {
    if (statusFilter === "active" && s.isInactive) return false;
    if (statusFilter === "inactive" && !s.isInactive) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchName = (s.student_name || "").toLowerCase().includes(query);
      const matchEmail = (s.student_email || "").toLowerCase().includes(query);
      const matchNim = (s.student_nim || "").toLowerCase().includes(query);

      if (!matchName && !matchEmail && !matchNim) return false;
    }

    return true;
  });

  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  const sortedStudents = [...filteredStudents].sort(
    (a, b) => a.latestProgress - b.latestProgress,
  );

  const totalPages = Math.ceil(sortedStudents.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentStudents = sortedStudents.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  // ==========================================
  // PERUBAHAN PADA UI/UX (FRONTEND KAKU & LEGA)
  // ==========================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Halaman Formal & Lega */}
      <div className="bg-card border border-primary/15 p-6 sm:p-8 rounded-sm shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
        <div className="pl-2">
          <h1 className="text-2xl font-black text-primary uppercase tracking-tight">
            Monitoring Mahasiswa Bimbingan
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-2 border-l-2 border-primary/30 pl-3">
            Pantau progres pengerjaan dan tingkat keaktifan mahasiswa bimbingan
            akademik Anda.
          </p>
        </div>
      </div>

      {/* Cards Statistik - Wrapper tetap ada, isi komponen statscard tidak disentuh */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-6">
        <StatsCard
          title="Total Mahasiswa Bimbingan"
          value={mappings.length}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Mahasiswa Aktif (30 Hari)"
          value={activeCount}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Peringatan Mahasiswa Pasif"
          value={inactiveCount}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Area Filter & Pencarian - Solid & Kotak Kaku */}
      <div className="flex flex-col sm:flex-row gap-4 bg-muted/30 border-2 border-primary/10 p-4 rounded-sm shadow-sm mt-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
          <Input
            placeholder="CARI NAMA, NIM, ATAU EMAIL MAHASISWA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-sm border-2 border-border shadow-none text-xs font-bold uppercase tracking-wider focus-visible:ring-primary/50 bg-background"
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Filter className="w-4 h-4 text-primary hidden sm:block" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-sm border-2 border-border font-bold text-xs uppercase tracking-wider shadow-none bg-background focus:ring-primary/50">
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
                value="active"
                className="text-xs font-bold uppercase tracking-wider focus:bg-primary/10"
              >
                AKTIF (BIMBINGAN)
              </SelectItem>
              <SelectItem
                value="inactive"
                className="text-xs font-bold uppercase tracking-wider focus:bg-destructive/10 text-destructive"
              >
                PASIF (PERINGATAN)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabel Data Mahasiswa */}
      <Card className="rounded-sm border-2 border-primary/10 shadow-sm bg-card mt-6">
        <CardHeader className="pb-4 pt-5 px-6 border-b-2 border-primary/10 bg-muted/40 border-l-4 border-l-primary">
          <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-foreground">
            <TrendingUp className="w-5 h-5 text-primary" />
            Detail Progres Mahasiswa
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredStudents.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={searchQuery || statusFilter !== "all" ? Search : Users}
                title={
                  searchQuery || statusFilter !== "all"
                    ? "TIDAK ADA HASIL PENCARIAN"
                    : "BELUM ADA MAHASISWA"
                }
                description={
                  searchQuery || statusFilter !== "all"
                    ? "Tidak ada mahasiswa bimbingan yang sesuai dengan parameter pencarian atau filter yang Anda terapkan."
                    : "Anda belum memiliki mahasiswa bimbingan yang ditugaskan oleh program studi."
                }
              />
            </div>
          ) : (
            <div className="flex flex-col">
              {currentStudents.map((s, index) => (
                <div
                  key={s.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-6 transition-all",
                    s.isInactive
                      ? "bg-destructive/5 hover:bg-destructive/10 border-l-4 border-l-destructive"
                      : "bg-background hover:bg-muted/30 border-l-4 border-l-transparent",
                    index !== currentStudents.length - 1 &&
                      "border-b border-border/60",
                  )}
                >
                  <div className="flex items-start gap-4 w-full sm:w-1/2">
                    {/* Avatar Inisial */}
                    <div
                      className={cn(
                        "w-12 h-12 rounded-sm flex items-center justify-center shrink-0 border shadow-inner mt-1",
                        s.isInactive
                          ? "bg-destructive/10 border-destructive/20 text-destructive"
                          : "bg-primary/10 border-primary/20 text-primary",
                      )}
                    >
                      <span className="text-lg font-black uppercase">
                        {(s.student_name || "?")[0]}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-sm text-foreground uppercase tracking-wide truncate">
                          {s.student_name}
                        </p>
                        {s.isInactive && (
                          <Badge
                            variant="outline"
                            className="bg-destructive/10 text-destructive border-destructive/30 gap-1 rounded-sm font-black uppercase tracking-widest text-[9px] px-2 py-0.5"
                          >
                            <AlertCircle className="w-3 h-3" /> PASIF (30 HARI)
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-2 py-0.5 rounded-sm border border-border inline-block">
                        {s.student_nim || "NIM TIDAK TERSEDIA"}
                      </p>
                      {s.thesis_title && (
                        <div className="mt-2.5 p-3 bg-card border border-border rounded-sm">
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 border-b border-border/50 pb-1.5 mb-1.5">
                            <BookOpen className="w-3 h-3" /> Topik Bimbingan
                          </p>
                          <p className="text-xs font-semibold text-foreground leading-snug">
                            "{s.thesis_title}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Area Progress Bar & Statistik */}
                  <div
                    className={cn(
                      "w-full sm:w-1/3 shrink-0 flex flex-col justify-center p-4 rounded-sm border-2",
                      s.isInactive
                        ? "bg-background border-destructive/20"
                        : "bg-card border-border shadow-sm",
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 mb-2.5">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Progres Pengerjaan
                      </span>
                      <span
                        className={cn(
                          "text-xs font-black px-2 py-0.5 rounded-sm border",
                          s.isInactive
                            ? "text-destructive bg-destructive/10 border-destructive/20"
                            : "text-primary bg-primary/10 border-primary/20",
                        )}
                      >
                        {s.latestProgress}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-muted rounded-sm overflow-hidden mb-3">
                      <div
                        className={cn(
                          "h-full",
                          s.isInactive ? "bg-destructive" : "bg-primary",
                        )}
                        style={{ width: `${s.latestProgress}%` }}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-t border-border/50 pt-2.5">
                      <div className="flex justify-between items-center">
                        <span>Total Sesi:</span>
                        <span className="text-foreground">
                          {s.completedCount} Sesi Selesai
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Terakhir:</span>
                        <span
                          className={cn(
                            s.isInactive
                              ? "text-destructive"
                              : "text-foreground",
                          )}
                        >
                          {s.lastBookingDate
                            ? format(
                                new Date(s.lastBookingDate),
                                "dd MMM yyyy",
                                { locale: localeId },
                              )
                            : "BELUM PERNAH"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
