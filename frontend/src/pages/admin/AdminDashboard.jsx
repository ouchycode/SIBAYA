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

export default function AdminDashboard() {
  // ==========================================
  // LOGIKA TETAP UTUH (TIDAK ADA YANG DIUBAH)
  // ==========================================
  const { data: user } = useCurrentUser();
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

  // ==========================================
  // PERUBAHAN PADA UI/UX (FRONTEND KAKU & LEGA)
  // ==========================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Halaman Formal & Lega */}
      <div className="bg-card border-2 border-primary/10 p-6 sm:p-8 rounded-sm shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />

        <div className="flex items-center gap-5 pl-2">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">
              Portal Sistem Utama
            </p>
            <h1 className="text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-primary shrink-0" />
              Dashboard Administrator
            </h1>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                SELAMAT DATANG,{" "}
                <span className="text-foreground font-black">
                  {user?.full_name || "ADMIN TERDAFTAR"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Indikator Periode Akademik - Kotak Kaku */}
        <div className="bg-background border-2 border-primary/10 p-4 rounded-sm shrink-0 shadow-sm flex flex-col items-start lg:items-end min-w-[220px]">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">
            Periode Akademik
          </p>
          {activePeriod ? (
            <div className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-sm">
              <p className="text-sm font-black text-primary uppercase tracking-widest">
                {activePeriod.name}
              </p>
            </div>
          ) : (
            <div className="bg-destructive/10 border border-destructive/20 px-3 py-1.5 rounded-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <p className="text-xs font-black text-destructive uppercase tracking-widest">
                TIDAK ADA PERIODE AKTIF
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Grid Statistik - Wrapper diberikan jarak */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
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
      <Card className="rounded-sm border-2 border-primary/10 shadow-sm bg-card mt-6">
        <CardHeader className="pb-4 pt-5 px-6 border-b-2 border-primary/10 bg-muted/40 border-l-4 border-l-primary">
          <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-foreground">
            <BarChart3 className="w-5 h-5 text-primary" />
            Distribusi Beban Bimbingan Dosen
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-sm bg-muted/10">
              <div className="w-16 h-16 bg-muted border-2 border-border rounded-sm flex items-center justify-center mb-4">
                <BarChart3 className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-black text-foreground uppercase tracking-widest">
                DATA BELUM TERSEDIA
              </p>
              <p className="text-xs font-bold text-muted-foreground mt-1.5 uppercase tracking-wider">
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
                    fontSize: 10,
                    fill: "hsl(var(--muted-foreground))",
                    fontWeight: 800,
                  }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                    fontWeight: 800,
                  }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderRadius: "4px", // rounded-sm
                    border: "2px solid hsl(var(--primary)/0.2)",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: "10px",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                  itemStyle={{
                    color: "hsl(var(--primary))",
                    fontWeight: "900",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[2, 2, 0, 0]}
                  name="Total Mahasiswa"
                  barSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
