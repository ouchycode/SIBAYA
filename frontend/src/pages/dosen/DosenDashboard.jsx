import React from "react";
import StatsCard from "@/components/shared/StatsCard";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  CalendarDays,
  Clock,
  CheckCircle,
  ClipboardList,
  ArrowRight,
  AlertTriangle,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, subDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntityList } from "@/lib/hooks/useEntityList";

export default function DosenDashboard() {
  // ==========================================
  // LOGIKA TETAP UTUH (TIDAK ADA YANG DIUBAH)
  // ==========================================
  const { data: user } = useCurrentUser();
  const { data: mappingsAll = [] } = useEntityList("Mapping");
  const { data: bookingsAll = [] } = useEntityList("Booking");

  const mappings = mappingsAll.filter((m) => m.status === "active");
  const bookings = bookingsAll;

  const pendingRequests = bookings.filter((b) => b.status === "pending");
  const todayBookings = bookings.filter(
    (b) =>
      b.status === "approved" && b.date === format(new Date(), "yyyy-MM-dd"),
  );
  const totalCompleted = bookings.filter(
    (b) => b.status === "completed",
  ).length;

  const thirtyDaysAgo = subDays(new Date(), 30);
  const studentLastBooking = {};
  bookings
    .filter((b) => b.status === "completed")
    .forEach((b) => {
      if (
        !studentLastBooking[b.student_email] ||
        new Date(b.date) > new Date(studentLastBooking[b.student_email])
      ) {
        studentLastBooking[b.student_email] = b.date;
      }
    });

  const inactiveStudents = mappings.filter(
    (m) =>
      !studentLastBooking[m.student_email] ||
      new Date(studentLastBooking[m.student_email]) < thirtyDaysAgo,
  );

  // ==========================================
  // PERUBAHAN PADA UI/UX (FRONTEND KAKU & LEGA)
  // ==========================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Banner Selamat Datang - Identitas Dosen Formal */}
      <div className="bg-card border-2 border-primary/10 rounded-sm shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 relative overflow-hidden">
        {/* Ornamen aksen kaku di kanan */}
        <div className="absolute right-0 top-0 bottom-0 w-2 bg-primary/20" />

        <div className="flex-1 space-y-1.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">
            Portal Dosen Pembimbing
          </p>
          <h1 className="text-xl font-black text-foreground uppercase tracking-tight">
            {user?.full_name || "Dosen Terdaftar"}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
              <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-sm border border-primary/20 font-mono font-bold tracking-widest">
                {user?.nip || "NIP TIDAK TERSEDIA"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              <span>TOTAL {mappings.length} MAHASISWA BIMBINGAN AKTIF</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Komponen StatsCard dibungkus agar solid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Mahasiswa Bimbingan"
          value={mappings.length}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Permintaan Masuk"
          value={pendingRequests.length}
          icon={ClipboardList}
          color="amber"
        />
        <StatsCard
          title="Jadwal Hari Ini"
          value={todayBookings.length}
          icon={CalendarDays}
          color="green"
        />
        <StatsCard
          title="Bimbingan Selesai"
          value={totalCompleted}
          icon={CheckCircle}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel Permintaan Masuk - Kaku & Administratif */}
        <Card className="rounded-sm shadow-sm border-primary/20 bg-card">
          <CardHeader className="pb-3 border-b border-primary/10 border-l-4 border-l-primary bg-muted/30 rounded-t-sm">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-wide flex items-center gap-2 text-foreground">
                <ClipboardList className="w-4 h-4 text-primary" />
                Permintaan Masuk
              </CardTitle>
              <Link to="/requests">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[10px] font-bold uppercase tracking-wider h-7 px-3 rounded-sm border-primary/20 hover:bg-primary/10 hover:text-primary shadow-none"
                >
                  Lihat Semua <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {pendingRequests.length === 0 ? (
              <EmptyState
                title="TIDAK ADA PERMINTAAN"
                description="Semua permintaan pengajuan jadwal bimbingan mahasiswa sudah diproses."
              />
            ) : (
              <div className="space-y-3">
                {pendingRequests.slice(0, 5).map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-3.5 rounded-sm bg-background border border-border hover:border-primary/30 transition-colors"
                  >
                    {/* Kotak Ikon Formal */}
                    <div className="w-10 h-10 rounded-sm bg-muted flex items-center justify-center shrink-0 border border-border">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground uppercase tracking-wide truncate">
                        {b.student_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase bg-muted/50 px-1.5 py-0.5 rounded-sm border border-border">
                          {format(new Date(b.date), "dd MMM yyyy", {
                            locale: localeId,
                          })}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm border border-primary/20">
                          {b.start_time} WIB
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 sm:pt-0 border-t border-border sm:border-t-0 flex shrink-0">
                      <StatusBadge status="pending" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel Mahasiswa Pasif (Peringatan) - Kaku & Peringatan Merah */}
        <Card className="rounded-sm shadow-sm border-destructive/20 bg-card">
          <CardHeader className="pb-3 border-b border-destructive/10 border-l-4 border-l-destructive bg-destructive/5 rounded-t-sm">
            <CardTitle className="text-sm font-black uppercase tracking-wide flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              Peringatan Mahasiswa Pasif
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {inactiveStudents.length === 0 ? (
              <EmptyState
                title="STATUS TERKENDALI"
                description="Tidak ada mahasiswa bimbingan yang tercatat pasif lebih dari 30 hari."
              />
            ) : (
              <div className="space-y-3">
                {inactiveStudents.slice(0, 5).map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-3.5 rounded-sm bg-destructive/5 border border-destructive/10 hover:border-destructive/30 transition-colors"
                  >
                    {/* Kotak Inisial Merah */}
                    <div className="w-10 h-10 rounded-sm bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-black text-destructive uppercase">
                        {(m.student_name || "?")[0]}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-destructive/90 uppercase tracking-wide truncate">
                        {m.student_name}
                      </p>
                      <p className="text-[10px] font-bold text-destructive/70 uppercase tracking-widest mt-1.5">
                        {studentLastBooking[m.student_email] ? (
                          <>
                            <span className="mr-1">Bimbingan Terakhir:</span>
                            <span className="bg-destructive/10 px-1.5 py-0.5 rounded-sm border border-destructive/20">
                              {format(
                                new Date(studentLastBooking[m.student_email]),
                                "dd MMM yyyy",
                                { locale: localeId },
                              )}
                            </span>
                          </>
                        ) : (
                          <span className="bg-destructive/10 px-1.5 py-0.5 rounded-sm border border-destructive/20">
                            BELUM PERNAH BIMBINGAN
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
