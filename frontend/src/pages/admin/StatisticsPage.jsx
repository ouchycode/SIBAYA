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

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(135, 46%, 45%)",
  "hsl(359, 73%, 50%)",
  "hsl(220, 20%, 65%)",
];

export default function StatisticsPage() {
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

  return (
    <div className="space-y-6">
      {/* Header Halaman Formal */}
      <div className="bg-card border border-border p-5 rounded-md shadow-sm">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <PieChartIcon className="w-6 h-6 text-primary" />
          Statistik Global Sistem
        </h1>
        <p className="text-sm font-medium text-muted-foreground mt-1">
          Analisis data aktivitas akademik, status pengajuan, dan beban tenaga
          pengajar.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Distribusi Status */}
        <Card className="rounded-md border border-border shadow-none bg-card">
          <CardHeader className="pb-3 border-b border-border bg-muted/30">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-primary" />
              Distribusi Status Pengajuan Bimbingan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {statusDist.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <PieChartIcon className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-bold text-foreground">
                  Belum Ada Data
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Belum ada pengajuan bimbingan yang tercatat di sistem.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    dataKey="value"
                    stroke="hsl(var(--card))"
                    strokeWidth={3}
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                    style={{
                      fontSize: "11px",
                      fontWeight: "bold",
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
                      fontWeight: 600,
                      paddingTop: "10px",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderRadius: "6px",
                      border: "1px solid hsl(var(--border))",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart Beban Dosen */}
        <Card className="rounded-md border border-border shadow-none bg-card">
          <CardHeader className="pb-3 border-b border-border bg-muted/30">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Beban Bimbingan per Dosen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {dosenChartData.length === 0 ? (
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
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={dosenChartData}
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
                    name="Mahasiswa"
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Peringatan Mahasiswa Pasif */}
      {inactiveStudents.length > 0 && (
        <Card className="rounded-md border border-red-200 bg-card shadow-none">
          <CardHeader className="pb-3 border-b border-red-100 bg-red-50/50">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              Atensi Khusus: Mahasiswa Pasif (Lebih dari 30 Hari Tanpa Bimbingan
              Selesai)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col">
              {inactiveStudents.map((m, index) => (
                <div
                  key={m.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 ${
                    index !== inactiveStudents.length - 1
                      ? "border-b border-border/60"
                      : ""
                  } hover:bg-muted/30 transition-none`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-red-100 border border-red-200 flex items-center justify-center shrink-0">
                      <span className="text-sm font-black text-red-700">
                        {(m.student_name || "?")[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {m.student_name}
                      </p>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5">
                        Dosen Pembimbing:{" "}
                        <span className="font-bold text-foreground">
                          {m.supervisor_name}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center sm:justify-end gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-border sm:border-0">
                    <div className="bg-red-50 border border-red-200 px-3 py-1.5 rounded-sm">
                      <p className="text-xs font-bold text-red-700 text-center sm:text-right">
                        {studentLastBooking[m.student_email]
                          ? `Terakhir Aktif: ${format(new Date(studentLastBooking[m.student_email]), "dd MMMM yyyy", { locale: localeId })}`
                          : "Belum Pernah Melakukan Bimbingan"}
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
