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
  // ==========================================
  // LOGIKA TETAP UTUH (TIDAK ADA YANG DIUBAH)
  // ==========================================
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [exporting, setExporting] = useState(false);
  const { data: user } = useCurrentUser();
  const { data: mappingsAll = [] } = useEntityList("Mapping");
  const { data: logsAll = [] } = useEntityList("Logbook");

  const mappings = mappingsAll.filter((m) => m.status === "active" && m.supervisor_email === user?.email);
  const logs = logsAll.filter((l) => l.supervisor_email === user?.email);
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
    toast.success("File berhasil di-unduh");
  };

  // ==========================================
  // PERUBAHAN PADA UI/UX (FRONTEND KAKU & LEGA)
  // ==========================================
  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-10">
      {/* Header Halaman */}
      <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1">
          Laporan & Analitik
        </p>
        <h1 className="text-base font-semibold text-foreground">
          Rekap & Export Data
        </h1>
      
      </div>

      {/* Kotak Formulir Export */}
      <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] mt-4 overflow-hidden border border-border/50">
        <div className="px-5 py-4 border-b border-border/50 bg-muted/10">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            Parameter Unduhan Data
          </h3>
        </div>
        <div className="space-y-5 p-5">
          {/* Dropdown Filter Mahasiswa */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              Filter Berdasarkan Mahasiswa
            </Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="h-9 rounded text-sm shadow-none border-border/60 focus:ring-primary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-md border border-border shadow-md max-h-[250px]">
                <SelectItem value="all" className="text-sm">
                  Semua Mahasiswa Bimbingan
                </SelectItem>
                {mappings.map((m) => (
                  <SelectItem
                    key={m.id}
                    value={m.student_email}
                    className="text-sm"
                  >
                    {m.student_name}{" "}
                    <span className="text-muted-foreground text-[10px] ml-1">
                      ({m.student_email})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Panel Informasi */}
          <div className="p-4 bg-muted/30 rounded-md">
            <div className="flex items-center gap-2.5 mb-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {filteredLogs.length} Catatan Bimbingan Ditemukan
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Data yang diunduh mencakup Tanggal, Ringkasan, Revisi, Target, dan
              Progres Pengerjaan dalam format{" "}
              <span className="font-semibold text-foreground bg-muted p-0.5 rounded">
                .csv
              </span>{" "}
              yang dapat dibuka dan diolah lebih lanjut melalui aplikasi
              spreadsheet (seperti Microsoft Excel atau Google Sheets).
            </p>
          </div>

          {/* Area Tombol Aksi */}
          <div className="border-t border-border/50 pt-5 flex flex-col sm:flex-row justify-end">
            <Button
              onClick={handleExport}
              disabled={filteredLogs.length === 0 || exporting}
              size="sm"
              className="h-8 px-4 rounded text-xs shadow-none w-full sm:w-auto"
            >
              {exporting ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 mr-1.5" />
              )}
              {exporting ? "Memproses Data..." : "Download Rekap (CSV)"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
