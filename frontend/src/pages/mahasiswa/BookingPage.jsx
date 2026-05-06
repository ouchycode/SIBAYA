import React, { useState } from "react";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CalendarDays, Clock, Video, MapPin, Plus } from "lucide-react";
import { format, parseISO, startOfDay } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntityList } from "@/lib/hooks/useEntityList";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

export default function BookingPage() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: slots = [] } = useEntityList("Slot");
  const { data: mappings = [] } = useEntityList("Mapping");

  const { data: allBookings = [] } = useEntityList("Booking");

  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");

  const supervisor = mappings.find(
    (m) => m.student_email === user?.email && m.status === "active",
  );

  const today = startOfDay(new Date());

  const availableSlots = slots.filter((s) => {
    if (!supervisor) return false;

    const isCorrectSupervisor =
      s.supervisor_email === supervisor.supervisor_email;
    const isFutureOrToday = startOfDay(parseISO(s.date)) >= today;

    const activeBookingsCount = allBookings.filter(
      (b) =>
        b.slot_id === s.id &&
        ["pending", "approved", "completed"].includes(b.status),
    ).length;

    const isNotFull = activeBookingsCount < s.max_students;

    return isCorrectSupervisor && isFutureOrToday && isNotFull;
  });

  const grouped = availableSlots.reduce((acc, slot) => {
    acc[slot.date] = acc[slot.date] || [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  const handleBook = async () => {
    if (!selected || !user || !supervisor) return;

    await base44.entities.Booking.create({
      student_email: user.email,
      student_name: user.full_name || user.name || user.email,
      supervisor_email: supervisor.supervisor_email,
      supervisor_name: supervisor.supervisor_name,
      slot_id: selected.id,
      date: selected.date,
      start_time: selected.start_time,
      end_time: selected.end_time,
      mode: selected.mode,
      location: selected.location,
      status: "pending",
      notes,
      period_id: supervisor.period_id || null,
    });

    queryClient.invalidateQueries({ queryKey: ["Booking"] });
    toast.success("Booking berhasil diajukan! Menunggu persetujuan dosen.");
    setSelected(null);
    setNotes("");
  };

  if (!supervisor) {
    return (
      <div className="space-y-6">
        <div className="bg-card border border-border p-5 rounded-md shadow-sm">
          <h1 className="text-2xl font-bold text-foreground">
            Booking Bimbingan
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Pilih jadwal bimbingan yang telah disediakan oleh dosen pembimbing
            Anda.
          </p>
        </div>
        <div className="border border-border rounded-md bg-card">
          <EmptyState
            icon={CalendarDays}
            title="Belum Ada Dosen Pembimbing"
            description="Hubungi Biro Akademik (Admin) untuk mendapatkan alokasi dosen pembimbing sebelum dapat melakukan booking."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="bg-card border border-border p-5 rounded-md shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Booking Jadwal Bimbingan
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Pilih dan ajukan jadwal dari slot yang tersedia.
          </p>
        </div>
        <div className="bg-primary/5 border border-primary/20 px-3 py-2 rounded-sm shrink-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Dosen Pembimbing
          </p>
          <p className="text-sm font-bold text-primary">
            {supervisor.supervisor_name}
          </p>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="border border-border rounded-md bg-card">
          <EmptyState
            icon={CalendarDays}
            title="Tidak Ada Slot Tersedia"
            description="Dosen pembimbing Anda belum membuka slot bimbingan baru untuk saat ini."
          />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped)
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .map(([date, dateSlots]) => (
              <div
                key={date}
                className="bg-card border border-border p-5 rounded-md shadow-sm"
              >
                <h2 className="text-sm font-black text-foreground mb-4 uppercase tracking-wider border-b border-border pb-3 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  {format(parseISO(date), "EEEE, dd MMMM yyyy", {
                    locale: localeId,
                  })}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {dateSlots.map((slot) => {
                    // Hitung Sisa Kuota untuk Label
                    const activeBookingsCount = allBookings.filter(
                      (b) =>
                        b.slot_id === slot.id &&
                        ["pending", "approved", "completed"].includes(b.status),
                    ).length;
                    const sisaKuota = slot.max_students - activeBookingsCount;

                    return (
                      <Card
                        key={slot.id}
                        className="border border-border shadow-none rounded-md bg-background flex flex-col"
                      >
                        <CardContent className="p-4 flex flex-col h-full">
                          <div className="flex items-start justify-between mb-3 gap-2">
                            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-2 py-1 rounded-sm">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              <span className="font-bold text-sm text-primary">
                                {slot.start_time} - {slot.end_time}
                              </span>
                            </div>

                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[9px] font-bold uppercase tracking-wider rounded-sm shrink-0"
                            >
                              Tersedia {sisaKuota} Slot
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-bold text-foreground bg-muted/50 p-2.5 rounded-sm border border-border/50 mb-4">
                            {slot.mode === "online" ? (
                              <Video className="w-4 h-4 text-blue-500 shrink-0" />
                            ) : (
                              <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                            )}
                            <span className="truncate">
                              {slot.mode === "online"
                                ? "Online (Daring)"
                                : `Offline: ${slot.location}`}
                            </span>
                          </div>

                          <div className="mt-auto pt-2 border-t border-border">
                            <Button
                              size="sm"
                              className="w-full gap-2 rounded-sm font-bold shadow-none"
                              onClick={() => setSelected(slot)}
                            >
                              <Plus className="w-4 h-4" /> Pilih Jadwal Ini
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Dialog Konfirmasi (Tetap Utuh) */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="rounded-md border-border sm:max-w-md">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-lg font-bold">
              Konfirmasi Ajukan Bimbingan
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-md bg-muted/30 border border-border text-sm space-y-3">
                <div className="grid grid-cols-[80px_1fr] items-baseline border-b border-border/50 pb-2">
                  <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                    Tanggal
                  </span>
                  <span className="font-bold text-foreground">
                    {format(parseISO(selected.date), "dd MMMM yyyy", {
                      locale: localeId,
                    })}
                  </span>
                </div>
                <div className="grid grid-cols-[80px_1fr] items-baseline border-b border-border/50 pb-2">
                  <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                    Waktu
                  </span>
                  <span className="font-bold text-foreground">
                    {selected.start_time} - {selected.end_time} WIB
                  </span>
                </div>
                <div className="grid grid-cols-[80px_1fr] items-baseline border-b border-border/50 pb-2">
                  <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                    Mode
                  </span>
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    {selected.mode === "online" ? (
                      <>
                        <Video className="w-3.5 h-3.5" /> Online (Daring)
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3.5 h-3.5" /> Offline (Tatap Muka)
                      </>
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-[80px_1fr] items-baseline">
                  <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                    Lokasi
                  </span>
                  <span className="font-bold text-foreground">
                    {selected.location}
                  </span>
                </div>
              </div>

              <div>
                <Label className="font-bold text-foreground">
                  Topik / Catatan Pengajuan (Opsional)
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Bimbingan Bab 1 terkait perbaikan latar belakang..."
                  className="mt-1.5 rounded-sm border-border shadow-none resize-none h-20"
                />
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-border pt-4 sm:justify-end gap-2 mt-2">
            <Button
              variant="outline"
              className="rounded-sm shadow-none font-bold"
              onClick={() => setSelected(null)}
            >
              Batal
            </Button>
            <Button
              className="rounded-sm shadow-none font-bold"
              onClick={handleBook}
            >
              Kirim Pengajuan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
