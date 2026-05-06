import React, { useState } from "react";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntityList } from "@/lib/hooks/useEntityList";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

const ITEMS_PER_PAGE = 5;

export default function DosenLogbook() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: bookingsAll = [] } = useEntityList("Booking");
  const { data: logsAll = [] } = useEntityList("Logbook");

  // State untuk Dialog & Form
  const [showDialog, setShowDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editingLogId, setEditingLogId] = useState(null); // Menandakan apakah sedang mode Edit
  const [form, setForm] = useState({
    summary: "",
    revisions: "",
    next_steps: "",
    progress_percentage: 0,
  });

  // State untuk Filter & Pagination
  const [studentFilter, setStudentFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Data Mentah
  const logs = logsAll.filter((l) => l.supervisor_email === user?.email);
  const completedBookings = bookingsAll.filter(
    (b) => b.supervisor_email === user?.email && b.status === "completed",
  );

  // Data Sesi Belum Dicatat (Sesi Selesai yg belum ada logbook-nya)
  const loggedBookingIds = new Set(logs.map((l) => l.booking_id));
  const unloggedBookings = completedBookings.filter(
    (b) => !loggedBookingIds.has(b.id),
  );

  const uniqueStudents = Array.from(new Set(logs.map((l) => l.student_email)));

  const filteredLogs = logs
    .filter((l) => {
      if (studentFilter === "all") return true;
      return l.student_email === studentFilter;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Terbaru di atas

  // Logika Pagination
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
    // Cari data booking aslinya untuk sekadar menampilkan info mahasiswa di modal
    const bookingInfo = completedBookings.find(
      (b) => b.id === log.booking_id,
    ) || {
      student_name: log.student_email,
      date: log.date,
    };
    setSelectedBooking(bookingInfo);

    // Isi form dengan data yang sudah ada sebelumnya
    setForm({
      summary: log.summary || "",
      revisions: log.revisions || "",
      next_steps: log.next_steps || "",
      progress_percentage: log.progress_percentage || 0,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      if (editingLogId) {
        // JIKA MODE EDIT (UPDATE)
        await base44.entities.Logbook.update(editingLogId, {
          ...form,
          progress_percentage: parseInt(form.progress_percentage) || 0,
        });
        toast.success("Catatan bimbingan berhasil diperbarui");
      } else {
        // JIKA MODE BARU (CREATE)
        await base44.entities.Logbook.create({
          booking_id: selectedBooking.id,
          student_email: selectedBooking.student_email,
          supervisor_email: user?.email,
          date: selectedBooking.date,
          ...form,
          progress_percentage: parseInt(form.progress_percentage) || 0,
          validated_by_supervisor: true,
        });
        toast.success("Catatan bimbingan berhasil disimpan");
      }
      queryClient.invalidateQueries({ queryKey: ["Logbook"] });
      setShowDialog(false);
    } catch (error) {
      toast.error("Gagal menyimpan catatan.");
    }
  };

  const handleValidate = async (logId) => {
    await base44.entities.Logbook.update(logId, {
      validated_by_supervisor: true,
    });
    queryClient.invalidateQueries({ queryKey: ["Logbook"] });
    toast.success("Catatan divalidasi");
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman Formal & Filter Bar */}
      <div className="bg-card border border-border p-5 rounded-md shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Logbook Bimbingan
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Catat hasil bimbingan dan validasi progres pengerjaan mahasiswa
            Anda.
          </p>
        </div>

        {/* Dropdown Filter Mahasiswa */}
        {uniqueStudents.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <Select value={studentFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-full sm:w-[220px] h-9 rounded-sm border-border font-medium text-xs shadow-none">
                <SelectValue placeholder="Semua Mahasiswa" />
              </SelectTrigger>
              <SelectContent className="rounded-sm border-border max-h-[200px]">
                <SelectItem value="all" className="text-xs font-bold">
                  Semua Mahasiswa
                </SelectItem>
                {uniqueStudents.map((email) => (
                  <SelectItem
                    key={email}
                    value={email}
                    className="text-xs font-medium"
                  >
                    {email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Sesi Belum Dicatat - Menggunakan style peringatan (Warning) yang rapi */}
      {unloggedBookings.length > 0 && studentFilter === "all" && (
        <Card className="rounded-md border border-amber-200 bg-amber-50 shadow-none">
          <CardHeader className="pb-3 border-b border-amber-200/50">
            <CardTitle className="text-sm font-bold text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Sesi Bimbingan Belum Dicatat ({unloggedBookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="space-y-2">
              {unloggedBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-md border border-amber-100 gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-amber-100 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {b.student_name}
                      </p>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5">
                        {format(new Date(b.date), "dd MMMM yyyy", {
                          locale: localeId,
                        })}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1.5 rounded-sm font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-none w-full sm:w-auto"
                    onClick={() => openCreateDialog(b)}
                  >
                    <Plus className="w-3.5 h-3.5" /> Buat Catatan
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredLogs.length === 0 ? (
        <div className="border border-border rounded-md bg-card">
          <EmptyState
            icon={BookOpen}
            title={
              studentFilter === "all" ? "Belum Ada Catatan" : "Tidak Ada Data"
            }
            description="Riwayat logbook yang sudah dicatat atau divalidasi akan muncul di sini."
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-4">
            {currentLogs.map((log) => (
              <Card
                key={log.id}
                className="rounded-md border border-border shadow-none bg-card overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Header Logbook Card */}
                  <div className="bg-muted/30 border-b border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-primary text-primary-foreground flex items-center justify-center border border-primary-foreground/20 shadow-sm shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground uppercase tracking-wide">
                          {format(new Date(log.date), "EEEE, dd MMMM yyyy", {
                            locale: localeId,
                          })}
                        </p>
                        <p className="text-xs font-medium text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> {log.student_email}
                        </p>
                      </div>
                    </div>

                    {/* Aksi / Status Validasi */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 rounded-sm font-bold shadow-none text-muted-foreground hover:text-foreground"
                        onClick={() => openEditDialog(log)}
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </Button>

                      {log.validated_by_supervisor ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-300 gap-1.5 px-2.5 py-1 rounded-sm font-bold uppercase tracking-wider text-[10px]"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Valid
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 rounded-sm font-bold border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground shadow-none"
                          onClick={() => handleValidate(log.id)}
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Validasi
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Body Logbook Card */}
                  <div className="p-5 space-y-5">
                    {log.progress_percentage != null && (
                      <div className="bg-muted/30 p-3 rounded-md border border-border/50">
                        <div className="flex justify-between items-center text-xs mb-2">
                          <span className="font-bold text-foreground uppercase tracking-wide">
                            Progres Pengerjaan
                          </span>
                          <span className="font-black text-primary bg-primary/10 px-2 py-0.5 rounded-sm border border-primary/20">
                            {log.progress_percentage}%
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-muted-foreground/20 rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${log.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {log.summary && (
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            Ringkasan Bimbingan
                          </h4>
                          <p className="text-sm text-foreground leading-relaxed text-justify">
                            {log.summary}
                          </p>
                        </div>
                      )}

                      {log.revisions && (
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            Catatan Revisi
                          </h4>
                          <p className="text-sm text-foreground leading-relaxed text-justify">
                            {log.revisions}
                          </p>
                        </div>
                      )}
                    </div>

                    {log.next_steps && (
                      <div className="pt-2">
                        <div className="p-3 rounded-md bg-accent/5 border border-accent/20">
                          <h4 className="text-xs font-bold text-accent-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                            Target / Langkah Selanjutnya
                          </h4>
                          <p className="text-sm font-medium text-foreground">
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

          {/* Kontrol Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-card border border-border p-3 rounded-md shadow-sm mt-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Halaman {currentPage} dari {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 rounded-sm shadow-none font-bold text-xs"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 rounded-sm shadow-none font-bold text-xs"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Selanjutnya
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialog Form Tambah / Edit Catatan */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-md border-border sm:max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="font-bold text-lg">
              {editingLogId
                ? "Edit Catatan Bimbingan"
                : "Tambah Catatan Bimbingan"}
            </DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 pt-2">
              <div className="bg-muted/30 border border-border p-3 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  Mahasiswa:{" "}
                  <span className="font-bold text-foreground">
                    {selectedBooking.student_name}
                  </span>
                </p>
                <p className="text-xs font-bold text-foreground bg-background px-2 py-1 rounded-sm border border-border">
                  {format(new Date(selectedBooking.date), "dd MMMM yyyy", {
                    locale: localeId,
                  })}
                </p>
              </div>

              <div>
                <Label className="font-bold text-foreground">
                  Ringkasan Bimbingan
                </Label>
                <Textarea
                  value={form.summary}
                  onChange={(e) =>
                    setForm({ ...form, summary: e.target.value })
                  }
                  className="mt-1.5 rounded-sm border-border shadow-none h-20 resize-none"
                  placeholder="Catat poin-poin penting yang dibahas..."
                />
              </div>

              <div>
                <Label className="font-bold text-foreground">
                  Instruksi Revisi
                </Label>
                <Textarea
                  value={form.revisions}
                  onChange={(e) =>
                    setForm({ ...form, revisions: e.target.value })
                  }
                  className="mt-1.5 rounded-sm border-border shadow-none h-20 resize-none"
                  placeholder="Catat apa saja yang perlu diperbaiki mahasiswa..."
                />
              </div>

              <div>
                <Label className="font-bold text-foreground">
                  Langkah Selanjutnya (Target)
                </Label>
                <Textarea
                  value={form.next_steps}
                  onChange={(e) =>
                    setForm({ ...form, next_steps: e.target.value })
                  }
                  className="mt-1.5 rounded-sm border-border shadow-none h-20 resize-none"
                  placeholder="Target untuk pertemuan berikutnya..."
                />
              </div>

              <div>
                <Label className="font-bold text-foreground">
                  Progres Pengerjaan (%)
                </Label>
                <div className="flex items-center gap-3 mt-1.5">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={form.progress_percentage}
                    onChange={(e) =>
                      setForm({ ...form, progress_percentage: e.target.value })
                    }
                    className="rounded-sm border-border shadow-none w-24"
                  />
                  <span className="text-sm font-medium text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-border pt-4 sm:justify-end gap-2 mt-4">
            <Button
              variant="outline"
              className="rounded-sm shadow-none font-bold"
              onClick={() => setShowDialog(false)}
            >
              Batal
            </Button>
            <Button
              className="rounded-sm shadow-none font-bold"
              onClick={handleSave}
            >
              {editingLogId ? "Simpan Perubahan" : "Simpan Catatan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
