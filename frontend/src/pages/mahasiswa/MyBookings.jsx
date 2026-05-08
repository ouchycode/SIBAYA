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
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { useEntityList } from "@/lib/hooks/useEntityList";
import { sibaApi } from "@/api/apiClient";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyBookings() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: allBookings = [], isLoading: isLoadingBookings } =
    useEntityList("Booking");
  const [cancellingId, setCancellingId] = useState(null);

  const activeBookings = allBookings
    .filter(
      (b) =>
        ["pending", "approved"].includes(b.status) &&
        b.student_email === user?.email,
    )
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

  const BookingCard = ({ b }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-5 border-b border-border/40 hover:bg-muted/40 transition-colors last:border-0">
      <div className="flex items-start sm:items-center gap-4">
        <div className="flex-shrink-0 w-10 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none">
            {format(new Date(b.date), "MMM", { locale: localeId })}
          </p>
          <p className="text-xl font-semibold text-foreground leading-tight">
            {format(new Date(b.date), "dd")}
          </p>
        </div>

        <div className="hidden sm:block w-px h-10 bg-border/50 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {format(new Date(b.date), "EEEE, dd MMMM yyyy", {
              locale: localeId,
            })}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {b.start_time} – {b.end_time}
            </p>
            <span className="text-[10px] text-muted-foreground">•</span>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {b.mode === "online" ? (
                <Video className="w-3 h-3" />
              ) : (
                <MapPin className="w-3 h-3" />
              )}
              {b.mode === "online" ? "Daring" : "Luring"}
              {b.location && b.mode !== "online" ? ` • ${b.location}` : ""}
            </p>
            <span className="text-[10px] text-muted-foreground">•</span>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              {b.supervisor_name}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 shrink-0">
        <StatusBadge status={b.status} />
        {b.status === "approved" && b.mode === "online" && b.location && (
          <a
            href={
              b.location.startsWith("http")
                ? b.location
                : `https://${b.location}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-8 px-3 rounded text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors shadow-none"
          >
            <Video className="w-3.5 h-3.5 mr-1.5" />
            Gabung Rapat
          </a>
        )}
        {b.status === "pending" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded text-xs text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground shadow-none"
                disabled={cancellingId === b.id}
              >
                {cancellingId === b.id ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <X className="w-3.5 h-3.5 mr-1.5" />
                )}
                Batalkan
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-md border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:max-w-md p-0 overflow-hidden bg-card">
              <AlertDialogHeader className="px-5 py-4 border-b border-border/50">
                <AlertDialogTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <X className="w-4 h-4 text-destructive" />
                  Konfirmasi Pembatalan
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm mt-1">
                  Tindakan ini tidak dapat dibatalkan. Pengajuan jadwal Anda
                  akan dihapus dari daftar tunggu dosen, dan slot waktu akan
                  dikembalikan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="px-5 py-3.5 border-t border-border/50 flex flex-row justify-end gap-2 bg-muted/20">
                <AlertDialogCancel className="rounded text-xs mt-0">
                  Batal
                </AlertDialogCancel>
                <AlertDialogAction
                  className="rounded text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
  );

  if (isLoadingBookings) {
    return (
      <div className="space-y-5 max-w-7xl">
        <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden mt-6">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/50">
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex flex-col">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-5 border-b border-border/40"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <Skeleton className="h-10 w-10 shrink-0 rounded" />
                  <div className="hidden sm:block w-px h-10 bg-border/50 flex-shrink-0" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                </div>
                <Skeleton className="h-6 w-24 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header Halaman */}
      <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">
            Status Bimbingan
          </p>
          <h1 className="text-base font-semibold text-foreground">
            Status Pengajuan Aktif
          </h1>
        </div>
      </div>

      {activeBookings.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Tidak ada pengajuan aktif"
          description="Anda belum memiliki jadwal bimbingan yang diajukan atau disetujui. Silakan ajukan jadwal baru melalui menu Booking."
        />
      ) : (
        <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden mt-6">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/50">
            <Bookmark className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              Daftar Pengajuan Aktif
            </h2>
          </div>
          <div className="flex flex-col">
            {activeBookings.map((b) => (
              <BookingCard key={b.id} b={b} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
