import React, { useState } from "react";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  User,
  CalendarDays,
  Clock,
  MapPin,
  Video,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  AlertOctagon,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntityList } from "@/lib/hooks/useEntityList";
import { sibaApi } from "@/api/apiClient";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const ITEMS_PER_PAGE = 5;

export default function RequestsPage() {
  const queryClient = useQueryClient();
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const { data: allBookings = [], isLoading: isBookingsLoading } =
    useEntityList("Booking");

  const isDataLoading = isUserLoading || isBookingsLoading;

  const [activeTab, setActiveTab] = useState("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingId, setLoadingId] = useState(null);

  const [rejectDialog, setRejectDialog] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const bookings = allBookings
    .filter((b) => b.supervisor_email === user?.email)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const updateStatus = async (id, status, reason) => {
    setLoadingId(id);
    try {
      await sibaApi.entities.Booking.update(id, {
        status,
        reject_reason: reason || null,
      });
      queryClient.invalidateQueries({ queryKey: ["Booking"] });
      queryClient.invalidateQueries({ queryKey: ["Slot"] });
      toast.success(
        status === "approved"
          ? "Pengajuan berhasil disetujui."
          : status === "rejected"
            ? "Pengajuan berhasil ditolak."
            : status === "completed"
              ? "Sesi bimbingan ditandai selesai."
              : "Status berhasil diperbarui.",
      );
      setRejectDialog(null);
      setRejectReason("");
    } catch (err) {
      toast.error(
        err.data?.message || err.message || "Gagal memperbarui status.",
      );
    } finally {
      setLoadingId(null);
    }
  };

  const pending = bookings.filter((b) => b.status === "pending");
  const approved = bookings.filter((b) => b.status === "approved");
  const others = bookings.filter((b) =>
    ["completed", "rejected", "cancelled"].includes(b.status),
  );

  const handleTabChange = (value) => {
    setActiveTab(value);
    setCurrentPage(1);
  };

  const getPaginatedData = (array) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return array.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const renderPagination = (totalItems) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

    if (totalPages <= 1) return null;

    return (
      <div className="px-5 py-3.5 border border-border/50 rounded-md flex items-center justify-between bg-card mt-4">
        <p className="text-xs text-muted-foreground">
          Halaman {currentPage} dari {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 rounded text-xs shadow-none border-border/60 hover:bg-muted/40"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 rounded text-xs shadow-none border-border/60 hover:bg-muted/40"
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
    );
  };

  const BookingCard = ({ booking, showActions }) => (
    <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-4 overflow-hidden">
      {/* Header Kartu */}
      <div className="bg-muted/20 border-b border-border/50 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {booking.student_name}
            </p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5">
              Pengaju Bimbingan
            </p>
          </div>
        </div>
        <div className="flex shrink-0">
          <StatusBadge status={booking.status} />
        </div>
      </div>

      {/* Body Kartu */}
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Informasi Waktu */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground">
                {format(new Date(booking.date), "dd MMMM yyyy", {
                  locale: localeId,
                })}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground">
                {booking.start_time} - {booking.end_time} WIB
              </span>
            </div>
          </div>

          {/* Informasi Metode */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              {booking.mode === "online" ? (
                <Video className="w-4 h-4 text-muted-foreground shrink-0" />
              ) : (
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <span className="text-sm text-foreground">
                {booking.mode === "online"
                  ? "Daring (Online)"
                  : "Luring (Tatap Muka)"}
                {booking.location && booking.mode !== "online"
                  ? ` • ${booking.location}`
                  : ""}
              </span>
            </div>
          </div>

          {/* Kolom Catatan / Alasan */}
          <div className="space-y-3 lg:col-span-3">
            {booking.notes && (
              <div className="p-3 bg-muted/30 rounded border border-border/50">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Catatan Pengajuan
                </p>
                <p className="text-sm text-foreground">{booking.notes}</p>
              </div>
            )}

            {booking.reject_reason && (
              <div className="p-3 bg-destructive/5 rounded border border-destructive/10">
                <p className="text-xs font-medium text-destructive flex items-center gap-1.5 mb-1.5">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  Alasan Penolakan Dosen
                </p>
                <p className="text-sm text-destructive/90">
                  {booking.reject_reason}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Kartu - Aksi */}
      {(showActions || booking.status === "approved") && (
        <div className="bg-muted/10 border-t border-border/50 px-5 py-3.5 flex flex-col sm:flex-row justify-end gap-2">
          {booking.status === "approved" &&
            booking.mode === "online" &&
            booking.location && (
              <a
                href={
                  booking.location.startsWith("http")
                    ? booking.location
                    : `https://${booking.location}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-8 px-4 rounded text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors w-full sm:w-auto"
              >
                <Video className="w-3.5 h-3.5 mr-1.5" />
                Gabung Rapat
              </a>
            )}
          {showActions && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-4 rounded text-xs shadow-none border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setRejectDialog(booking)}
                disabled={loadingId === booking.id}
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" /> Tolak
              </Button>
              <Button
                size="sm"
                className="h-8 px-4 rounded text-xs shadow-none"
                onClick={() => updateStatus(booking.id, "approved")}
                disabled={loadingId === booking.id}
              >
                {loadingId === booking.id ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                )}
                Setujui Jadwal
              </Button>
            </>
          )}

          {booking.status === "approved" && (
            <Button
              size="sm"
              className="h-8 px-4 rounded text-xs shadow-none w-full sm:w-auto"
              onClick={() => updateStatus(booking.id, "completed")}
              disabled={loadingId === booking.id}
            >
              {loadingId === booking.id ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              )}
              Tandai Selesai
            </Button>
          )}
        </div>
      )}
    </div>
  );

  if (isDataLoading) {
    return (
      <div className="space-y-5 max-w-7xl mx-auto pb-10">
        {/* Header Skeleton */}
        <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5">
          <Skeleton className="h-3 w-32 mb-1.5" />
          <Skeleton className="h-5 w-56" />
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-4 border-b border-border mb-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>

        {/* List Skeleton */}
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden border border-border/50"
            >
              <div className="bg-muted/20 border-b border-border/50 px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-20 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Header Halaman */}
      <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1">
          Manajemen Jadwal
        </p>
        <h1 className="text-base font-semibold text-foreground">
          Permintaan Bimbingan Masuk
        </h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full mt-4"
      >
        <TabsList className="w-full sm:w-auto flex flex-col sm:flex-row bg-transparent border-b border-border rounded-none p-0 h-auto gap-4 mb-4">
          <TabsTrigger
            value="pending"
            className="flex-1 sm:flex-none justify-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 transition-all"
          >
            <span className="text-sm font-medium">Menunggu</span>
            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">
              {pending.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="flex-1 sm:flex-none justify-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 transition-all"
          >
            <span className="text-sm font-medium">Disetujui</span>
            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs">
              {approved.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="others"
            className="flex-1 sm:flex-none justify-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 transition-all"
          >
            <span className="text-sm font-medium">Riwayat</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pending.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Tidak ada permintaan baru"
              description="Belum ada pengajuan jadwal bimbingan masuk dari mahasiswa."
            />
          ) : (
            <div>
              {getPaginatedData(pending).map((b) => (
                <BookingCard key={b.id} booking={b} showActions />
              ))}
              {renderPagination(pending.length)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          {approved.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="Tidak ada jadwal disetujui"
              description="Jadwal yang telah Anda setujui akan muncul di sini."
            />
          ) : (
            <div>
              {getPaginatedData(approved).map((b) => (
                <BookingCard key={b.id} booking={b} />
              ))}
              {renderPagination(approved.length)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="others" className="mt-4">
          {others.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Tidak ada riwayat"
              description="Data bimbingan yang selesai, ditolak, atau dibatalkan akan tampil di sini."
            />
          ) : (
            <div>
              {getPaginatedData(others).map((b) => (
                <BookingCard key={b.id} booking={b} />
              ))}
              {renderPagination(others.length)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog Tolak Pengajuan */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent className="rounded-md border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:max-w-md p-0 overflow-hidden bg-card">
          <DialogHeader className="px-5 py-4 border-b border-border/50">
            <DialogTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-destructive" />
              Tolak Pengajuan Bimbingan
            </DialogTitle>
          </DialogHeader>
          <div className="px-5 py-4 space-y-3">
            <Label className="text-xs font-medium text-foreground">
              Alasan Penolakan (Opsional)
            </Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Berikan alasan agar mahasiswa dapat menyesuaikan..."
              className="rounded border-border/60 focus-visible:ring-destructive shadow-none h-24 resize-none p-3 text-sm"
            />
          </div>
          <DialogFooter className="px-5 py-3.5 border-t border-border/50 bg-muted/20 flex flex-row justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded text-xs"
              onClick={() => setRejectDialog(null)}
            >
              Batal
            </Button>
            <Button
              size="sm"
              className="rounded text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() =>
                updateStatus(rejectDialog.id, "rejected", rejectReason)
              }
              disabled={loadingId === rejectDialog?.id}
            >
              {loadingId === rejectDialog?.id ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Konfirmasi Tolak"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
