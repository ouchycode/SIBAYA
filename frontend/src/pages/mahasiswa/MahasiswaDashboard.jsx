import React from "react";
import StatsCard from "@/components/shared/StatsCard";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import {
  CalendarDays,
  ClipboardList,
  CheckCircle,
  Clock,
  BookOpen,
  ArrowRight,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, startOfDay, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntityList } from "@/lib/hooks/useEntityList";
import { Skeleton } from "@/components/ui/skeleton";

export default function MahasiswaDashboard() {
  const { data: user } = useCurrentUser();
  const { data: bookingsAll = [], isLoading: isLoadingBookings } =
    useEntityList("Booking");
  const { data: mappings = [], isLoading: isLoadingMappings } =
    useEntityList("Mapping");
  const { data: logsAll = [], isLoading: isLoadingLogs } =
    useEntityList("Logbook");

  const isDataLoading = isLoadingBookings || isLoadingMappings || isLoadingLogs;

  const supervisor = mappings.find(
    (m) => m.status === "active" && m.student_email === user?.email,
  );
  const bookings = bookingsAll.filter((b) => b.student_email === user?.email);
  const logs = logsAll.filter((l) => l.student_email === user?.email);

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const approvedCount = bookings.filter((b) => b.status === "approved").length;
  const completedCount = bookings.filter(
    (b) => b.status === "completed",
  ).length;

  const today = startOfDay(new Date());

  const upcomingBookings = bookings
    .filter(
      (b) => b.status === "approved" && startOfDay(parseISO(b.date)) >= today,
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  if (isDataLoading) {
    return (
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="bg-card rounded-md p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-4">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-card rounded-md p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-border/50"
            >
              <Skeleton className="h-8 w-8 rounded-full mb-3" />
              <Skeleton className="h-6 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50">
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="divide-y divide-border/40">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-5">
                  <Skeleton className="h-10 w-10 rounded-md shrink-0" />
                  <div className="w-px h-8 bg-border/50 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] h-[250px] p-5 space-y-4">
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-card rounded-md p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1">
          Portal Mahasiswa
        </p>
        <h1 className="text-lg font-semibold text-foreground">
          {user?.full_name || "Mahasiswa Terdaftar"}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <span className="font-mono text-xs bg-muted text-foreground px-2 py-0.5 rounded">
            {user?.nim || "—"}
          </span>
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {supervisor
              ? supervisor.supervisor_name
              : "Belum ada dosen pembimbing"}
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard
          title="Menunggu"
          value={pendingCount}
          icon={Clock}
          color="amber"
        />
        <StatsCard
          title="Disetujui"
          value={approvedCount}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Selesai"
          value={completedCount}
          icon={ClipboardList}
          color="blue"
        />
        <StatsCard
          title="Total Logbook"
          value={logs.length}
          icon={BookOpen}
          color="purple"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Jadwal Mendatang */}
        <div className="lg:col-span-2 bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Jadwal Mendatang
              </h2>
            </div>
            <Link
              to="/my-bookings"
              className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
            >
              Lihat semua <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-border/40">
            {upcomingBookings.length === 0 ? (
              <EmptyState
                title="Tidak ada jadwal mendatang"
                description="Belum ada jadwal bimbingan yang disetujui."
              />
            ) : (
              upcomingBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-4 px-5 py-5 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none">
                      {format(parseISO(b.date), "MMM", { locale: localeId })}
                    </p>
                    <p className="text-xl font-semibold text-foreground leading-tight">
                      {format(parseISO(b.date), "dd")}
                    </p>
                  </div>

                  <div className="w-px h-8 bg-border/50 flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {format(parseISO(b.date), "EEEE, dd MMMM yyyy", {
                        locale: localeId,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {b.start_time} – {b.end_time} ·{" "}
                      {b.mode === "online" ? "Online" : b.location}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    <StatusBadge status={b.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Aksi Cepat */}
        <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden h-fit">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50">
            <ClipboardList className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              Aksi Cepat
            </h2>
          </div>

          <div className="p-4 space-y-1.5">
            <Link to="/booking" className="block">
              <div className="flex items-center gap-3 p-4 rounded hover:bg-muted/60 transition-colors group">
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center flex-shrink-0">
                  <CalendarDays className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Ajukan Bimbingan
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Buat jadwal baru
                  </p>
                </div>
              </div>
            </Link>

            <Link to="/logbook" className="block">
              <div className="flex items-center gap-3 p-4 rounded hover:bg-muted/60 transition-colors group">
                <div className="w-8 h-8 rounded bg-accent flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Isi Logbook
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Catat progres harian
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
