import React from "react";
import StatsCard from "@/components/shared/StatsCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  BarChart3,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useEntityList } from "@/lib/hooks/useEntityList";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const { data: users = [], isLoading: isUsersLoading } = useEntityList("User");
  const { data: mappings = [], isLoading: isMappingsLoading } =
    useEntityList("Mapping");
  const { data: periods = [], isLoading: isPeriodsLoading } =
    useEntityList("Period");
  const { data: bookings = [], isLoading: isBookingsLoading } =
    useEntityList("Booking");

  const isDataLoading =
    isUserLoading ||
    isUsersLoading ||
    isMappingsLoading ||
    isPeriodsLoading ||
    isBookingsLoading;

  if (isDataLoading) {
    return (
      <div className="space-y-4 max-w-7xl">
        <div className="bg-card rounded-md p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-44 rounded shrink-0" />
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
        <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="p-10 flex flex-col items-center">
            <Skeleton className="h-[300px] w-full max-w-3xl" />
          </div>
        </div>
      </div>
    );
  }
  const activePeriod = periods.find((p) => p.is_active);
  const activeMappings = mappings.filter((m) => m.status === "active");

  const dosenLoad = {};
  activeMappings.forEach((m) => {
    const shortName = m.supervisor_name.split(" ").slice(1, 3).join(" ");
    dosenLoad[shortName] = (dosenLoad[shortName] || 0) + 1;
  });
  const chartData = Object.entries(dosenLoad)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Header Halaman */}
      <div className="bg-card rounded-md p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1">
            Portal Admin
          </p>
          <h1 className="text-lg font-semibold text-foreground">
            Dashboard Administrator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Selamat datang, {user?.full_name || "Admin"}
          </p>
        </div>

        <div className="shrink-0">
          {activePeriod ? (
            <div className="flex flex-col sm:items-end">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                Periode Akademik Aktif
              </p>
              <div className="bg-primary px-3 py-1.5 rounded text-sm font-medium text-primary-foreground">
                {activePeriod.name}
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:items-end">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                Periode Akademik
              </p>
              <div className="bg-destructive text-destructive-foreground px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" /> Tidak ada periode aktif
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid Statistik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard
          title="Total Dosen"
          value={users.filter((u) => u.role === "dosen").length}
          icon={BookOpen}
          color="blue"
        />
        <StatsCard
          title="Total Mahasiswa"
          value={users.filter((u) => u.role === "mahasiswa").length}
          icon={GraduationCap}
          color="green"
        />
        <StatsCard
          title="Mapping Aktif"
          value={activeMappings.length}
          icon={Users}
          color="purple"
        />
        <StatsCard
          title="Total Booking Sesi"
          value={bookings.length}
          icon={CalendarDays}
          color="amber"
        />
      </div>

      {/* Grafik Beban Dosen */}
      <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            Distribusi Beban Bimbingan Dosen
          </h2>
        </div>
        <div className="p-5">
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/10 rounded">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Data Belum Tersedia
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Belum ada pemetaan (mapping) mahasiswa ke dosen yang aktif.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart
                data={chartData}
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
  );
}
