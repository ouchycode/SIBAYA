import React, { useState } from "react";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Plus,
  CheckCircle,
  User,
  FileText,
  AlertCircle,
  Edit,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  PenTool,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntityList } from "@/lib/hooks/useEntityList";
import { sibaApi } from "@/api/apiClient";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 5;

export default function DosenLogbook() {
  // ==========================================
  // LOGIKA TETAP UTUH (TIDAK ADA YANG DIUBAH)
  // ==========================================
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: bookingsAll = [] } = useEntityList("Booking");
  const { data: logsAll = [] } = useEntityList("Logbook");

  const [showDialog, setShowDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editingLogId, setEditingLogId] = useState(null);
  const [form, setForm] = useState({
    summary: "",
    revisions: "",
    next_steps: "",
    progress_percentage: 0,
  });

  const [studentFilter, setStudentFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidatingId, setIsValidatingId] = useState(null);

  const logs = logsAll;
  const completedBookings = bookingsAll.filter((b) => b.status === "completed");

  const loggedBookingIds = new Set(logs.map((l) => String(l.booking_id)));
  const unloggedBookings = completedBookings.filter(
    (b) => !loggedBookingIds.has(String(b.id)),
  );

  const uniqueStudents = Array.from(new Set(logs.map((l) => l.student_email)));

  const filteredLogs = logs
    .filter((l) => {
      if (studentFilter === "all") return true;
      return l.student_email === studentFilter;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentLogs = filteredLogs.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const handleFilterChange = (val) => {
    setStudentFilter(val);
    setCurrentPage(1);
  };

  const openCreateDialog = (booking) => {
    setEditingLogId(null);
    setSelectedBooking(booking);
    setForm({
      summary: "",
      revisions: "",
      next_steps: "",
      progress_percentage: 0,
    });
    setShowDialog(true);
  };

  const openEditDialog = (log) => {
    setEditingLogId(log.id);
    const bookingInfo = completedBookings.find(
      (b) => b.id === log.booking_id,
    ) || {
      student_name: log.student_email,
      date: log.date,
    };
    setSelectedBooking(bookingInfo);

    setForm({
      summary: log.summary || "",
      revisions: log.revisions || "",
      next_steps: log.next_steps || "",
      progress_percentage: log.progress_percentage || 0,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editingLogId) {
        await sibaApi.entities.Logbook.update(editingLogId, {
          ...form,
          progress_percentage: parseInt(form.progress_percentage) || 0,
        });
        toast.success("Catatan bimbingan berhasil diperbarui.");
      } else {
        await sibaApi.entities.Logbook.create({
          booking_id: selectedBooking.id,
          student_email: selectedBooking.student_email,
          supervisor_email: user?.email,
          date: selectedBooking.date,
          ...form,
          progress_percentage: parseInt(form.progress_percentage) || 0,
          validated_by_supervisor: true,
        });
        toast.success("Catatan bimbingan berhasil disimpan.");
      }
      queryClient.invalidateQueries({ queryKey: ["Logbook"] });
      setShowDialog(false);
    } catch (error) {
      toast.error(
        error.data?.message || error.message || "Gagal menyimpan catatan.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleValidate = async (logId) => {
    setIsValidatingId(logId);
    try {
      await sibaApi.entities.Logbook.update(logId, {
        validated_by_supervisor: true,
      });
      queryClient.invalidateQueries({ queryKey: ["Logbook"] });
      toast.success("Catatan berhasil divalidasi.");
    } catch (error) {
      toast.error(
        error.data?.message || error.message || "Gagal memvalidasi catatan.",
      );
    } finally {
      setIsValidatingId(null);
    }
  };

  // ==========================================
  // PERUBAHAN PADA UI/UX (FRONTEND KAKU & LEGA)
  // ==========================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Halaman Formal & Filter Bar */}
      <div className="bg-card border border-primary/15 p-6 sm:p-8 rounded-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
        <div className="pl-2">
          <h1 className="text-2xl font-black text-primary uppercase tracking-tight">
            Logbook Bimbingan
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-2 border-l-2 border-primary/30 pl-3">
            Catat hasil bimbingan dan validasi progres pengerjaan mahasiswa
            akademik Anda.
          </p>
        </div>

        {/* Dropdown Filter Mahasiswa */}
        {uniqueStudents.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 bg-muted/30 p-3 rounded-sm border border-border">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Filter Mahasiswa:
              </span>
            </div>
            <Select value={studentFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-full sm:w-[260px] h-10 rounded-sm border-2 border-border font-bold text-xs uppercase tracking-wider shadow-none focus:ring-primary/50">
                <SelectValue placeholder="SEMUA MAHASISWA" />
              </SelectTrigger>
              <SelectContent className="rounded-sm border-2 border-border shadow-md max-h-[250px]">
                <SelectItem
                  value="all"
                  className="text-xs font-bold uppercase tracking-wider focus:bg-primary/10"
                >
                  SEMUA MAHASISWA
                </SelectItem>
                {uniqueStudents.map((email) => (
                  <SelectItem
                    key={email}
                    value={email}
                    className="text-xs font-bold focus:bg-primary/10"
                  >
                    {email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Sesi Belum Dicatat - Menggunakan style peringatan administratif */}
      {unloggedBookings.length > 0 && studentFilter === "all" && (
        <Card className="rounded-sm border-2 border-amber-200 bg-card shadow-sm overflow-hidden mt-6">
          <CardHeader className="py-4 px-6 border-b-2 border-amber-100 bg-amber-50/50 border-l-4 border-l-amber-500">
            <CardTitle className="text-sm font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              SESI BIMBINGAN BELUM DICATAT ({unloggedBookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-amber-50/20">
            <div className="space-y-3">
              {unloggedBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background rounded-sm border-2 border-amber-100 gap-4 hover:border-amber-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-sm bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200">
                      <User className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground uppercase tracking-wide">
                        {b.student_name}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        TANGGAL SESI:{" "}
                        {format(new Date(b.date), "dd MMMM yyyy", {
                          locale: localeId,
                        })}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="h-9 px-5 gap-2 rounded-sm font-black uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white shadow-none shrink-0"
                    onClick={() => openCreateDialog(b)}
                  >
                    <Plus className="w-4 h-4" /> BUAT CATATAN
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredLogs.length === 0 ? (
        <div className="border border-border rounded-sm bg-card mt-6">
          <EmptyState
            icon={BookOpen}
            title={
              studentFilter === "all" ? "BELUM ADA CATATAN" : "TIDAK ADA DATA"
            }
            description="Riwayat logbook yang sudah dicatat atau divalidasi akan muncul di sini."
          />
        </div>
      ) : (
        <div className="space-y-6 mt-6">
          <div className="space-y-6">
            {currentLogs.map((log) => (
              <Card
                key={log.id}
                className="rounded-sm border-2 border-primary/10 shadow-sm bg-card overflow-hidden hover:border-primary/30 transition-all"
              >
                <CardContent className="p-0">
                  {/* Header Logbook Card - Solid Bar */}
                  <div className="bg-muted/40 border-b-2 border-primary/10 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-primary">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-sm bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground uppercase tracking-wider">
                          {format(new Date(log.date), "EEEE, dd MMMM yyyy", {
                            locale: localeId,
                          })}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 flex items-center gap-1.5 bg-background px-2 py-0.5 rounded-sm border border-border w-fit">
                          <User className="w-3 h-3" /> {log.student_email}
                        </p>
                      </div>
                    </div>

                    {/* Aksi / Status Validasi */}
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-4 gap-1.5 rounded-sm font-black uppercase tracking-wider shadow-none border-2 border-border hover:bg-muted"
                        onClick={() => openEditDialog(log)}
                      >
                        <Edit className="w-3.5 h-3.5" /> EDIT
                      </Button>

                      {log.validated_by_supervisor ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-300 gap-1.5 px-3 py-1.5 rounded-sm font-black uppercase tracking-widest text-[10px]"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> VALID
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          className="h-8 px-4 gap-1.5 rounded-sm font-black uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white shadow-none"
                          onClick={() => handleValidate(log.id)}
                          disabled={isValidatingId === log.id}
                        >
                          {isValidatingId === log.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          VALIDASI
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Body Logbook Card - Diberi padding luas */}
                  <div className="p-6 space-y-6">
                    {log.progress_percentage != null && (
                      <div className="bg-background border-2 border-border p-4 rounded-sm">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                            Progres Pengerjaan
                          </span>
                          <span className="font-black text-primary bg-primary/10 px-3 py-1 rounded-sm border border-primary/20 text-xs">
                            {log.progress_percentage}%
                          </span>
                        </div>
                        <Progress
                          value={log.progress_percentage}
                          className="h-3 rounded-sm bg-muted-foreground/20"
                        />
                      </div>
                    )}

                    {/* Ringkasan & Revisi - Grid Tabular */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {log.summary && (
                        <div className="space-y-2 border border-border rounded-sm p-4 bg-muted/10">
                          <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-2 border-b border-border/50 pb-2 mb-2">
                            <div className="w-2 h-2 rounded-none bg-primary" />
                            Ringkasan Bimbingan
                          </h4>
                          <p className="text-sm text-muted-foreground font-medium leading-relaxed text-justify whitespace-pre-wrap">
                            {log.summary}
                          </p>
                        </div>
                      )}

                      {log.revisions && (
                        <div className="space-y-2 border border-destructive/20 rounded-sm p-4 bg-destructive/5">
                          <h4 className="text-[10px] font-black text-destructive uppercase tracking-widest flex items-center gap-2 border-b border-destructive/20 pb-2 mb-2">
                            <PenTool className="w-3 h-3" />
                            Catatan Revisi
                          </h4>
                          <p className="text-sm text-foreground font-medium leading-relaxed text-justify whitespace-pre-wrap">
                            {log.revisions}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Target Selanjutnya - Aksen Banner */}
                    {log.next_steps && (
                      <div className="pt-2">
                        <div className="p-4 rounded-sm bg-accent/5 border-2 border-accent/20">
                          <h4 className="text-[10px] font-black text-accent-foreground uppercase tracking-widest flex items-center gap-2 mb-2">
                            <Target className="w-3.5 h-3.5" />
                            Target / Langkah Selanjutnya
                          </h4>
                          <p className="text-sm font-semibold text-foreground leading-relaxed">
                            {log.next_steps}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Kontrol Pagination Formal - Box Kaku */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between bg-muted/20 border-2 border-primary/10 p-4 rounded-sm mt-8 gap-4">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                HALAMAN {currentPage} DARI {totalPages}
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-4 rounded-sm shadow-none font-black text-[10px] uppercase tracking-wider border-2 border-border hover:bg-background"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1.5" />
                  SEBELUMNYA
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-4 rounded-sm shadow-none font-black text-[10px] uppercase tracking-wider border-2 border-border hover:bg-background"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  SELANJUTNYA
                  <ChevronRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialog Form Tambah / Edit Catatan */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-sm border-2 border-primary/20 sm:max-w-2xl p-0 overflow-hidden bg-card max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader className="px-6 py-5 border-b border-primary/10 bg-muted/40">
            <DialogTitle className="text-base font-black uppercase tracking-wide text-primary">
              {editingLogId
                ? "Edit Catatan Bimbingan"
                : "Formulir Catatan Bimbingan"}
            </DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="px-6 py-6 space-y-6">
              {/* Info Mahasiswa Tabular Grid */}
              <div className="border border-border rounded-sm overflow-hidden text-sm">
                <div className="grid grid-cols-[130px_1fr] bg-muted/20 border-b border-border">
                  <div className="px-4 py-2.5 font-bold text-muted-foreground uppercase text-[10px] tracking-wider border-r border-border bg-muted/40">
                    MAHASISWA
                  </div>
                  <div className="px-4 py-2.5 font-black text-foreground uppercase">
                    {selectedBooking.student_name}
                  </div>
                </div>
                <div className="grid grid-cols-[130px_1fr] bg-background">
                  <div className="px-4 py-2.5 font-bold text-muted-foreground uppercase text-[10px] tracking-wider border-r border-border bg-muted/40">
                    TANGGAL SESI
                  </div>
                  <div className="px-4 py-2.5 font-bold text-primary uppercase">
                    {format(new Date(selectedBooking.date), "dd MMMM yyyy", {
                      locale: localeId,
                    })}
                  </div>
                </div>
              </div>

              {/* Input Forms */}
              <div className="space-y-4">
                <div>
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1.5">
                    Ringkasan Bimbingan
                  </Label>
                  <Textarea
                    value={form.summary}
                    onChange={(e) =>
                      setForm({ ...form, summary: e.target.value })
                    }
                    className="rounded-sm border-2 border-border focus-visible:ring-primary shadow-none h-24 resize-none p-3 font-medium text-sm"
                    placeholder="Catat poin-poin penting yang dibahas..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1.5 text-destructive/80">
                      Instruksi Revisi (Opsional)
                    </Label>
                    <Textarea
                      value={form.revisions}
                      onChange={(e) =>
                        setForm({ ...form, revisions: e.target.value })
                      }
                      className="rounded-sm border-2 border-border focus-visible:ring-destructive shadow-none h-24 resize-none p-3 font-medium text-sm"
                      placeholder="Catat apa saja yang perlu diperbaiki..."
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1.5 text-accent-foreground/80">
                      Langkah Selanjutnya
                    </Label>
                    <Textarea
                      value={form.next_steps}
                      onChange={(e) =>
                        setForm({ ...form, next_steps: e.target.value })
                      }
                      className="rounded-sm border-2 border-border focus-visible:ring-accent shadow-none h-24 resize-none p-3 font-medium text-sm"
                      placeholder="Target pertemuan berikutnya..."
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1.5">
                    Progres Pengerjaan (%)
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={form.progress_percentage}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          progress_percentage: e.target.value,
                        })
                      }
                      className="rounded-sm border-2 border-border focus-visible:ring-primary shadow-none w-24 h-10 font-mono font-bold px-3 text-lg"
                    />
                    <span className="text-sm font-black text-muted-foreground uppercase tracking-widest bg-muted/50 px-3 py-2 rounded-sm border border-border">
                      Persen Selesai
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="px-6 py-4 border-t border-primary/10 bg-muted/20 flex flex-row justify-end gap-3">
            <Button
              variant="outline"
              className="rounded-sm shadow-none font-black uppercase tracking-wider text-xs border-border px-5"
              onClick={() => setShowDialog(false)}
            >
              BATALKAN
            </Button>
            <Button
              className="rounded-sm shadow-none font-black uppercase tracking-wider text-xs px-5"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  MEMPROSES...
                </>
              ) : editingLogId ? (
                "SIMPAN PERUBAHAN"
              ) : (
                "SIMPAN CATATAN"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
