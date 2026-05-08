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
  User,
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
import { Skeleton } from "@/components/ui/skeleton";

export default function MonitoringPage() {
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const { data: mappingsAll = [], isLoading: isMappingsLoading } =
    useEntityList("Mapping");
  const { data: bookingsAll = [], isLoading: isBookingsLoading } =
    useEntityList("Booking");
  const { data: logsAll = [], isLoading: isLogsLoading } =
    useEntityList("Logbook");

  const isDataLoading =
    isUserLoading || isMappingsLoading || isBookingsLoading || isLogsLoading;

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  if (isDataLoading) {
    return (
      <div className="space-y-5 max-w-7xl mx-auto pb-10">
        <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5">
          <Skeleton className="h-3 w-32 mb-1.5" />
          <Skeleton className="h-5 w-56" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card rounded-md p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
            >
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4 flex gap-3 mt-4">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-44" />
        </div>
        <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-border/50 overflow-hidden mt-4">
          <div className="px-5 py-4 border-b border-border/50">
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="divide-y divide-border/50">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 flex flex-col sm:flex-row justify-between gap-6"
              >
                <div className="flex gap-4 flex-1">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div className="w-full sm:w-1/3 p-4 space-y-3 border border-border/50 rounded">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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

  const sortedStudents = [...filteredStudents].sort(
    (a, b) => a.latestProgress - b.latestProgress,
  );

  const totalPages = Math.ceil(sortedStudents.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentStudents = sortedStudents.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Header Halaman */}
      <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1">
          Laporan & Analitik
        </p>
        <h1 className="text-base font-semibold text-foreground">
          Monitoring Mahasiswa Bimbingan
        </h1>
      </div>

      {/* Cards Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <StatsCard
          title="Total Bimbingan"
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
          title="Peringatan Pasif"
          value={inactiveCount}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Area Filter & Pencarian */}
      <div className="flex flex-col sm:flex-row gap-3 bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4 mt-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, NIM, atau email mahasiswa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 rounded text-sm shadow-none border-border/60 focus-visible:ring-primary/50"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-9 rounded text-sm shadow-none border-border/60 focus:ring-primary/50">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent className="rounded-md border border-border shadow-md">
              <SelectItem value="all" className="text-sm">
                Semua Status
              </SelectItem>
              <SelectItem value="active" className="text-sm">
                Aktif Bimbingan
              </SelectItem>
              <SelectItem
                value="inactive"
                className="text-sm text-destructive focus:text-destructive"
              >
                Pasif (Peringatan)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabel Data Mahasiswa */}
      <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] mt-4 overflow-hidden border border-border/50">
        <div className="px-5 py-4 border-b border-border/50 bg-muted/10">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Detail Progres Mahasiswa
          </h3>
        </div>
        <div>
          {filteredStudents.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={searchQuery || statusFilter !== "all" ? Search : Users}
                title={
                  searchQuery || statusFilter !== "all"
                    ? "Tidak ada hasil pencarian"
                    : "Belum ada mahasiswa"
                }
                description={
                  searchQuery || statusFilter !== "all"
                    ? "Tidak ada mahasiswa bimbingan yang sesuai dengan parameter pencarian atau filter yang Anda terapkan."
                    : "Anda belum memiliki mahasiswa bimbingan yang ditugaskan oleh program studi."
                }
              />
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border/50">
              {currentStudents.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-6 transition-all",
                    s.isInactive
                      ? "bg-destructive/5 hover:bg-destructive/10"
                      : "bg-background hover:bg-muted/20",
                  )}
                >
                  <div className="flex items-start gap-4 w-full sm:w-1/2">
                    {/* Avatar Inisial */}
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                        s.isInactive
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      <span className="text-base font-bold uppercase">
                        {(s.student_name || "?")[0]}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {s.student_name}
                        </p>
                        {s.isInactive && (
                          <Badge
                            variant="outline"
                            className="bg-destructive/10 text-destructive border-0 gap-1 rounded font-medium text-[10px] px-2 py-0.5"
                          >
                            <AlertCircle className="w-3 h-3" /> Pasif (30 Hari)
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {s.student_nim || "NIM Tidak Tersedia"}
                      </p>
                      {s.thesis_title && (
                        <div className="mt-2.5">
                          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 mb-1">
                            <BookOpen className="w-3 h-3" /> Topik Bimbingan
                          </p>
                          <p className="text-xs font-medium text-foreground leading-snug">
                            "{s.thesis_title}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Area Progress Bar & Statistik */}
                  <div
                    className={cn(
                      "w-full sm:w-1/3 shrink-0 flex flex-col justify-center p-4 rounded border border-border/50",
                      s.isInactive ? "bg-background" : "bg-muted/10",
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                        Progres
                      </span>
                      <span
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded",
                          s.isInactive
                            ? "text-destructive bg-destructive/10"
                            : "text-primary bg-primary/10",
                        )}
                      >
                        {s.latestProgress}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-3">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          s.isInactive ? "bg-destructive" : "bg-primary",
                        )}
                        style={{ width: `${s.latestProgress}%` }}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-xs text-muted-foreground border-t border-border/50 pt-2.5 mt-2.5">
                      <div className="flex justify-between items-center">
                        <span>Total Sesi:</span>
                        <span className="text-foreground font-medium">
                          {s.completedCount} Sesi Selesai
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Terakhir:</span>
                        <span
                          className={cn(
                            s.isInactive
                              ? "text-destructive font-semibold"
                              : "text-foreground font-medium",
                          )}
                        >
                          {s.lastBookingDate
                            ? format(
                                new Date(s.lastBookingDate),
                                "dd MMM yyyy",
                                { locale: localeId },
                              )
                            : "Belum Pernah"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Kontrol Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-3.5 border border-border/50 rounded-md flex items-center justify-between bg-card mt-4">
          <p className="text-xs text-muted-foreground">
            Halaman {currentPage} dari {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 rounded text-xs shadow-none border-border/60 hover:bg-muted/40"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 rounded text-xs shadow-none border-border/60 hover:bg-muted/40"
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
  );
}
