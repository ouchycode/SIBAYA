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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, subDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntityList } from "@/lib/hooks/useEntityList";

export default function MonitoringPage() {
  const { data: user } = useCurrentUser();
  const { data: mappingsAll = [] } = useEntityList("Mapping");
  const { data: bookingsAll = [] } = useEntityList("Booking");
  const { data: logsAll = [] } = useEntityList("Logbook");

  // State untuk Filter & Pencarian
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const mappings = mappingsAll.filter((m) => m.status === "active");
  const bookings = bookingsAll;
  const logs = logsAll;
  const thirtyDaysAgo = subDays(new Date(), 30);

  // Kalkulasi Statistik Utama (Tetap utuh seperti aslinya)
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

  // ==============================================================
  // LOGIKA FILTER DAN PENCARIAN (Hanya mempengaruhi daftar di bawah)
  // ==============================================================
  const filteredStudents = studentStats.filter((s) => {
    // 1. Filter Status (Aktif/Pasif)
    if (statusFilter === "active" && s.isInactive) return false;
    if (statusFilter === "inactive" && !s.isInactive) return false;

    // 2. Filter Pencarian Teks (Nama atau NIM/Email)
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

  // Reset page when filter or search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  const sortedStudents = [...filteredStudents].sort(
    (a, b) => a.latestProgress - b.latestProgress,
  );

  const totalPages = Math.ceil(sortedStudents.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentStudents = sortedStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header Halaman Formal */}
      <div className="bg-card border border-border p-5 rounded-md shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">
          Monitoring Mahasiswa Bimbingan
        </h1>
        <p className="text-sm font-medium text-muted-foreground mt-1">
          Pantau progres pengerjaan dan keaktifan mahasiswa bimbingan Anda.
        </p>
      </div>

      {/* Cards Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Area Filter & Pencarian */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, NIM, atau email mahasiswa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-sm border-border shadow-none text-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-sm border-border font-medium text-xs shadow-none">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent className="rounded-sm border-border">
              <SelectItem value="all" className="text-xs font-bold">
                Semua Status
              </SelectItem>
              <SelectItem value="active" className="text-xs font-medium">
                Aktif
              </SelectItem>
              <SelectItem
                value="inactive"
                className="text-xs font-medium text-destructive"
              >
                Pasif (Peringatan)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="rounded-md border border-border shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border bg-muted/30">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Detail Progres Mahasiswa
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredStudents.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={searchQuery || statusFilter !== "all" ? Search : Users}
                title={
                  searchQuery || statusFilter !== "all"
                    ? "Tidak ada hasil"
                    : "Belum ada mahasiswa"
                }
                description={
                  searchQuery || statusFilter !== "all"
                    ? "Tidak ada mahasiswa bimbingan yang sesuai dengan pencarian atau filter Anda."
                    : "Anda belum memiliki mahasiswa bimbingan yang ditugaskan."
                }
              />
            </div>
          ) : (
            <div className="flex flex-col">
              {currentStudents
                .map((s, index) => (
                  <div
                    key={s.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 transition-none ${
                      index !== currentStudents.length - 1
                        ? "border-b border-border/60"
                        : ""
                    } ${s.isInactive ? "bg-red-50/30" : "hover:bg-muted/30"}`}
                  >
                    <div className="flex items-center gap-4 w-full sm:w-1/2">
                      {/* Avatar Inisial */}
                      <div
                        className={`w-10 h-10 rounded flex items-center justify-center shrink-0 border ${
                          s.isInactive
                            ? "bg-red-100 border-red-200 text-red-700"
                            : "bg-primary/10 border-primary/20 text-primary"
                        }`}
                      >
                        <span className="text-sm font-black">
                          {(s.student_name || "?")[0].toUpperCase()}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-foreground truncate">
                            {s.student_name}
                          </p>
                          {s.isInactive && (
                            <Badge
                              variant="outline"
                              className="bg-red-50 text-red-700 border-red-300 gap-1 rounded-sm font-bold uppercase tracking-wider text-[9px] px-1.5 py-0"
                            >
                              <AlertCircle className="w-3 h-3" /> Pasif
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs font-medium text-muted-foreground mt-0.5">
                          {s.student_nim || s.student_email}
                        </p>
                        {s.thesis_title && (
                          <p className="text-xs font-semibold text-foreground mt-1.5 truncate border-l-2 border-primary/40 pl-2">
                            "{s.thesis_title}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Area Progress Bar & Statistik */}
                    <div className="w-full sm:w-1/3 shrink-0 flex flex-col justify-center">
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                          Progres
                        </span>
                        <span className="text-xs font-black text-primary">
                          {s.latestProgress}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-sm overflow-hidden mb-2">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${s.latestProgress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground border-t border-border/50 pt-1">
                        <span>{s.completedCount} Sesi Selesai</span>
                        <span>
                          {s.lastBookingDate
                            ? `Terakhir: ${format(new Date(s.lastBookingDate), "dd MMM yyyy", { locale: localeId })}`
                            : "Belum Pernah"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

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
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 rounded-sm shadow-none font-bold text-xs"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Selanjutnya
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
