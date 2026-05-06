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
import { CalendarDays, Clock, Video, MapPin, X, Bookmark, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale"; // Import untuk format tanggal Indonesia
import { toast } from "sonner";
import { useEntityList } from "@/lib/hooks/useEntityList";
import { sibaApi } from "@/api/apiClient";
import { useQueryClient } from "@tanstack/react-query";

export default function MyBookings() {
  const queryClient = useQueryClient();
  // Backend sudah scope Booking ke student yang login — tidak perlu filter student_email.
  const { data: allBookings = [] } = useEntityList("Booking");
  const [cancellingId, setCancellingId] = useState(null);

  // Hanya tampilkan booking aktif (pending / approved)
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
      toast.error(err.data?.message || err.message || "Gagal membatalkan booking.");
    } finally {
      setCancellingId(null);
    }
  };

  const BookingCard = ({ b }) => (
    <Card className="rounded-md border border-border shadow-none mb-3 bg-card overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
          <div className="flex items-start sm:items-center gap-4">
            {/* Ikon kalender bergaya kotak solid */}
            <div className="w-12 h-12 rounded bg-muted border border-border flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">
                {format(new Date(b.date), "dd MMMM yyyy", { locale: localeId })}
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-sm border border-border/50">
                  <Clock className="w-3.5 h-3.5" />
                  {b.start_time} - {b.end_time} WIB
                </span>

                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-sm border border-border/50">
                  {b.mode === "online" ? (
                    <Video className="w-3.5 h-3.5" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5" />
                  )}
                  {b.mode === "online"
                    ? "Online (Daring)"
                    : "Offline (Tatap Muka)"}
                </span>
              </div>

              <p className="text-xs font-semibold text-foreground mt-2">
                Dosen: <span className="font-bold">{b.supervisor_name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-border sm:border-0">
            <StatusBadge status={b.status} />

            {b.status === "pending" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-sm text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground font-bold shadow-none"
                    disabled={cancellingId === b.id}
                  >
                    {cancellingId === b.id
                      ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      : <X className="w-4 h-4 mr-1" />}
                    Batal
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-md border-border sm:max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-bold">
                      Batalkan Pengajuan?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Tindakan ini tidak dapat dibatalkan. Pengajuan booking
                      Anda akan langsung dihapus dari daftar tunggu dosen, dan
                      statusnya akan dipindahkan ke Riwayat.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="rounded-sm shadow-none mt-0">
                      Tutup
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="rounded-sm shadow-none bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
                      onClick={() => handleCancel(b.id)}
                    >
                      Ya, Batalkan
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
    <div className="space-y-6">
      {/* Header Halaman Formal */}
      <div className="bg-card border border-border p-5 rounded-md shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">Pengajuan Aktif</h1>
        <p className="text-sm font-medium text-muted-foreground mt-1">
          Pantau status pengajuan jadwal bimbingan Anda yang sedang berjalan
          atau menunggu persetujuan.
        </p>
      </div>

      {activeBookings.length === 0 ? (
        <div className="border border-border rounded-md bg-card">
          <EmptyState
            icon={Bookmark}
            title="Tidak Ada Pengajuan Aktif"
            description="Anda belum memiliki pengajuan yang menunggu persetujuan atau disetujui. Silakan ajukan jadwal baru."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {activeBookings.map((b) => (
            <BookingCard key={b.id} b={b} />
          ))}
        </div>
      )}
    </div>
  );
}
