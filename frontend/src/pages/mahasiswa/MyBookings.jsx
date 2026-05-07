import React, { useState } from "react";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CalendarDays,
  Clock,
  Video,
  MapPin,
  X,
  Bookmark,
  Loader2,
  UserCheck,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale"; // Import untuk format tanggal Indonesia
import { toast } from "sonner";
import { useEntityList } from "@/lib/hooks/useEntityList";
import { sibaApi } from "@/api/apiClient";
import { useQueryClient } from "@tanstack/react-query";

export default function MyBookings() {
  // ==========================================
  // LOGIKA TETAP UTUH (TIDAK ADA YANG DIUBAH)
  // ==========================================
  const queryClient = useQueryClient();
  const { data: allBookings = [] } = useEntityList("Booking");
  const [cancellingId, setCancellingId] = useState(null);

  const activeBookings = allBookings
    .filter((b) => ["pending", "approved"].includes(b.status))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const handleCancel = async (id) => {
    setCancellingId(id);
    try {
      await sibaApi.entities.Booking.update(id, { status: "cancelled" });
      queryClient.invalidateQueries({ queryKey: ["Booking"] });
      queryClient.invalidateQueries({ queryKey: ["Slot"] });
      toast.success("Booking berhasil dibatalkan.");
    } catch (err) {
      toast.error(
        err.data?.message || err.message || "Gagal membatalkan booking.",
      );
    } finally {
      setCancellingId(null);
    }
  };

  // ==========================================
  // PERUBAHAN PADA UI/UX (FRONTEND KAKU & RAPI)
  // ==========================================
  const BookingCard = ({ b }) => (
    <Card className="rounded-sm border-2 border-primary/10 shadow-sm mb-4 bg-card overflow-hidden">
      <CardContent className="p-0">
        {/* Header Kartu Booking - Identitas Tanggal */}
        <div className="bg-muted/40 border-b border-primary/10 px-5 py-3 flex items-center justify-between gap-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-primary" />
            <p className="text-sm font-black text-foreground uppercase tracking-wider">
              {format(new Date(b.date), "EEEE, dd MMMM yyyy", {
                locale: localeId,
              })}
            </p>
          </div>
          {/* Status Badge pindah ke header untuk visibilitas cepat */}
          <StatusBadge status={b.status} />
        </div>

        <div className="p-5 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          {/* Informasi Detail */}
          <div className="space-y-4 flex-1">
            {/* Waktu & Mode - Gaya Badge Kaku */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                  Waktu (WIB)
                </span>
                <span className="text-xs font-mono font-black bg-primary/10 text-primary px-2.5 py-1 rounded-sm border border-primary/20 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  {b.start_time} - {b.end_time}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                  Metode Pelaksanaan
                </span>
                <span className="text-xs font-bold text-foreground uppercase bg-muted/50 px-2.5 py-1 rounded-sm border border-border flex items-center gap-2">
                  {b.mode === "online" ? (
                    <Video className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  {b.mode === "online"
                    ? "DARING (ONLINE)"
                    : "LURING (TATAP MUKA)"}
                </span>
              </div>
            </div>

            {/* Dosen Pembimbing */}
            <div className="flex items-center gap-2 text-xs">
              <UserCheck className="w-4 h-4 text-muted-foreground" />
              <span className="font-bold text-muted-foreground uppercase tracking-wider">
                Dosen:
              </span>
              <span className="font-black text-foreground uppercase tracking-wide">
                {b.supervisor_name}
              </span>
            </div>
          </div>

          {/* Tombol Aksi - Hanya muncul jika pending */}
          <div className="flex shrink-0">
            {b.status === "pending" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 rounded-sm text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground font-black uppercase tracking-wider shadow-none w-full sm:w-auto"
                    disabled={cancellingId === b.id}
                  >
                    {cancellingId === b.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <X className="w-4 h-4 mr-2" />
                    )}
                    BATALKAN PENGAJUAN
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-sm border-2 border-primary/20 sm:max-w-md p-0 overflow-hidden bg-card">
                  <AlertDialogHeader className="px-6 py-5 border-b border-primary/10 bg-muted/40">
                    <AlertDialogTitle className="text-base font-black uppercase tracking-wide text-destructive flex items-center gap-2">
                      <X className="w-5 h-5" />
                      Konfirmasi Pembatalan
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm font-medium mt-2">
                      Tindakan ini tidak dapat dibatalkan. Pengajuan jadwal Anda
                      akan dihapus dari daftar tunggu dosen, dan slot waktu akan
                      dikembalikan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="px-6 py-4 border-t border-primary/10 bg-muted/20 flex flex-row justify-end gap-3">
                    <AlertDialogCancel className="rounded-sm shadow-none mt-0 font-bold uppercase tracking-wider text-xs border-border">
                      TUTUP
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="rounded-sm shadow-none bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold uppercase tracking-wider text-xs"
                      onClick={() => handleCancel(b.id)}
                    >
                      YA, BATALKAN
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Halaman Formal & Lega */}
      <div className="bg-card border border-primary/15 p-6 sm:p-8 rounded-sm shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
        <div className="pl-2">
          <h1 className="text-2xl font-black text-primary uppercase tracking-tight">
            Status Pengajuan Aktif
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-2 border-l-2 border-primary/30 pl-3">
            Pantau status pengajuan jadwal bimbingan Anda yang sedang berjalan
            atau menunggu persetujuan dosen.
          </p>
        </div>
      </div>

      {activeBookings.length === 0 ? (
        <div className="border border-border rounded-sm bg-card mt-6">
          <EmptyState
            icon={Bookmark}
            title="TIDAK ADA PENGAJUAN AKTIF"
            description="Anda belum memiliki jadwal bimbingan yang diajukan atau disetujui. Silakan ajukan jadwal baru melalui menu Booking."
          />
        </div>
      ) : (
        <div className="mt-6">
          {activeBookings.map((b) => (
            <BookingCard key={b.id} b={b} />
          ))}
        </div>
      )}
    </div>
  );
}
