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
  // ==========================================
  // LOGIKA TETAP UTUH (TIDAK ADA YANG DIUBAH)
  // ==========================================
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: allSlots = [] } = useEntityList("Slot");

  const slots = allSlots;
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    date: "",
    start_time: "",
    end_time: "",
    mode: "offline",
    location: "",
  });

  const activeSlots = slots.filter((slot) => {
    const isFutureOrToday = !isBefore(
      new Date(slot.date),
      startOfDay(new Date()),
    );
    return isFutureOrToday && slot.is_available === true;
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
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Halaman Formal & Lega */}
      <div className="bg-card border border-primary/15 p-6 sm:p-8 rounded-sm shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
        <div className="pl-2">
          <h1 className="text-2xl font-black text-primary uppercase tracking-tight">
            Manajemen Ketersediaan Dosen
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-2 border-l-2 border-primary/30 pl-3">
            Atur dan rilis slot ketersediaan waktu bimbingan akademik untuk
            mahasiswa Anda.
          </p>
        </div>
        <Button
          onClick={() => setShowDialog(true)}
          className="h-10 px-6 gap-2 rounded-sm font-black uppercase tracking-wider shadow-none border-2 border-transparent shrink-0"
        >
          <Plus className="w-4 h-4" /> TAMBAH SLOT
        </Button>
      </div>

      {activeSlots.length === 0 ? (
        <div className="border border-border rounded-sm bg-card mt-6">
          <EmptyState
            icon={CalendarDays}
            title="BELUM ADA SLOT KETERSEDIAAN"
            description="Tambahkan slot waktu agar mahasiswa dapat mengajukan reservasi bimbingan kepada Anda."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          {activeSlots
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map((slot) => {
              const activeBookingsCount = slot.current_bookings ?? 0;
              const isFull =
                !slot.is_available || activeBookingsCount >= slot.max_students;

              return (
                <Card
                  key={slot.id}
                  className={cn(
                    "rounded-sm border-2 shadow-sm overflow-hidden flex flex-col transition-all",
                    isFull
                      ? "border-border bg-muted/20 opacity-80"
                      : "border-primary/10 bg-card hover:border-primary/30",
                  )}
                >
                  <CardContent className="p-0 flex flex-col h-full">
                    {/* Header Slot Card - Solid Tabular */}
                    <div
                      className={cn(
                        "border-b-2 px-5 py-4 flex items-start justify-between border-l-4",
                        isFull
                          ? "bg-muted/40 border-border border-l-muted-foreground"
                          : "bg-muted/30 border-primary/10 border-l-primary",
                      )}
                    >
                      <div className="flex items-center gap-4">
                        {/* Ikon Kalender Ala Dokumen */}
                        <div
                          className={cn(
                            "w-12 h-12 rounded-sm flex flex-col items-center justify-center shrink-0 border shadow-inner",
                            isFull
                              ? "bg-muted text-muted-foreground border-border"
                              : "bg-primary text-primary-foreground border-primary-foreground/20",
                          )}
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest leading-none opacity-80 mb-0.5">
                            {format(new Date(slot.date), "MMM", {
                              locale: localeId,
                            })}
                          </span>
                          <span className="text-lg font-black leading-none">
                            {format(new Date(slot.date), "dd")}
                          </span>
                        </div>
                        <div>
                          <p
                            className={cn(
                              "font-black text-sm uppercase tracking-wider",
                              isFull
                                ? "text-muted-foreground"
                                : "text-foreground",
                            )}
                          >
                            {format(new Date(slot.date), "EEEE", {
                              locale: localeId,
                            })}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                            {format(new Date(slot.date), "dd MMMM yyyy", {
                              locale: localeId,
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Tombol Hapus (Hanya muncul jika belum ada booking) */}
                      {activeBookingsCount === 0 && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-destructive border-destructive/20 hover:border-destructive hover:bg-destructive hover:text-destructive-foreground rounded-sm shrink-0 shadow-none bg-destructive/5 transition-colors"
                          onClick={() => handleDelete(slot.id)}
                          disabled={isDeletingId === slot.id}
                          title="Hapus Slot"
                        >
                          {isDeletingId === slot.id ? (
                            <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Body Card (Detail Waktu & Lokasi) */}
                    <div className="p-5 space-y-4 flex-1">
                      {/* Waktu & Metode (Grid Kotak) */}
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center gap-3 bg-background border-2 border-border p-2.5 rounded-sm">
                          <div
                            className={cn(
                              "w-7 h-7 rounded-sm flex items-center justify-center border",
                              isFull
                                ? "bg-muted border-border"
                                : "bg-primary/10 border-primary/20",
                            )}
                          >
                            <Clock
                              className={cn(
                                "w-4 h-4",
                                isFull
                                  ? "text-muted-foreground"
                                  : "text-primary",
                              )}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                              Waktu (WIB)
                            </span>
                            <span className="text-sm font-mono font-black text-foreground">
                              {slot.start_time} - {slot.end_time}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 bg-muted/30 border border-border/50 p-2.5 rounded-sm">
                          <div className="w-7 h-7 rounded-sm bg-muted border border-border flex items-center justify-center">
                            {slot.mode === "online" ? (
                              <Video className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                              Metode / Lokasi
                            </span>
                            <span className="text-xs font-bold text-foreground truncate uppercase">
                              {slot.mode === "online" ? "DARING" : "LURING"}
                              {slot.location ? ` • ${slot.location}` : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Card (Kuota & Status) */}
                    <div className="p-5 pt-0 mt-auto">
                      <div className="flex items-center justify-between pt-4 border-t-2 border-border/50">
                        <div className="flex items-center gap-2 bg-muted/50 px-2.5 py-1.5 rounded-sm border border-border">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-black text-foreground">
                            {activeBookingsCount}
                            <span className="text-muted-foreground font-bold">
                              /{slot.max_students}
                            </span>
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-sm font-black uppercase text-[10px] px-2.5 py-1 tracking-widest",
                            !isFull
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : "bg-muted text-muted-foreground border-border",
                          )}
                        >
                          {!isFull ? "TERSEDIA" : "PENUH / TUTUP"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      {/* Dialog Tambah Slot Formal */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-sm border-2 border-primary/20 sm:max-w-md p-0 overflow-hidden bg-card">
          <DialogHeader className="px-6 py-5 border-b border-primary/10 bg-muted/40">
            <DialogTitle className="text-base font-black uppercase tracking-wide text-primary">
              Formulir Tambah Slot
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-6 space-y-5">
            <div>
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Tanggal Bimbingan
              </Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1.5 rounded-sm border-2 border-border focus-visible:ring-primary shadow-none h-10 font-medium px-3 uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Jam Mulai
                </Label>
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={(e) =>
                    setForm({ ...form, start_time: e.target.value })
                  }
                  className="mt-1.5 rounded-sm border-2 border-border focus-visible:ring-primary shadow-none h-10 font-mono font-bold px-3"
                />
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Jam Selesai
                </Label>
                <Input
                  type="time"
                  value={form.end_time}
                  onChange={(e) =>
                    setForm({ ...form, end_time: e.target.value })
                  }
                  className="mt-1.5 rounded-sm border-2 border-border focus-visible:ring-primary shadow-none h-10 font-mono font-bold px-3"
                />
              </div>
            </div>

            <div>
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Metode Pelaksanaan
              </Label>
              <Select
                value={form.mode}
                onValueChange={(v) => setForm({ ...form, mode: v })}
              >
                <SelectTrigger className="mt-1.5 rounded-sm border-2 border-border focus-visible:ring-primary shadow-none h-10 font-bold text-xs uppercase px-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-sm border-2 border-border shadow-md">
                  <SelectItem
                    value="offline"
                    className="font-bold text-xs uppercase tracking-wider focus:bg-primary/10"
                  >
                    Luring (Tatap Muka)
                  </SelectItem>
                  <SelectItem
                    value="online"
                    className="font-bold text-xs uppercase tracking-wider focus:bg-primary/10"
                  >
                    Daring (Online)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
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
                className="mt-1.5 rounded-sm border-2 border-border focus-visible:ring-primary shadow-none h-10 font-medium px-3"
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-primary/10 bg-muted/20 flex flex-row justify-end gap-3">
            <Button
              variant="outline"
              className="rounded-sm shadow-none font-bold uppercase tracking-wider text-xs border-border px-5"
              onClick={() => setShowDialog(false)}
            >
              BATALKAN
            </Button>
            <Button
              className="rounded-sm shadow-none font-bold uppercase tracking-wider text-xs px-5"
              onClick={handleCreate}
              disabled={
                !form.date || !form.start_time || !form.end_time || isSubmitting
              }
            >
              {isSubmitting ? "MEMPROSES..." : "SIMPAN SLOT"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
