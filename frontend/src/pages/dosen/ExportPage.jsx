import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, FileText, Loader2, Database } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntityList } from "@/lib/hooks/useEntityList";

export default function ExportPage() {
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [exporting, setExporting] = useState(false);
  const { data: user } = useCurrentUser();
  const { data: mappingsAll = [] } = useEntityList("Mapping");
  const { data: logsAll = [] } = useEntityList("Logbook");

  const mappings = mappingsAll.filter((m) => m.status === "active");
  const logs = logsAll;
  const filteredLogs =
    selectedStudent === "all"
      ? logs
      : logs.filter((l) => l.student_email === selectedStudent);

  const handleExport = () => {
    setExporting(true);
    const headers = [
      "No",
      "Tanggal",
      "Mahasiswa",
      "Ringkasan",
      "Revisi",
      "Langkah Selanjutnya",
      "Progres (%)",
      "Validasi",
    ];
    const rows = filteredLogs.map((log, idx) => [
      idx + 1,
      format(new Date(log.date), "dd/MM/yyyy"),
      log.student_email,
      `"${(log.summary || "").replace(/"/g, '""')}"`,
      `"${(log.revisions || "").replace(/"/g, '""')}"`,
      `"${(log.next_steps || "").replace(/"/g, '""')}"`,
      log.progress_percentage || 0,
      log.validated_by_supervisor ? "Ya" : "Tidak",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rekap_bimbingan_${format(new Date(), "yyyyMMdd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    toast.success("File berhasil di-download");
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman Formal */}
      <div className="bg-card border border-border p-5 rounded-md shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">
          Rekap & Export Data
        </h1>
        <p className="text-sm font-medium text-muted-foreground mt-1">
          Unduh rekapitulasi catatan logbook bimbingan mahasiswa untuk keperluan
          arsip atau pelaporan.
        </p>
      </div>

      <Card className="rounded-md border border-border shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border bg-muted/30">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            Parameter Export
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div>
            <Label className="font-bold text-foreground">
              Filter Berdasarkan Mahasiswa
            </Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="mt-1.5 rounded-sm border-border shadow-none bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-sm border-border">
                <SelectItem value="all" className="font-bold">
                  Semua Mahasiswa Bimbingan
                </SelectItem>
                {mappings.map((m) => (
                  <SelectItem
                    key={m.id}
                    value={m.student_email}
                    className="font-medium"
                  >
                    {m.student_name}{" "}
                    <span className="text-muted-foreground text-xs ml-1">
                      ({m.student_email})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-primary/5 rounded-md border border-primary/20">
            <div className="flex items-center gap-2 mb-1.5">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">
                {filteredLogs.length} Catatan Bimbingan Ditemukan
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground leading-relaxed">
              Data yang diunduh mencakup Tanggal, Ringkasan, Revisi, Target, dan
              Progres Pengerjaan dalam format{" "}
              <span className="font-bold text-foreground">.CSV</span> yang dapat
              dibuka melalui Microsoft Excel atau Google Sheets.
            </p>
          </div>

          <div className="border-t border-border pt-2">
            <Button
              onClick={handleExport}
              disabled={filteredLogs.length === 0 || exporting}
              className="gap-2 rounded-sm font-bold shadow-none w-full sm:w-auto"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {exporting ? "Memproses Data..." : "Download Rekap (CSV)"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
