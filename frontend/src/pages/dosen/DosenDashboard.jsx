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

  const mappings = mappingsAll.filter(
    (m) => m.status === "active" && m.supervisor_email === user?.email,
  );
  const bookings = bookingsAll.filter(
    (b) => b.supervisor_email === user?.email,
  );

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
      {/* Banner Selamat Datang */}
      <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6">
        <div className="flex-1 space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Portal Dosen Pembimbing
          </p>
          <h1 className="text-xl font-semibold text-foreground">
            {user?.full_name || "Dosen Terdaftar"}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="bg-primary/5 text-primary px-2.5 py-0.5 rounded font-medium border border-primary/10 tracking-wide">
                {user?.nip || "NIP tidak tersedia"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span>{mappings.length} Mahasiswa Bimbingan Aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
        {/* Panel Permintaan Masuk */}
        <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between bg-muted/20">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <ClipboardList className="w-4 h-4 text-primary" />
              Permintaan Masuk
            </h3>
            <Link
              to="/requests"
              className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
            >
              Lihat semua <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-5">
            {pendingRequests.length === 0 ? (
              <EmptyState
                title="Tidak ada permintaan"
                description="Semua permintaan pengajuan jadwal bimbingan mahasiswa sudah diproses."
              />
            ) : (
              <div className="space-y-3">
                {pendingRequests.slice(0, 5).map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-3.5 rounded border border-border/60 hover:bg-muted/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {b.student_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(b.date), "dd MMM yyyy", {
                            locale: localeId,
                          })}
                        </span>
                        <span className="text-xs font-medium text-primary">
                          {b.start_time} WIB
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          • {b.mode === "online" ? "Daring" : "Luring"}
                          {b.location && b.mode !== "online"
                            ? ` • ${b.location}`
                            : ""}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 sm:pt-0 border-t border-border/50 sm:border-t-0 flex shrink-0">
                      <StatusBadge status="pending" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel Mahasiswa Pasif (Peringatan) */}
        <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between bg-muted/20">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              Peringatan Mahasiswa Pasif
            </h3>
          </div>
          <div className="p-5">
            {inactiveStudents.length === 0 ? (
              <EmptyState
                title="Status terkendali"
                description="Tidak ada mahasiswa bimbingan yang tercatat pasif lebih dari 30 hari."
              />
            ) : (
              <div className="space-y-3">
                {inactiveStudents.slice(0, 5).map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-3.5 rounded bg-destructive/5 border border-destructive/10 hover:bg-destructive/10 transition-colors"
                  >
                    <div className="w-10 h-10 rounded bg-destructive flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-destructive-foreground uppercase">
                        {(m.student_name || "?")[0]}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-destructive/90 truncate">
                        {m.student_name}
                      </p>
                      <p className="text-xs text-destructive/70 mt-1">
                        {studentLastBooking[m.student_email] ? (
                          <>
                            <span className="mr-1">Bimbingan terakhir:</span>
                            <span className="font-medium">
                              {format(
                                new Date(studentLastBooking[m.student_email]),
                                "dd MMM yyyy",
                                { locale: localeId },
                              )}
                            </span>
                          </>
                        ) : (
                          <span className="font-medium">
                            Belum pernah bimbingan
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
