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
} from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntityList } from "@/lib/hooks/useEntityList";
import { sibaApi } from "@/api/apiClient";
import { useQueryClient } from "@tanstack/react-query";

export default function AvailabilityPage() {
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

  // Tampilkan slot yang:
  // 1. Tanggalnya hari ini atau belum lewat
  // 2. Belum di-booking siapapun (is_available = true)
  // Slot completed sudah otomatis terhapus dari DB oleh backend.
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
      toast.error(err.data?.message || err.message || "Gagal menambahkan slot.");
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

  return (
    <div className="space-y-6">
      {/* Header Halaman Formal */}
      <div className="bg-card border border-border p-5 rounded-md shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Ketersediaan Dosen
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Atur jadwal dan slot ketersediaan bimbingan untuk mahasiswa Anda.
          </p>
        </div>
        <Button
          onClick={() => setShowDialog(true)}
          className="gap-2 rounded-md font-bold shadow-none shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Slot
        </Button>
      </div>

      {activeSlots.length === 0 ? (
        <div className="border border-border rounded-md bg-card">
          <EmptyState
            icon={Calendar}
            title="Belum Ada Slot Ketersediaan"
            description="Tambahkan slot waktu agar mahasiswa dapat mengajukan bimbingan kepada Anda."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {activeSlots
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map((slot) => {
              // Pakai current_bookings langsung dari backend
              const activeBookingsCount = slot.current_bookings ?? 0;
              const isFull = !slot.is_available || activeBookingsCount >= slot.max_students;

              return (
                <Card
                  key={slot.id}
                  className={`rounded-md border shadow-none overflow-hidden transition-none ${
                    isFull
                      ? "border-border/50 bg-muted/30 opacity-60 grayscale-[0.2]"
                      : "border-border bg-card"
                  }`}
                >
                  <CardContent className="p-0">
                    {/* Header Card (Tanggal & Hari) */}
                    <div
                      className={`${isFull ? "bg-muted/50" : "bg-muted/30"} border-b border-border p-3 flex items-start justify-between`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-10 h-10 rounded ${isFull ? "bg-muted" : "bg-background"} border border-border flex flex-col items-center justify-center shrink-0`}
                        >
                          <span
                            className={`text-[9px] font-bold ${isFull ? "text-muted-foreground" : "text-primary"} uppercase leading-none mb-0.5`}
                          >
                            {format(new Date(slot.date), "MMM", {
                              locale: localeId,
                            })}
                          </span>
                          <span className="text-sm font-black text-foreground leading-none">
                            {format(new Date(slot.date), "dd")}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground uppercase tracking-wide">
                            {format(new Date(slot.date), "EEEE", {
                              locale: localeId,
                            })}
                          </p>
                          <p className="text-xs font-medium text-muted-foreground">
                            {format(new Date(slot.date), "dd MMMM yyyy", {
                              locale: localeId,
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Tombol Hapus: Hanya boleh dihapus jika benar-benar belum ada yg booking */}
                      {activeBookingsCount === 0 && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 text-destructive border-transparent hover:border-destructive hover:bg-destructive/10 rounded-sm shrink-0 shadow-none"
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
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2.5 text-sm font-bold text-foreground">
                        <div
                          className={`w-6 h-6 rounded-sm ${isFull ? "bg-muted border border-border" : "bg-primary/10"} flex items-center justify-center`}
                        >
                          <Clock
                            className={`w-3.5 h-3.5 ${isFull ? "text-muted-foreground" : "text-primary"}`}
                          />
                        </div>
                        {slot.start_time} - {slot.end_time} WIB
                      </div>

                      <div className="flex items-center gap-2.5 text-xs font-medium text-muted-foreground">
                        <div className="w-6 h-6 rounded-sm bg-muted flex items-center justify-center">
                          {slot.mode === "online" ? (
                            <Video className="w-3.5 h-3.5 text-foreground" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5 text-foreground" />
                          )}
                        </div>
                        <span className="truncate">
                          {slot.mode === "online" ? "Online" : "Offline"}
                          {slot.location ? ` • ${slot.location}` : ""}
                        </span>
                      </div>

                      {/* Footer Card (Kuota & Status Dinamis) */}
                      <div className="flex items-center justify-between pt-3 mt-1 border-t border-border/50">
                        <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-sm border border-border/50">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-bold text-foreground">
                            {activeBookingsCount}
                            <span className="text-muted-foreground font-medium">
                              /{slot.max_students}
                            </span>
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            !isFull
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 rounded-sm font-bold uppercase text-[9px] px-2 py-0.5 tracking-wider"
                              : "bg-muted text-muted-foreground border-border rounded-sm font-bold uppercase text-[9px] px-2 py-0.5 tracking-wider"
                          }
                        >
                          {!isFull ? "Tersedia" : "Penuh / Nonaktif"}
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
        <DialogContent className="sm:max-w-md rounded-md border-border shadow-lg">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="font-bold text-lg">
              Tambah Slot Ketersediaan
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <Label className="font-bold text-foreground">Tanggal</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1.5 rounded-sm border-border shadow-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-bold text-foreground">Jam Mulai</Label>
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={(e) =>
                    setForm({ ...form, start_time: e.target.value })
                  }
                  className="mt-1.5 rounded-sm border-border shadow-none"
                />
              </div>
              <div>
                <Label className="font-bold text-foreground">Jam Selesai</Label>
                <Input
                  type="time"
                  value={form.end_time}
                  onChange={(e) =>
                    setForm({ ...form, end_time: e.target.value })
                  }
                  className="mt-1.5 rounded-sm border-border shadow-none"
                />
              </div>
            </div>


            <div>
              <Label className="font-bold text-foreground">
                Mode Bimbingan
              </Label>
              <Select
                value={form.mode}
                onValueChange={(v) => setForm({ ...form, mode: v })}
              >
                <SelectTrigger className="mt-1.5 rounded-sm border-border shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-sm border-border">
                  <SelectItem value="offline" className="font-medium">
                    Offline (Tatap Muka)
                  </SelectItem>
                  <SelectItem value="online" className="font-medium">
                    Online (Virtual/Daring)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="font-bold text-foreground">
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
                className="mt-1.5 rounded-sm border-border shadow-none"
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
              onClick={handleCreate}
              disabled={!form.date || !form.start_time || !form.end_time || isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Slot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
