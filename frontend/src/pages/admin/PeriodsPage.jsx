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
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { useEntityList } from "@/lib/hooks/useEntityList";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

export default function PeriodsPage() {
  const queryClient = useQueryClient();
  const { data: periods = [] } = useEntityList("Period");

  // State untuk Dialog Form (Create/Edit)
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    description: "",
  });

  // State untuk Alert Hapus
  const [deleteTarget, setDeleteTarget] = useState(null);

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
    try {
      if (editId) {
        await base44.entities.Period.update(editId, form);
        toast.success("Periode berhasil diperbarui");
      } else {
        await base44.entities.Period.create({
          ...form,
          is_active: false,
        });
        toast.success("Periode berhasil dibuat");
      }
      queryClient.invalidateQueries({ queryKey: ["Period"] });
      setShowDialog(false);
    } catch (error) {
      toast.error("Gagal menyimpan periode");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await base44.entities.Period.delete(deleteTarget.id);
      toast.success("Periode berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["Period"] });
    } catch (error) {
      toast.error(
        "Gagal menghapus periode. Pastikan tidak ada jadwal yang terikat pada periode ini.",
      );
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleToggle = async (id, active) => {
    try {
      if (active) {
        // Nonaktifkan semua periode lain jika yang satu ini diaktifkan
        await Promise.all(
          periods
            .filter((p) => p.id !== id && p.is_active)
            .map((p) =>
              base44.entities.Period.update(p.id, { is_active: false }),
            ),
        );
      }
      await base44.entities.Period.update(id, { is_active: active });
      queryClient.invalidateQueries({ queryKey: ["Period"] });
      toast.success(
        active ? "Periode telah diaktifkan" : "Periode dinonaktifkan",
      );
    } catch (error) {
      toast.error("Gagal memperbarui status periode");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman Formal */}
      <div className="bg-card border border-border p-5 rounded-md shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Manajemen Periode
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Atur kalender dan periode aktif bimbingan akademik kampus.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 rounded-sm font-bold shadow-none shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Periode
        </Button>
      </div>

      {periods.length === 0 ? (
        <div className="border border-border rounded-md bg-card">
          <EmptyState
            icon={Calendar}
            title="Belum Ada Periode Akademik"
            description="Buat periode bimbingan (misal: Semester Genap 2025/2026) untuk memulai sistem."
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-5 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-8">Informasi Periode</div>
            <div className="col-span-4 text-right">Kontrol & Status</div>
          </div>

          {periods.map((p) => (
            <Card
              key={p.id}
              className={`rounded-md shadow-none transition-none ${
                p.is_active
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded flex items-center justify-center shrink-0 border ${
                        p.is_active
                          ? "bg-primary/20 border-primary/30"
                          : "bg-muted border-border"
                      }`}
                    >
                      <CalendarDays
                        className={`w-5 h-5 ${p.is_active ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-base text-foreground">
                          {p.name}
                        </p>
                        {p.is_active && (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 border-emerald-300 gap-1 rounded-sm font-bold uppercase tracking-wider text-[9px] px-2 py-0"
                          >
                            <CheckCircle className="w-3 h-3" /> Berjalan
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(p.start_date), "dd MMMM yyyy", {
                          locale: localeId,
                        })}
                        <span className="mx-1 font-bold">—</span>
                        {format(new Date(p.end_date), "dd MMMM yyyy", {
                          locale: localeId,
                        })}
                      </p>

                      {p.description && (
                        <p className="text-sm text-foreground/80 mt-2 font-medium italic">
                          "{p.description}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center sm:justify-end gap-3 pt-4 sm:pt-0 border-t border-border sm:border-0 w-full sm:w-auto">
                    {/* Tombol Aksi */}
                    <div className="flex items-center gap-1 mr-2 border-r border-border pr-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(p)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase cursor-pointer">
                        {p.is_active ? "Aktif" : "Nonaktif"}
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
      )}

      {/* Dialog Form Tambah / Edit */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-md border-border sm:max-w-md">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="font-bold text-lg">
              {editId ? "Edit Periode Bimbingan" : "Tambah Periode Bimbingan"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <Label className="font-bold text-foreground">Nama Periode</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Misal: Semester Genap 2025/2026"
                className="mt-1.5 rounded-sm border-border shadow-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-bold text-foreground">
                  Tanggal Mulai
                </Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm({ ...form, start_date: e.target.value })
                  }
                  className="mt-1.5 rounded-sm border-border shadow-none"
                />
              </div>
              <div>
                <Label className="font-bold text-foreground">
                  Tanggal Selesai
                </Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm({ ...form, end_date: e.target.value })
                  }
                  className="mt-1.5 rounded-sm border-border shadow-none"
                />
              </div>
            </div>

            <div>
              <Label className="font-bold text-foreground">
                Deskripsi (Opsional)
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Keterangan tambahan..."
                className="mt-1.5 rounded-sm border-border shadow-none resize-none h-20"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-4 sm:justify-end gap-2">
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
              disabled={!form.name || !form.start_date || !form.end_date}
            >
              {editId ? "Simpan Perubahan" : "Simpan Periode"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Hapus */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-md border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-destructive">
              Hapus Periode?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus periode{" "}
              <span className="font-bold text-foreground">
                "{deleteTarget?.name}"
              </span>{" "}
              secara permanen. Data jadwal atau bimbingan yang terhubung mungkin
              akan terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm font-bold">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-sm font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
