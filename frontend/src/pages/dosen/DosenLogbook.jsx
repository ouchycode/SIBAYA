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
import { Skeleton } from "@/components/ui/skeleton";

const ITEMS_PER_PAGE = 5;

export default function DosenLogbook() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: bookingsAll = [], isLoading: isLoadingBookings } =
    useEntityList("Booking");
  const { data: logsAll = [], isLoading: isLoadingLogs } =
    useEntityList("Logbook");

  const isDataLoading = isLoadingBookings || isLoadingLogs;

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

  const logs = logsAll.filter((l) => l.supervisor_email === user?.email);
  const completedBookings = bookingsAll.filter(
    (b) => b.status === "completed" && b.supervisor_email === user?.email,
  );

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

  if (isDataLoading) {
    return (
      <div className="space-y-5 max-w-7xl mx-auto pb-10">
        <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-9 w-full sm:w-[220px]" />
        </div>
        <div className="space-y-4 mt-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden border border-border/50"
            >
              <div className="bg-muted/10 border-b border-border/50 px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
              <div className="p-5 space-y-5">
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Header Halaman & Filter Bar */}
      <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1">
            Manajemen Logbook
          </p>
          <h1 className="text-base font-semibold text-foreground">
            Logbook Bimbingan
          </h1>
        </div>

        {/* Dropdown Filter Mahasiswa */}
        {uniqueStudents.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Filter:
              </span>
            </div>
            <Select value={studentFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-full sm:w-[220px] h-9 rounded text-xs shadow-none border-border/60">
                <SelectValue placeholder="Semua Mahasiswa" />
              </SelectTrigger>
              <SelectContent className="rounded-md border border-border shadow-md max-h-[250px]">
                <SelectItem value="all" className="text-xs">
                  Semua Mahasiswa
                </SelectItem>
                {uniqueStudents.map((email) => (
                  <SelectItem key={email} value={email} className="text-xs">
                    {email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Sesi Belum Dicatat */}
      {unloggedBookings.length > 0 && studentFilter === "all" && (
        <div className="bg-amber-50/50 rounded-md border border-amber-200 shadow-sm overflow-hidden mt-4">
          <div className="py-3 px-5 border-b border-amber-100 bg-amber-100/50 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-semibold text-amber-800">
              Sesi Bimbingan Belum Dicatat ({unloggedBookings.length})
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {unloggedBookings.map((b) => (
              <div
                key={b.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-card rounded border border-amber-100/50 gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100/50 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {b.student_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Sesi:{" "}
                      {format(new Date(b.date), "dd MMMM yyyy", {
                        locale: localeId,
                      })}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="h-8 px-4 rounded text-xs shadow-none shrink-0"
                  onClick={() => openCreateDialog(b)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Buat Catatan
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={
            studentFilter === "all" ? "Belum ada catatan" : "Tidak ada data"
          }
          description="Riwayat logbook yang sudah dicatat atau divalidasi akan muncul di sini."
        />
      ) : (
        <div className="space-y-4 mt-4">
          <div className="space-y-4">
            {currentLogs.map((log) => (
              <div
                key={log.id}
                className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden border border-border/50"
              >
                {/* Header Logbook Card */}
                <div className="bg-muted/10 border-b border-border/50 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {format(new Date(log.date), "EEEE, dd MMMM yyyy", {
                          locale: localeId,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <User className="w-3.5 h-3.5" /> {log.student_email}
                      </p>
                    </div>
                  </div>

                  {/* Aksi / Status Validasi */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 rounded text-xs shadow-none border-border/60 hover:bg-muted/40"
                      onClick={() => openEditDialog(log)}
                    >
                      <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                    </Button>

                    {log.validated_by_supervisor ? (
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-600 border-0 rounded font-medium px-2.5 py-1 text-[11px]"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Valid
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        className="h-8 px-3 rounded text-xs shadow-none"
                        onClick={() => handleValidate(log.id)}
                        disabled={isValidatingId === log.id}
                      >
                        {isValidatingId === log.id ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Validasi
                      </Button>
                    )}
                  </div>
                </div>

                {/* Body Logbook Card */}
                <div className="p-5 space-y-5">
                  {log.progress_percentage != null && (
                    <div className="bg-muted/30 p-3 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Progres Pengerjaan
                        </span>
                        <span className="font-semibold text-primary text-xs">
                          {log.progress_percentage}%
                        </span>
                      </div>
                      <Progress
                        value={log.progress_percentage}
                        className="h-2 rounded-full"
                      />
                    </div>
                  )}

                  {/* Ringkasan & Revisi */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {log.summary && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          Ringkasan Bimbingan
                        </h4>
                        <div className="p-3 bg-muted/20 rounded border border-border/50">
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                            {log.summary}
                          </p>
                        </div>
                      </div>
                    )}

                    {log.revisions && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-medium text-destructive flex items-center gap-1.5">
                          <PenTool className="w-3.5 h-3.5" />
                          Catatan Revisi
                        </h4>
                        <div className="p-3 bg-destructive/5 rounded border border-destructive/10">
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                            {log.revisions}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Target Selanjutnya */}
                  {log.next_steps && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-medium text-primary flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" />
                        Target / Langkah Selanjutnya
                      </h4>
                      <div className="p-3 bg-primary/5 rounded border border-primary/10">
                        <p className="text-sm text-foreground leading-relaxed">
                          {log.next_steps}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Kontrol Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3.5 border border-border/50 rounded-md flex items-center justify-between bg-card mt-4">
              <p className="text-xs text-muted-foreground">
                Halaman {currentPage} dari {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 rounded text-xs shadow-none border-border/60 hover:bg-muted/40"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 rounded text-xs shadow-none border-border/60 hover:bg-muted/40"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Selanjutnya
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialog Form Tambah / Edit Catatan */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-md border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:max-w-2xl p-0 overflow-hidden bg-card max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader className="px-5 py-4 border-b border-border/50">
            <DialogTitle className="text-sm font-semibold text-foreground">
              {editingLogId
                ? "Edit Catatan Bimbingan"
                : "Formulir Catatan Bimbingan"}
            </DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="px-5 py-5 space-y-5">
              {/* Info Mahasiswa */}
              <div className="bg-muted/30 rounded-md p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Mahasiswa
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {selectedBooking.student_name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Tanggal Sesi
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {format(new Date(selectedBooking.date), "dd MMMM yyyy", {
                      locale: localeId,
                    })}
                  </span>
                </div>
              </div>

              {/* Input Forms */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">
                    Ringkasan Bimbingan
                  </Label>
                  <Textarea
                    value={form.summary}
                    onChange={(e) =>
                      setForm({ ...form, summary: e.target.value })
                    }
                    className="rounded border-border/60 focus-visible:ring-primary shadow-none h-24 resize-none p-3 text-sm"
                    placeholder="Catat poin-poin penting yang dibahas..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">
                      Instruksi Revisi (Opsional)
                    </Label>
                    <Textarea
                      value={form.revisions}
                      onChange={(e) =>
                        setForm({ ...form, revisions: e.target.value })
                      }
                      className="rounded border-border/60 focus-visible:ring-primary shadow-none h-24 resize-none p-3 text-sm"
                      placeholder="Catat apa saja yang perlu diperbaiki..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">
                      Langkah Selanjutnya
                    </Label>
                    <Textarea
                      value={form.next_steps}
                      onChange={(e) =>
                        setForm({ ...form, next_steps: e.target.value })
                      }
                      className="rounded border-border/60 focus-visible:ring-primary shadow-none h-24 resize-none p-3 text-sm"
                      placeholder="Target pertemuan berikutnya..."
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">
                    Progres Pengerjaan (%)
                  </Label>
                  <div className="flex items-center gap-2">
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
                      className="rounded border-border/60 focus-visible:ring-primary shadow-none w-24 h-9 text-sm"
                    />
                    <span className="text-xs text-muted-foreground">
                      Persen Selesai
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="px-5 py-3.5 border-t border-border/50 bg-muted/20 flex flex-row justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded text-xs"
              onClick={() => setShowDialog(false)}
            >
              Batal
            </Button>
            <Button
              size="sm"
              className="rounded text-xs"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Memproses...
                </>
              ) : editingLogId ? (
                "Simpan Perubahan"
              ) : (
                "Simpan Catatan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
