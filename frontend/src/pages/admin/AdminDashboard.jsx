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

export default function AdminDashboard() {
  const { data: users = [] } = useEntityList("User");
  const { data: mappings = [] } = useEntityList("Mapping");
  const { data: periods = [] } = useEntityList("Period");
  const { data: bookings = [] } = useEntityList("Booking");
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
    <div className="space-y-6">
      {/* Header Halaman Formal */}
      <div className="bg-card border border-border p-5 rounded-md shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Dashboard Administrator
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Ringkasan data sivitas akademika dan aktivitas bimbingan.
          </p>
        </div>
        <div className="bg-muted/50 border border-border px-3 py-2 rounded-sm text-right shrink-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Periode Akademik
          </p>
          <p className="text-sm font-bold text-primary">
            {activePeriod ? activePeriod.name : "Tidak ada periode aktif"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <Card className="rounded-md border border-border shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border bg-muted/30">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Distribusi Beban Bimbingan Dosen
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <BarChart3 className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-bold text-foreground">
                Data Belum Tersedia
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Belum ada mapping mahasiswa ke dosen yang aktif.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
                    fontWeight: 600,
                  }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                    fontWeight: 600,
                  }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderRadius: "6px",
                    border: "1px solid hsl(var(--border))",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                  itemStyle={{ color: "hsl(var(--primary))" }}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  name="Jumlah Mahasiswa"
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
