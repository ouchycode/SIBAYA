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
import { Skeleton } from "@/components/ui/skeleton";

export default function PeriodsPage() {
  const queryClient = useQueryClient();
  const { data: periods = [], isLoading: isLoadingPeriods } =
    useEntityList("Period");

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

  if (isLoadingPeriods) {
    return (
      <div className="space-y-5 max-w-7xl">
        <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-8 w-32 rounded shrink-0" />
        </div>
        <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="divide-y divide-border/40">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex justify-between items-center p-5 gap-4"
              >
                <div className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded shrink-0" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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

  const totalPages = Math.ceil((periods?.length || 0) / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentPeriods = (periods || []).slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const safeFormatDate = (dateStr) => {
    try {
      if (!dateStr) return "-";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "-";
      return format(d, "dd MMM yyyy", { locale: localeId });
    } catch (e) {
      return "-";
    }
  };

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header Halaman */}
      <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">
            Manajemen Periode
          </p>
          <h1 className="text-base font-semibold text-foreground">
            Periode Akademik
          </h1>
        </div>
        <Button
          onClick={openCreate}
          size="sm"
          className="h-8 px-4 rounded text-xs shadow-none shrink-0"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Tambah Periode
        </Button>
      </div>

      {periods.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Belum ada periode akademik"
          description="Buat periode bimbingan baru (misal: Semester Genap 2025/2026) untuk memulai operasional sistem."
        />
      ) : (
        <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/50">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              Daftar Periode
            </h2>
          </div>

          <div className="divide-y divide-border/40">
            {currentPeriods.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 hover:bg-muted/40 transition-colors",
                  p.is_active && "bg-primary/[0.02]",
                )}
              >
                {/* Detail Informasi */}
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded flex items-center justify-center shrink-0",
                      p.is_active
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <CalendarDays className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-foreground">
                        {p.name}
                      </p>
                      {p.is_active && (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {safeFormatDate(p.start_date)}
                      <span>—</span>
                      {safeFormatDate(p.end_date)}
                    </p>
                    {p.description && (
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                        {p.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Aksi & Status Toggle */}
                <div className="flex items-center sm:justify-end gap-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-md text-muted-foreground hover:text-primary"
                      onClick={() => openEdit(p)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget(p)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="w-px h-6 bg-border" />

                  <div className="flex items-center gap-2">
                    <Label className="text-[11px] font-medium text-muted-foreground cursor-pointer">
                      {p.is_active ? "Aktif" : "Nonaktif"}
                    </Label>
                    <Switch
                      checked={p.is_active}
                      onCheckedChange={(v) => handleToggle(p.id, v)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3.5 border-t border-border/50 flex items-center justify-between bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Halaman {currentPage} dari {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 rounded text-xs shadow-none border-border/60 hover:bg-background"
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
                  className="h-8 px-3 rounded text-xs shadow-none border-border/60 hover:bg-background"
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

      {/* Dialog Form Tambah / Edit */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-md border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:max-w-md p-0 overflow-hidden bg-card">
          <DialogHeader className="px-5 py-4 border-b border-border/50">
            <DialogTitle className="text-sm font-semibold text-foreground">
              {editId ? "Edit Periode" : "Tambah Periode"}
            </DialogTitle>
          </DialogHeader>

          <div className="px-5 py-4 space-y-4">
            <div>
              <Label className="text-xs font-medium text-foreground">
                Nama Periode <span className="text-primary">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Misal: Semester Genap 2025/2026"
                className="mt-1.5 rounded h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-foreground">
                  Tanggal Mulai <span className="text-primary">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm({ ...form, start_date: e.target.value })
                  }
                  className="mt-1.5 rounded h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-foreground">
                  Tanggal Selesai <span className="text-primary">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm({ ...form, end_date: e.target.value })
                  }
                  className="mt-1.5 rounded h-9 text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-foreground">
                Deskripsi (Opsional)
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Keterangan tambahan..."
                className="mt-1.5 rounded h-20 text-sm resize-none"
              />
            </div>
          </div>

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
              disabled={
                !form.name || !form.start_date || !form.end_date || isSubmitting
              }
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Hapus */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-md border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:max-w-md p-0 overflow-hidden bg-card">
          <AlertDialogHeader className="px-5 py-4 border-b border-border/50">
            <AlertDialogTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-destructive" />
              Hapus Periode
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm mt-1">
              Tindakan ini akan menghapus periode akademik{" "}
              <span className="font-semibold text-foreground">
                "{deleteTarget?.name}"
              </span>{" "}
              secara permanen. Pastikan tidak ada data yang terikat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="px-5 py-3.5 border-t border-border/50 bg-muted/20 flex flex-row justify-end gap-2">
            <AlertDialogCancel className="rounded text-xs mt-0">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
