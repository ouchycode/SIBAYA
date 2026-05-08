import React, { useState } from "react";
import EmptyState from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CalendarDays,
  Clock,
  Video,
  MapPin,
  Plus,
  Loader2,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { format, parseISO, startOfDay } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntityList } from "@/lib/hooks/useEntityList";
import { sibaApi } from "@/api/apiClient";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookingPage() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: slots = [], isLoading: isSlotsLoading } = useEntityList("Slot");
  const { data: mappings = [], isLoading: isMappingsLoading } =
    useEntityList("Mapping");
  const { data: allBookings = [], isLoading: isBookingsLoading } =
    useEntityList("Booking");

  const isDataLoading =
    isSlotsLoading || isMappingsLoading || isBookingsLoading;

  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  const supervisor = mappings.find(
    (m) => m.student_email === user?.email && m.status === "active",
  );

  const today = startOfDay(new Date());

  const hasActiveBooking = allBookings.some(
    (b) =>
      b.student_email === user?.email &&
      ["pending", "approved"].includes(b.status),
  );

  const availableSlots = slots.filter((s) => {
    if (!supervisor || !s.date || !s.start_time) return false;
    const isCorrectSupervisor =
      s.supervisor_email === supervisor.supervisor_email;
    const slotDateTime = new Date(`${s.date}T${s.start_time}`);
    const isFuture = slotDateTime > new Date();
    const isStillAvailable = s.is_available === true;
    return isCorrectSupervisor && isFuture && isStillAvailable;
  });

  const grouped = availableSlots.reduce((acc, slot) => {
    acc[slot.date] = acc[slot.date] || [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  const handleBook = async () => {
    if (!selected || !user || !supervisor) return;
    setIsBooking(true);
    try {
      await sibaApi.entities.Booking.create({
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
      queryClient.invalidateQueries({ queryKey: ["Slot"] });
      queryClient.invalidateQueries({ queryKey: ["Booking"] });
      toast.success("Booking berhasil diajukan! Menunggu persetujuan dosen.");
      setSelected(null);
      setNotes("");
    } catch (err) {
      toast.error(
        err.data?.message || err.message || "Gagal mengajukan booking.",
      );
    } finally {
      setIsBooking(false);
    }
  };

  if (isDataLoading) {
    return (
      <div className="space-y-5 max-w-7xl">
        <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-12 w-48" />
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden"
            >
              <div className="px-5 py-3.5 border-b border-border/50">
                <Skeleton className="h-5 w-48" />
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-32 w-full rounded-md" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!supervisor) {
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 flex items-start gap-4 border-l-2 border-destructive">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Akses booking diblokir
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Anda belum dialokasikan ke dosen pembimbing pada periode akademik
              saat ini. Hubungi BAAK untuk informasi lebih lanjut.
            </p>
          </div>
        </div>
        <EmptyState
          icon={UserCheck}
          title="Belum ada alokasi pembimbing"
          description="Harap hubungi Biro Administrasi Akademik (BAAK) atau Program Studi terkait."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">
            Booking Bimbingan
          </p>
          <h1 className="text-base font-semibold text-foreground">
            Pilih Slot Jadwal Tersedia
          </h1>
        </div>

        <div className="flex items-center gap-3 bg-muted/50 rounded px-4 py-3 shrink-0">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">
              Dosen Pembimbing
            </p>
            <p className="text-sm font-medium text-foreground">
              {supervisor.supervisor_name}
            </p>
          </div>
        </div>
      </div>

      {/* Slot List */}
      {Object.keys(grouped).length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Jadwal tidak tersedia"
          description="Dosen pembimbing Anda belum merilis slot waktu bimbingan untuk periode ini."
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped)
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .map(([date, dateSlots]) => (
              <div
                key={date}
                className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden"
              >
                {/* Tanggal header */}
                <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/50">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">
                    {format(parseISO(date), "EEEE, dd MMMM yyyy", {
                      locale: localeId,
                    })}
                  </h2>
                </div>

                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {dateSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="border border-border/60 rounded-md p-4 bg-background flex flex-col gap-3 hover:border-primary/30 hover:shadow-[0_1px_6px_rgba(0,0,0,0.07)] transition-all"
                    >
                      {/* Waktu + badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="font-mono text-sm font-semibold text-foreground">
                            {slot.start_time} – {slot.end_time}
                          </span>
                        </div>
                        <span className="text-[10px] text-white bg-green-500 border border-green-600 px-2 py-0.5 rounded font-medium">
                          Tersedia
                        </span>
                      </div>

                      {/* Mode */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {slot.mode === "online" ? (
                          <Video className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>
                          {slot.mode === "online"
                            ? "Online"
                            : `Luring${slot.location ? ` · ${slot.location}` : ""}`}
                        </span>
                      </div>

                      {/* Tombol */}
                      <Button
                        size="sm"
                        variant={hasActiveBooking ? "outline" : "default"}
                        className="w-full rounded h-8 text-xs mt-auto"
                        onClick={() => setSelected(slot)}
                        disabled={hasActiveBooking}
                        title={
                          hasActiveBooking
                            ? "Anda memiliki bimbingan aktif"
                            : ""
                        }
                      >
                        {hasActiveBooking ? (
                          "Kuota aktif penuh"
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 mr-1.5" />
                            Pilih slot ini
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Dialog Konfirmasi */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="rounded-md border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:max-w-md p-0 overflow-hidden bg-card">
          <DialogHeader className="px-5 py-4 border-b border-border/50">
            <DialogTitle className="text-sm font-semibold text-foreground">
              Konfirmasi Pengajuan Bimbingan
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="px-5 py-4 space-y-4">
              {/* Ringkasan */}
              <div className="bg-muted/40 rounded p-4 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Tanggal</span>
                  <span className="font-medium text-foreground">
                    {format(parseISO(selected.date), "dd MMMM yyyy", {
                      locale: localeId,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Waktu</span>
                  <span className="font-mono font-semibold text-foreground">
                    {selected.start_time} – {selected.end_time} WIB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Metode</span>
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    {selected.mode === "online" ? (
                      <>
                        <Video className="w-3.5 h-3.5" /> Online
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3.5 h-3.5" /> Luring
                      </>
                    )}
                  </span>
                </div>
                {selected.location && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">
                      Lokasi
                    </span>
                    <span className="font-medium text-foreground">
                      {selected.location}
                    </span>
                  </div>
                )}
              </div>

              {/* Catatan */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Topik / Catatan
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Deskripsikan progres atau bab yang akan didiskusikan..."
                  className="rounded h-24 text-sm resize-none"
                />
                <p className="text-[11px] text-muted-foreground">
                  Pastikan catatan relevan dengan progres logbook terakhir Anda.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="px-5 py-3.5 border-t border-border/50 flex flex-row justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded text-xs"
              onClick={() => setSelected(null)}
            >
              Batal
            </Button>
            <Button
              size="sm"
              className="rounded text-xs"
              onClick={handleBook}
              disabled={isBooking}
            >
              {isBooking ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />{" "}
                  Memproses...
                </>
              ) : (
                "Kirim Pengajuan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
