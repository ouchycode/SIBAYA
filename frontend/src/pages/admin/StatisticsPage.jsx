import React from "react";
import StatsCard from "@/components/shared/StatsCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  GraduationCap,
  AlertTriangle,
  CheckCircle,
  PieChart as PieChartIcon,
  BarChart3,
  AlertCircle,
  AlertOctagon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { subDays, format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useEntityList } from "@/lib/hooks/useEntityList";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(135, 46%, 45%)",
  "hsl(359, 73%, 50%)",
  "hsl(220, 20%, 65%)",
];

export default function StatisticsPage() {
  const { data: users = [], isLoading: isUsersLoading } = useEntityList("User");
  const { data: bookings = [], isLoading: isBookingsLoading } =
    useEntityList("Booking");
  const { data: mappings = [], isLoading: isMappingsLoading } =
    useEntityList("Mapping");
  const thirtyDaysAgo = subDays(new Date(), 30);

  const isDataLoading =
    isUsersLoading || isBookingsLoading || isMappingsLoading;

  if (isDataLoading) {
    return (
      <div className="space-y-5 max-w-7xl">
        <div className="bg-card rounded-md p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <Skeleton className="h-3 w-24 mb-1.5" />
          <Skeleton className="h-5 w-40" />
        </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-border/50">
                <Skeleton className="h-5 w-48" />
              </div>
              <div className="p-10 flex flex-col items-center">
                <Skeleton className="h-[250px] w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statusDist = [
    "pending",
    "approved",
    "completed",
    "rejected",
    "cancelled",
  ]
    .map((status) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: (bookings || []).filter((b) => b.status === status).length,
    }))
    .filter((d) => d.value > 0);

  const studentLastBooking = {};
  (bookings || [])
    .filter((b) => b.status === "completed")
    .forEach((b) => {
      if (
        !studentLastBooking[b.student_email] ||
        new Date(b.date) > new Date(studentLastBooking[b.student_email])
      ) {
        studentLastBooking[b.student_email] = b.date;
      }
    });

  const inactiveStudents = (mappings || []).filter(
    (m) =>
      !studentLastBooking[m.student_email] ||
      new Date(studentLastBooking[m.student_email]) < thirtyDaysAgo,
  );

  const dosenLoad = {};
  (mappings || []).forEach((m) => {
    dosenLoad[m.supervisor_name] = (dosenLoad[m.supervisor_name] || 0) + 1;
  });
  const dosenChartData = Object.entries(dosenLoad)
    .map(([name, count]) => ({
      name: name.split(" ")[0] + " " + name.split(" ")[1],
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header Halaman */}
      <div className="bg-card rounded-md p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1">
            Statistik
          </p>
          <h1 className="text-base font-semibold text-foreground">
            Statistik Global Sistem
          </h1>
        </div>
      </div>

      {/* Grid Statistik Utama */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard
          title="Total Dosen Terdaftar"
          value={users.filter((u) => u.role === "dosen").length}
          icon={BookOpen}
          color="blue"
        />
        <StatsCard
          title="Total Mahasiswa Aktif"
          value={
            users.filter((u) => u.role === "mahasiswa" && u.status === "active")
              .length
          }
          icon={GraduationCap}
          color="green"
        />
        <StatsCard
          title="Peringatan Pasif (30+ Hari)"
          value={inactiveStudents.length}
          icon={AlertTriangle}
          color="red"
        />
        <StatsCard
          title="Total Bimbingan Selesai"
          value={bookings.filter((b) => b.status === "completed").length}
          icon={CheckCircle}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart Distribusi Status */}
        <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-muted-foreground" />
              Distribusi Status Pengajuan Bimbingan
            </h2>
          </div>
          <div className="p-5">
            {statusDist.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/10 rounded">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                  <PieChartIcon className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  Data Belum Tersedia
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Belum ada pengajuan bimbingan yang tercatat di sistem.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={statusDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={105}
                    dataKey="value"
                    stroke="hsl(var(--card))"
                    strokeWidth={4}
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={{
                      stroke: "hsl(var(--border))",
                      strokeWidth: 1.5,
                    }}
                    style={{
                      fontSize: "12px",
                      fill: "hsl(var(--foreground))",
                    }}
                  >
                    {statusDist.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    wrapperStyle={{
                      fontSize: "12px",
                      paddingTop: "20px",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderRadius: "6px",
                      border: "1px solid hsl(var(--border))",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      fontSize: "12px",
                    }}
                    itemStyle={{
                      color: "hsl(var(--primary))",
                      fontWeight: "500",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart Beban Dosen */}
        <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              Beban Bimbingan Per Dosen
            </h2>
          </div>
          <div className="p-5">
            {dosenChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/10 rounded">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                  <BarChart3 className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  Data Belum Tersedia
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Belum ada mapping mahasiswa ke dosen yang aktif.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={dosenChartData}
                  margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderRadius: "6px",
                      border: "1px solid hsl(var(--border))",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      fontSize: "12px",
                    }}
                    itemStyle={{
                      color: "hsl(var(--primary))",
                      fontWeight: "500",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    name="Total Mahasiswa"
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Peringatan Mahasiswa Pasif */}
      {inactiveStudents.length > 0 && (
        <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50 bg-destructive/5">
            <h2 className="text-sm font-semibold text-destructive flex items-center gap-2">
              <AlertOctagon className="w-4 h-4" />
              Perhatian Khusus: Mahasiswa Pasif (Lebih dari 30 hari tanpa sesi
              selesai)
            </h2>
          </div>
          <div className="divide-y divide-border/40">
            {inactiveStudents.map((m) => (
              <div
                key={m.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-destructive flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-destructive-foreground">
                      {(m.student_name || "?")[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {m.student_name}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <BookOpen className="w-3.5 h-3.5" /> Dosen Pembimbing:{" "}
                      {m.supervisor_name}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center sm:justify-end gap-2 text-xs">
                  <span className="text-destructive bg-destructive/10 px-2.5 py-1 rounded">
                    {studentLastBooking[m.student_email]
                      ? `Terakhir Aktif: ${format(new Date(studentLastBooking[m.student_email]), "dd MMM yyyy", { locale: localeId })}`
                      : "Belum Pernah Melakukan Bimbingan"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
