import React, { useState } from "react";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  Plus,
  CheckCircle,
  CalendarDays,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertOctagon,
  Settings2,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { useEntityList } from "@/lib/hooks/useEntityList";
import { sibaApi } from "@/api/apiClient";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function PeriodsPage() {
  // ==========================================
  // LOGIKA TETAP UTUH (TIDAK ADA YANG DIUBAH)
  // ==========================================
  const queryClient = useQueryClient();
  const { data: periods = [] } = useEntityList("Period");

  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    description: "",
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const openCreate = () => {
    setEditId(null);
    setForm({ name: "", start_date: "", end_date: "", description: "" });
    setShowDialog(true);
  };

  const openEdit = (p) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      start_date: p.start_date,
      end_date: p.end_date,
      description: p.description || "",
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      if (editId) {
        await sibaApi.entities.Period.update(editId, form);
        toast.success("Periode berhasil diperbarui");
      } else {
        await sibaApi.entities.Period.create({
          ...form,
          is_active: false,
        });
        toast.success("Periode berhasil dibuat");
      }
      queryClient.invalidateQueries({ queryKey: ["Period"] });
      setShowDialog(false);
    } catch (error) {
      toast.error(
        error.data?.message || error.message || "Gagal menyimpan periode",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await sibaApi.entities.Period.delete(deleteTarget.id);
      toast.success("Periode berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["Period"] });
    } catch (error) {
      toast.error(
        error.data?.message ||
          error.message ||
          "Gagal menghapus periode. Pastikan tidak ada jadwal yang terikat pada periode ini.",
      );
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleToggle = async (id, active) => {
    try {
      if (active) {
        await Promise.all(
          periods
            .filter((p) => p.id !== id && p.is_active)
            .map((p) =>
              sibaApi.entities.Period.update(p.id, { is_active: false }),
            ),
        );
      }
      await sibaApi.entities.Period.update(id, { is_active: active });
      queryClient.invalidateQueries({ queryKey: ["Period"] });
      toast.success(
        active ? "Periode telah diaktifkan" : "Periode dinonaktifkan",
      );
    } catch (error) {
      toast.error(
        error.data?.message ||
          error.message ||
          "Gagal memperbarui status periode",
      );
    }
  };

  const totalPages = Math.ceil(periods.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentPeriods = periods.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // ==========================================
  // PERUBAHAN PADA UI/UX (FRONTEND KAKU & LEGA)
  // ==========================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Halaman Formal & Lega */}
      <div className="bg-card border border-primary/15 p-6 sm:p-8 rounded-sm shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
        <div className="pl-2">
          <h1 className="text-2xl font-black text-primary uppercase tracking-tight">
            Manajemen Periode Akademik
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-2 border-l-2 border-primary/30 pl-3">
            Atur dan kelola kalender periode aktif sistem bimbingan akademik.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="h-10 px-6 gap-2 rounded-sm font-black uppercase tracking-wider shadow-none border-2 border-transparent shrink-0"
        >
          <Plus className="w-4 h-4" /> TAMBAH PERIODE
        </Button>
      </div>

      {periods.length === 0 ? (
        <div className="border border-border rounded-sm bg-card mt-6">
          <EmptyState
            icon={Calendar}
            title="BELUM ADA PERIODE AKADEMIK"
            description="Buat periode bimbingan baru (misal: Semester Genap 2025/2026) untuk memulai operasional sistem."
          />
        </div>
      ) : (
        <div className="space-y-4 mt-6">
          {/* Header Tabel Semu */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted/40 border-2 border-border rounded-t-sm border-b-0">
            <div className="col-span-8 flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5" /> INFORMASI PERIODE
            </div>
            <div className="col-span-4 text-right flex items-center justify-end gap-2">
              KONTROL & STATUS <Settings2 className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Daftar Periode */}
          <div className="space-y-4 sm:space-y-0 sm:border-2 sm:border-t-0 sm:border-border sm:rounded-b-sm sm:bg-card sm:overflow-hidden">
            {currentPeriods.map((p, index) => (
              <Card
                key={p.id}
                className={cn(
                  "rounded-sm sm:rounded-none border-2 sm:border-0 sm:border-b sm:last:border-b-0 shadow-sm sm:shadow-none transition-all",
                  p.is_active
                    ? "border-primary/40 bg-primary/5 sm:bg-primary/5"
                    : "border-border bg-card hover:bg-muted/20",
                )}
              >
                <CardContent className="p-0">
                  <div
                    className={cn(
                      "px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6",
                      p.is_active && "border-l-4 border-l-primary",
                    )}
                  >
                    {/* Detail Informasi */}
                    <div className="flex items-start gap-5">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-sm flex items-center justify-center shrink-0 border shadow-inner",
                          p.is_active
                            ? "bg-primary text-primary-foreground border-primary-foreground/20"
                            : "bg-muted border-border text-muted-foreground",
                        )}
                      >
                        <CalendarDays className="w-6 h-6" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="font-black text-base text-foreground uppercase tracking-wide">
                            {p.name}
                          </p>
                          {p.is_active && (
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-700 border-emerald-300 gap-1.5 rounded-sm font-black uppercase tracking-widest text-[9px] px-2.5 py-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> BERJALAN
                              AKTIF
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-background px-2.5 py-1 rounded-sm border border-border">
                            {format(new Date(p.start_date), "dd MMM yyyy", {
                              locale: localeId,
                            })}
                            <span className="mx-2 text-border">—</span>
                            {format(new Date(p.end_date), "dd MMM yyyy", {
                              locale: localeId,
                            })}
                          </span>
                        </div>

                        {p.description && (
                          <p className="text-xs text-foreground/80 font-medium italic border-l-2 border-muted-foreground/30 pl-2 mt-1">
                            "{p.description}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Aksi & Status Toggle */}
                    <div className="flex items-center sm:justify-end gap-5 pt-4 sm:pt-0 border-t border-border sm:border-0 w-full sm:w-auto shrink-0">
                      {/* Tombol Aksi */}
                      <div className="flex items-center gap-2 border-r border-border pr-5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-3 gap-2 rounded-sm shadow-none font-black uppercase tracking-wider text-[10px] text-muted-foreground hover:text-primary border-border bg-background"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="w-3.5 h-3.5" /> EDIT
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-3 gap-2 rounded-sm shadow-none font-black uppercase tracking-wider text-[10px] text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground bg-destructive/5"
                          onClick={() => setDeleteTarget(p)}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> HAPUS
                        </Button>
                      </div>

                      {/* Switch Status */}
                      <div className="flex flex-col items-start sm:items-end gap-1.5 w-24">
                        <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer">
                          {p.is_active ? "STATUS: AKTIF" : "STATUS: NONAKTIF"}
                        </Label>
                        <Switch
                          checked={p.is_active}
                          onCheckedChange={(v) => handleToggle(p.id, v)}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Kontrol Pagination Formal - Box Kaku */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between bg-muted/20 border-2 border-primary/10 p-4 rounded-sm mt-6 gap-4">
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

      {/* Dialog Form Tambah / Edit Formal */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-sm border-2 border-primary/20 sm:max-w-lg p-0 overflow-hidden bg-card">
          <DialogHeader className="px-6 py-5 border-b border-primary/10 bg-muted/40">
            <DialogTitle className="text-base font-black uppercase tracking-wide text-primary">
              {editId ? "Formulir Edit Periode" : "Formulir Tambah Periode"}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-6 space-y-5">
            <div>
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Nama Periode <span className="text-primary">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Misal: SEMESTER GENAP 2025/2026"
                className="mt-1.5 rounded-sm border-2 border-border focus-visible:ring-primary shadow-none h-10 font-bold uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Tanggal Mulai <span className="text-primary">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm({ ...form, start_date: e.target.value })
                  }
                  className="mt-1.5 rounded-sm border-2 border-border focus-visible:ring-primary shadow-none h-10 font-mono font-bold uppercase"
                />
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Tanggal Selesai <span className="text-primary">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm({ ...form, end_date: e.target.value })
                  }
                  className="mt-1.5 rounded-sm border-2 border-border focus-visible:ring-primary shadow-none h-10 font-mono font-bold uppercase"
                />
              </div>
            </div>

            <div>
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Deskripsi / Keterangan (Opsional)
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Tambahkan keterangan tambahan mengenai periode ini..."
                className="mt-1.5 rounded-sm border-2 border-border focus-visible:ring-primary shadow-none h-24 resize-none font-medium p-3"
              />
            </div>
          </div>

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
              disabled={
                !form.name || !form.start_date || !form.end_date || isSubmitting
              }
            >
              {isSubmitting
                ? "MEMPROSES..."
                : editId
                  ? "SIMPAN PERUBAHAN"
                  : "SIMPAN PERIODE"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Hapus Formal */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-sm border-2 border-destructive/20 sm:max-w-md p-0 overflow-hidden bg-card">
          <AlertDialogHeader className="px-6 py-5 border-b border-destructive/10 bg-destructive/5">
            <AlertDialogTitle className="font-black text-base uppercase tracking-wide text-destructive flex items-center gap-2">
              <AlertOctagon className="w-5 h-5" />
              Hapus Periode Akademik
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="px-6 py-5">
            <AlertDialogDescription className="text-sm font-medium text-foreground leading-relaxed">
              Tindakan ini akan menghapus periode akademik{" "}
              <span className="font-black text-destructive uppercase">
                "{deleteTarget?.name}"
              </span>{" "}
              secara permanen dari sistem.
              <br />
              <br />
              <span className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest">
                Catatan: Pastikan tidak ada data yang terikat sebelum menghapus.
              </span>
            </AlertDialogDescription>
          </div>
          <AlertDialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex flex-row justify-end gap-3">
            <AlertDialogCancel className="rounded-sm shadow-none mt-0 font-black uppercase tracking-wider text-xs border-border px-5">
              BATALKAN
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-sm shadow-none bg-destructive text-destructive-foreground hover:bg-destructive/90 font-black uppercase tracking-wider text-xs px-5 m-0"
            >
              {isDeleting ? "MENGHAPUS..." : "YA, HAPUS PERIODE"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
