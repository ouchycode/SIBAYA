import React, { useState } from "react";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Calendar,
  Clock,
  Plus,
  Trash2,
  MapPin,
  Video,
  Users,
  CalendarDays,
} from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntityList } from "@/lib/hooks/useEntityList";
import { sibaApi } from "@/api/apiClient";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function AvailabilityPage() {

  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: allSlots = [] } = useEntityList("Slot");

  const slots = allSlots.filter((s) => s.supervisor_email === user?.email);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    date: "",
    start_time: "",
    end_time: "",
    mode: "offline",
    location: "",
  });

  const activeSlots = slots.filter((slot) => {
    if (!slot.date || !slot.start_time) return false;
    const slotDateTime = new Date(`${slot.date}T${slot.start_time}`);
    const isFuture = slotDateTime > new Date();
    return isFuture && slot.is_available === true;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      await sibaApi.entities.Slot.create({
        supervisor_email: user?.email,
        ...form,
        max_students: 1,
        current_bookings: 0,
        is_available: true,
      });
      queryClient.invalidateQueries({ queryKey: ["Slot"] });
      toast.success("Slot berhasil ditambahkan");
      setShowDialog(false);
      setForm({
        date: "",
        start_time: "",
        end_time: "",
        mode: "offline",
        location: "",
      });
    } catch (err) {
      toast.error(
        err.data?.message || err.message || "Gagal menambahkan slot.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setIsDeletingId(id);
    try {
      await sibaApi.entities.Slot.delete(id);
      queryClient.invalidateQueries({ queryKey: ["Slot"] });
      toast.success("Slot berhasil dihapus");
    } catch (err) {
      toast.error(err.data?.message || err.message || "Gagal menghapus slot.");
    } finally {
      setIsDeletingId(null);
    }
  };

  // ==========================================
  // PERUBAHAN PADA UI/UX (FRONTEND KAKU & LEGA)
  // ==========================================
  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Header Halaman */}
      <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1">
            Manajemen Jadwal
          </p>
          <h1 className="text-base font-semibold text-foreground">
            Ketersediaan Dosen
          </h1>
         
        </div>
        <Button
          onClick={() => setShowDialog(true)}
          size="sm"
          className="h-8 px-4 rounded text-xs shadow-none shrink-0"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Tambah Slot
        </Button>
      </div>

      {activeSlots.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Belum ada slot ketersediaan"
          description="Tambahkan slot waktu agar mahasiswa dapat mengajukan reservasi bimbingan kepada Anda."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
          {activeSlots
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map((slot) => {
              const activeBookingsCount = slot.current_bookings ?? 0;
              const isFull =
                !slot.is_available || activeBookingsCount >= slot.max_students;

              return (
                <div
                  key={slot.id}
                  className={cn(
                    "rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden border border-border/50 transition-all",
                    isFull ? "bg-muted/30 opacity-80" : "bg-card",
                  )}
                >
                  {/* Header Slot Card */}
                  <div
                    className={cn(
                      "px-4 py-3 flex items-start justify-between border-b border-border/50",
                      isFull ? "bg-muted/50" : "bg-muted/20",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Ikon Kalender Ala Dokumen */}
                      <div
                        className={cn(
                          "w-10 h-10 rounded flex flex-col items-center justify-center shrink-0 border border-border/50",
                          isFull
                            ? "bg-background text-muted-foreground"
                            : "bg-primary text-primary-foreground border-transparent",
                        )}
                      >
                        <span className="text-[9px] font-semibold uppercase tracking-wider mb-0.5">
                          {format(new Date(slot.date), "MMM", {
                            locale: localeId,
                          })}
                        </span>
                        <span className="text-base font-bold leading-none">
                          {format(new Date(slot.date), "dd")}
                        </span>
                      </div>
                      <div>
                        <p
                          className={cn(
                            "font-semibold text-sm",
                            isFull
                              ? "text-muted-foreground"
                              : "text-foreground",
                          )}
                        >
                          {format(new Date(slot.date), "EEEE", {
                            locale: localeId,
                          })}
                        </p>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5">
                          {format(new Date(slot.date), "dd MMMM yyyy", {
                            locale: localeId,
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Tombol Hapus (Hanya muncul jika belum ada booking) */}
                    {activeBookingsCount === 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive rounded shrink-0 shadow-none -mr-1"
                        onClick={() => handleDelete(slot.id)}
                        disabled={isDeletingId === slot.id}
                        title="Hapus Slot"
                      >
                        {isDeletingId === slot.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Body Card (Detail Waktu & Lokasi) */}
                  <div className="p-4 space-y-3 flex-1">
                    {/* Waktu & Metode (Grid Kotak) */}
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "w-6 h-6 rounded flex items-center justify-center bg-muted",
                        )}
                      >
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">
                          Waktu (WIB)
                        </span>
                        <span className="text-xs font-semibold text-foreground">
                          {slot.start_time} - {slot.end_time}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded flex items-center justify-center bg-muted">
                        {slot.mode === "online" ? (
                          <Video className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">
                          Metode / Lokasi
                        </span>
                        <span className="text-xs font-medium text-foreground truncate">
                          {slot.mode === "online" ? "Daring" : "Luring"}
                          {slot.location ? ` • ${slot.location}` : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Card (Kuota & Status) */}
                  <div className="px-4 py-3 border-t border-border/50 mt-auto bg-muted/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">
                          {activeBookingsCount}
                          <span className="text-muted-foreground font-normal">
                            /{slot.max_students}
                          </span>
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded font-medium text-[10px] px-2 py-0.5 border-0",
                          !isFull
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {!isFull ? "Tersedia" : "Penuh / Tutup"}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Dialog Tambah Slot Formal */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-md border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:max-w-md p-0 overflow-hidden bg-card">
          <DialogHeader className="px-5 py-4 border-b border-border/50">
            <DialogTitle className="text-sm font-semibold text-foreground">
              Formulir Tambah Slot
            </DialogTitle>
          </DialogHeader>

          <div className="px-5 py-4 space-y-4">
            <div>
              <Label className="text-xs font-medium text-foreground">
                Tanggal Bimbingan
              </Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1.5 rounded border-border/60 focus-visible:ring-primary shadow-none h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-foreground">
                  Jam Mulai
                </Label>
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={(e) =>
                    setForm({ ...form, start_time: e.target.value })
                  }
                  className="mt-1.5 rounded border-border/60 focus-visible:ring-primary shadow-none h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-foreground">
                  Jam Selesai
                </Label>
                <Input
                  type="time"
                  value={form.end_time}
                  onChange={(e) =>
                    setForm({ ...form, end_time: e.target.value })
                  }
                  className="mt-1.5 rounded border-border/60 focus-visible:ring-primary shadow-none h-9 text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-foreground">
                Metode Pelaksanaan
              </Label>
              <Select
                value={form.mode}
                onValueChange={(v) => setForm({ ...form, mode: v })}
              >
                <SelectTrigger className="mt-1.5 rounded border-border/60 focus-visible:ring-primary shadow-none h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-md border border-border shadow-md">
                  <SelectItem value="offline" className="text-sm">
                    Luring (Tatap Muka)
                  </SelectItem>
                  <SelectItem value="online" className="text-sm">
                    Daring (Online)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium text-foreground">
                {form.mode === "online"
                  ? "Link Meeting (Tautan)"
                  : "Lokasi Ruangan"}
              </Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder={
                  form.mode === "online"
                    ? "https://meet.google.com/..."
                    : "Misal: Ruang Dosen Gedung A Lt.2"
                }
                className="mt-1.5 rounded border-border/60 focus-visible:ring-primary shadow-none h-9 text-sm"
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
              onClick={handleCreate}
              disabled={
                !form.date || !form.start_time || !form.end_time || isSubmitting
              }
            >
              {isSubmitting ? "Memproses..." : "Simpan Slot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
