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
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, subDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntityList } from "@/lib/hooks/useEntityList";

export default function DosenDashboard() {
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

  return (
    <div className="space-y-6">
      {/* Header Halaman Formal */}
      <div className="bg-card border border-border p-5 rounded-md shadow-sm flex items-center gap-5">
        <div className="hidden sm:flex w-16 h-16 rounded-full bg-accent text-accent-foreground items-center justify-center shrink-0 border-2 border-border overflow-hidden">
          {user?.photo ? (
            <img src={user.photo} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-black">
              {(user?.full_name || "D")[0].toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Dosen</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Selamat datang,{" "}
            <span className="text-foreground">{user?.full_name || "Dosen"}</span>
          </p>
        </div>
      </div>

      {/* Stats Grid - Memanfaatkan komponen StatsCard bawaan */}
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
        {/* Panel Permintaan Masuk */}
        <Card className="rounded-md shadow-none border-border">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                Permintaan Masuk
              </CardTitle>
              <Link to="/requests">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-bold gap-1 rounded-sm hover:bg-muted"
                >
                  Lihat Semua <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {pendingRequests.length === 0 ? (
              <EmptyState
                title="Tidak ada permintaan"
                description="Semua permintaan pengajuan jadwal bimbingan sudah diproses."
              />
            ) : (
              <div className="space-y-3">
                {pendingRequests.slice(0, 5).map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-4 p-3 rounded-md bg-card border border-border"
                  >
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0 border border-border">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        {b.student_name}
                      </p>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5">
                        {format(new Date(b.date), "dd MMM yyyy", {
                          locale: localeId,
                        })}{" "}
                        • {b.start_time} WIB
                      </p>
                    </div>
                    <div>
                      <StatusBadge status="pending" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel Mahasiswa Pasif (Peringatan) */}
        <Card className="rounded-md shadow-none border-border">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Peringatan Mahasiswa Pasif
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {inactiveStudents.length === 0 ? (
              <EmptyState
                title="Status Mahasiswa Terkendali"
                description="Tidak ada mahasiswa bimbingan yang pasif lebih dari 30 hari."
              />
            ) : (
              <div className="space-y-3">
                {inactiveStudents.slice(0, 5).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-4 p-3 rounded-md bg-red-50/50 border border-red-100"
                  >
                    <div className="w-10 h-10 rounded bg-red-100 border border-red-200 flex items-center justify-center shrink-0">
                      <span className="text-sm font-black text-red-700">
                        {(m.student_name || "?")[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-red-900 truncate">
                        {m.student_name}
                      </p>
                      <p className="text-xs font-medium text-red-700 mt-0.5">
                        {studentLastBooking[m.student_email]
                          ? `Terakhir Bimbingan: ${format(new Date(studentLastBooking[m.student_email]), "dd MMM yyyy", { locale: localeId })}`
                          : "Belum pernah bimbingan sama sekali"}
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
