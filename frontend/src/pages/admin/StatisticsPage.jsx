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

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(135, 46%, 45%)",
  "hsl(359, 73%, 50%)",
  "hsl(220, 20%, 65%)",
];

export default function StatisticsPage() {
  // ==========================================
  // LOGIKA TETAP UTUH (TIDAK ADA YANG DIUBAH)
  // ==========================================
  const { data: users = [] } = useEntityList("User");
  const { data: bookings = [] } = useEntityList("Booking");
  const { data: mappings = [] } = useEntityList("Mapping");
  const thirtyDaysAgo = subDays(new Date(), 30);

  const statusDist = [
    "pending",
    "approved",
    "completed",
    "rejected",
    "cancelled",
  ]
    .map((status) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: bookings.filter((b) => b.status === status).length,
    }))
    .filter((d) => d.value > 0);

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

  const dosenLoad = {};
  mappings.forEach((m) => {
    dosenLoad[m.supervisor_name] = (dosenLoad[m.supervisor_name] || 0) + 1;
  });
  const dosenChartData = Object.entries(dosenLoad)
    .map(([name, count]) => ({
      name: name.split(" ")[0] + " " + name.split(" ")[1],
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // ==========================================
  // PERUBAHAN PADA UI/UX (FRONTEND KAKU & LEGA)
  // ==========================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Halaman Formal & Lega */}
      <div className="bg-card border border-primary/15 p-6 sm:p-8 rounded-sm shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
        <div className="pl-2">
          <h1 className="text-2xl font-black text-primary uppercase tracking-tight flex items-center gap-2.5">
            <PieChartIcon className="w-7 h-7 shrink-0" />
            Statistik Global Sistem
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-2 border-l-2 border-primary/30 pl-3">
            Analisis data terpusat aktivitas akademik, distribusi pengajuan, dan
            pemetaan beban tenaga pengajar.
          </p>
        </div>
      </div>

      {/* Grid Statistik Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Chart Distribusi Status - Kaku & Tabular */}
        <Card className="rounded-sm border-2 border-primary/10 shadow-sm bg-card">
          <CardHeader className="pb-4 pt-5 px-6 border-b-2 border-primary/10 bg-muted/40 border-l-4 border-l-primary">
            <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-foreground">
              <PieChartIcon className="w-5 h-5 text-primary" />
              Distribusi Status Pengajuan Bimbingan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {statusDist.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-sm bg-muted/10">
                <div className="w-16 h-16 bg-muted border-2 border-border rounded-sm flex items-center justify-center mb-4">
                  <PieChartIcon className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-black text-foreground uppercase tracking-widest">
                  DATA BELUM TERSEDIA
                </p>
                <p className="text-xs font-bold text-muted-foreground mt-1.5 uppercase tracking-wider">
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
                      fontSize: "11px",
                      fontWeight: "900",
                      fill: "hsl(var(--foreground))",
                      textTransform: "uppercase",
                    }}
                  >
                    {statusDist.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    wrapperStyle={{
                      fontSize: "11px",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      paddingTop: "20px",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderRadius: "4px",
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
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart Beban Dosen - Kaku & Tabular */}
        <Card className="rounded-sm border-2 border-primary/10 shadow-sm bg-card">
          <CardHeader className="pb-4 pt-5 px-6 border-b-2 border-primary/10 bg-muted/40 border-l-4 border-l-primary">
            <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-foreground">
              <BarChart3 className="w-5 h-5 text-primary" />
              Beban Bimbingan Per Dosen
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {dosenChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-sm bg-muted/10">
                <div className="w-16 h-16 bg-muted border-2 border-border rounded-sm flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-black text-foreground uppercase tracking-widest">
                  DATA BELUM TERSEDIA
                </p>
                <p className="text-xs font-bold text-muted-foreground mt-1.5 uppercase tracking-wider">
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
                      fontSize: 10,
                      fill: "hsl(var(--muted-foreground))",
                      fontWeight: 800,
                      textTransform: "uppercase",
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
                      borderRadius: "4px",
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
                    name="JML MAHASISWA"
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Peringatan Mahasiswa Pasif - Dibuat Jauh Lebih Tegas & Kaku */}
      {inactiveStudents.length > 0 && (
        <Card className="rounded-sm border-2 border-destructive/20 shadow-sm bg-card mt-6">
          <CardHeader className="pb-4 pt-5 px-6 border-b-2 border-destructive/10 bg-destructive/5 border-l-4 border-l-destructive">
            <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-destructive">
              <AlertOctagon className="w-5 h-5" />
              ATENSI KHUSUS: MAHASISWA PASIF (LEBIH DARI 30 HARI TANPA SESI
              SELESAI)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col">
              {inactiveStudents.map((m, index) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between p-5 lg:px-6 gap-4 transition-all bg-background hover:bg-muted/30 border-l-4 border-l-transparent hover:border-l-destructive/50",
                    index !== inactiveStudents.length - 1 &&
                      "border-b border-border/60",
                  )}
                >
                  <div className="flex items-center gap-5 w-full sm:w-1/2">
                    {/* Kotak Inisial Mahasiswa */}
                    <div className="w-12 h-12 rounded-sm bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0 shadow-inner">
                      <span className="text-lg font-black text-destructive uppercase">
                        {(m.student_name || "?")[0]}
                      </span>
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-black text-foreground uppercase tracking-wide truncate">
                        {m.student_name}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                        <BookOpen className="w-3.5 h-3.5" /> DOSEN PEMBIMBING:{" "}
                        <span className="text-foreground">
                          {m.supervisor_name}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Keterangan Terakhir Aktif */}
                  <div className="flex items-center sm:justify-end gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t border-dashed border-border sm:border-0">
                    <div className="bg-destructive/10 border border-destructive/20 px-3.5 py-2 rounded-sm text-center sm:text-right w-full sm:w-auto">
                      <p className="text-[10px] font-black text-destructive uppercase tracking-widest">
                        {studentLastBooking[m.student_email]
                          ? `TERAKHIR AKTIF: ${format(new Date(studentLastBooking[m.student_email]), "dd MMM yyyy", { locale: localeId })}`
                          : "BELUM PERNAH MELAKUKAN BIMBINGAN"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
