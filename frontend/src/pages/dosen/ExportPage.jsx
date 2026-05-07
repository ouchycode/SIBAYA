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
    toast.success("File berhasil di-unduh");
  };

  // ==========================================
  // PERUBAHAN PADA UI/UX (FRONTEND KAKU & LEGA)
  // ==========================================
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header Halaman Formal & Lega */}
      <div className="bg-card border border-primary/15 p-6 sm:p-8 rounded-sm shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
        <div className="pl-2">
          <h1 className="text-2xl font-black text-primary uppercase tracking-tight">
            Rekap & Export Data
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-2 border-l-2 border-primary/30 pl-3">
            Unduh rekapitulasi catatan logbook bimbingan mahasiswa untuk
            keperluan arsip atau pelaporan akademik.
          </p>
        </div>
      </div>

      {/* Kotak Formulir Export - Kaku & Administratif */}
      <Card className="rounded-sm border-2 border-primary/10 shadow-sm bg-card mt-6">
        <CardHeader className="pb-4 pt-5 px-6 border-b-2 border-primary/10 bg-muted/40 border-l-4 border-l-primary">
          <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-foreground">
            <Database className="w-5 h-5 text-primary" />
            Parameter Unduhan Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Dropdown Filter Mahasiswa */}
          <div>
            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-2">
              Filter Berdasarkan Mahasiswa
            </Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="h-10 rounded-sm border-2 border-border shadow-none bg-background font-bold text-xs uppercase tracking-wider focus:ring-primary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-sm border-2 border-border shadow-md max-h-[250px]">
                <SelectItem
                  value="all"
                  className="font-bold text-xs uppercase tracking-wider focus:bg-primary/10"
                >
                  SEMUA MAHASISWA BIMBINGAN
                </SelectItem>
                {mappings.map((m) => (
                  <SelectItem
                    key={m.id}
                    value={m.student_email}
                    className="font-bold text-xs uppercase tracking-wider focus:bg-primary/10"
                  >
                    {m.student_name}{" "}
                    <span className="text-muted-foreground text-[10px] ml-1 tracking-widest">
                      ({m.student_email})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Panel Informasi - Tabular & Kaku */}
          <div className="p-5 bg-muted/30 rounded-sm border-2 border-border">
            <div className="flex items-center gap-2.5 mb-3 border-b border-border/50 pb-3">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-sm font-black text-foreground uppercase tracking-wide">
                {filteredLogs.length} Catatan Bimbingan Ditemukan
              </span>
            </div>
            <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
              Data yang diunduh mencakup Tanggal, Ringkasan, Revisi, Target, dan
              Progres Pengerjaan dalam format{" "}
              <span className="font-black text-foreground bg-muted-foreground/10 px-2 py-0.5 rounded-sm border border-border">
                .CSV
              </span>{" "}
              yang dapat dibuka dan diolah lebih lanjut melalui aplikasi
              *spreadsheet* (seperti Microsoft Excel atau Google Sheets).
            </p>
          </div>

          {/* Area Tombol Aksi */}
          <div className="border-t-2 border-border/50 pt-6 mt-4 flex flex-col sm:flex-row justify-end">
            <Button
              onClick={handleExport}
              disabled={filteredLogs.length === 0 || exporting}
              className="h-10 px-8 gap-2.5 rounded-sm font-black uppercase tracking-wider shadow-none w-full sm:w-auto"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {exporting ? "MEMPROSES DATA..." : "DOWNLOAD REKAP (CSV)"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
