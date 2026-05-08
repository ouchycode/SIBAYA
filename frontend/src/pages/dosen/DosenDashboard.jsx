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
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function DosenDashboard() {
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const { data: mappingsAll = [], isLoading: isMappingsLoading } = useEntityList("Mapping");
  const { data: bookingsAll = [], isLoading: isBookingsLoading } = useEntityList("Booking");
  const isDataLoading = isUserLoading || isMappingsLoading || isBookingsLoading;
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

  const chartData = [
    { name: "Menunggu", total: pendingRequests.length, color: "#f59e0b" },
    {
      name: "Disetujui",
      total: bookings.filter((b) => b.status === "approved").length,
      color: "#3b82f6",
    },
    { name: "Selesai", total: totalCompleted, color: "#8b5cf6" },
    {
      name: "Ditolak",
      total: bookings.filter((b) => b.status === "rejected").length,
      color: "#ef4444",
    },
  ];

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

      {/* Analytics Chart */}
      <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden p-6 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-6 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          Statistik Status Bimbingan
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e5e7eb"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                dy={10}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                dx={-10}
              />
              <Tooltip
                cursor={{ fill: "#f3f4f6" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={60}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
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
