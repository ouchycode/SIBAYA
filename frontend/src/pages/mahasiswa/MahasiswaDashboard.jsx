import React from "react";
import StatsCard from "@/components/shared/StatsCard";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  ClipboardList,
  CheckCircle,
  Clock,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, startOfDay, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale"; // Import locale Indonesia
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntityList } from "@/lib/hooks/useEntityList";

export default function MahasiswaDashboard() {
  const { data: user } = useCurrentUser();
  const { data: bookingsAll = [] } = useEntityList("Booking");
  const { data: mappings = [] } = useEntityList("Mapping");
  const { data: logsAll = [] } = useEntityList("Logbook");

  const supervisor = mappings.find((m) => m.status === "active");
  const bookings = bookingsAll;
  const logs = logsAll;

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const approvedCount = bookings.filter((b) => b.status === "approved").length;
  const completedCount = bookings.filter(
    (b) => b.status === "completed",
  ).length;

  // PERBAIKAN LOGIKA: Menggunakan startOfDay agar jadwal hari ini tidak hilang
  const today = startOfDay(new Date());

  const upcomingBookings = bookings
    .filter(
      (b) => b.status === "approved" && startOfDay(parseISO(b.date)) >= today,
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date)) // Diurutkan dari yang paling dekat
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Banner Selamat Datang - Solid dan Formal */}
      <div className="bg-card border border-border p-6 rounded-md shadow-sm flex items-center gap-5">
        <div className="hidden sm:flex w-16 h-16 rounded-full bg-accent text-accent-foreground items-center justify-center shrink-0 border-2 border-border overflow-hidden">
          {user?.photo ? (
            <img src={user.photo} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-black">
              {(user?.full_name || "M")[0].toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Selamat Datang, {user?.full_name || "Mahasiswa"}
          </h1>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-sm border border-primary/20 text-sm font-bold text-primary">
            <BookOpen className="w-4 h-4" />
            <span>
              {supervisor
                ? `Dosen Pembimbing: ${supervisor.supervisor_name}`
                : "Belum ada alokasi dosen pembimbing"}
            </span>
          </div>
        </div>
      </div>

      {/* Stats - Memanfaatkan komponen StatsCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Menunggu Persetujuan"
          value={pendingCount}
          icon={Clock}
          color="amber"
        />
        <StatsCard
          title="Bimbingan Disetujui"
          value={approvedCount}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Bimbingan Selesai"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Jadwal Mendatang */}
        <Card className="lg:col-span-2 rounded-md shadow-none border-border bg-card">
          <CardHeader className="pb-3 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                Jadwal Bimbingan Mendatang
              </CardTitle>
              <Link to="/my-bookings">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-bold gap-1 hover:bg-muted rounded-sm h-8 px-2"
                >
                  Lihat Semua <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {upcomingBookings.length === 0 ? (
              <EmptyState
                title="Tidak ada jadwal mendatang"
                description="Anda belum memiliki jadwal bimbingan yang telah disetujui. Silakan ajukan jadwal baru."
              />
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-3.5 rounded-md bg-background border border-border"
                  >
                    <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                      <CalendarDays className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">
                        {format(parseISO(b.date), "EEEE, dd MMMM yyyy", {
                          locale: localeId,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground font-semibold mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {b.start_time} - {b.end_time} WIB
                        <span className="mx-1">•</span>
                        {b.mode === "online"
                          ? "Online (Daring)"
                          : `Offline: ${b.location}`}
                      </p>
                    </div>
                    <div className="pt-2 sm:pt-0 border-t border-border sm:border-0">
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aksi Cepat */}
        <Card className="rounded-md shadow-none border-border bg-card h-fit">
          <CardHeader className="pb-3 border-b border-border bg-muted/30">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              Aksi Cepat
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <Link to="/booking" className="block">
              <div className="flex items-center gap-3 p-3.5 rounded-md border border-border hover:border-primary/40 bg-background transition-none">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Ajukan Booking
                  </p>
                  <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                    Pilih slot waktu dosen
                  </p>
                </div>
              </div>
            </Link>

            <Link to="/logbook" className="block">
              <div className="flex items-center gap-3 p-3.5 rounded-md border border-border hover:border-primary/40 bg-background transition-none">
                <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Lihat Logbook
                  </p>
                  <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                    Catatan dan progres
                  </p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
