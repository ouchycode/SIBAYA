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
import { useEntityList } from "@/lib/hooks/useEntityList";
import { sibaApi } from "@/api/apiClient";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 5;

export default function RequestsPage() {
  // ==========================================
  // LOGIKA TETAP UTUH (TIDAK ADA YANG DIUBAH)
  // ==========================================
  const queryClient = useQueryClient();
  const { data: allBookings = [] } = useEntityList("Booking");

  const [activeTab, setActiveTab] = useState("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingId, setLoadingId] = useState(null);

  const [rejectDialog, setRejectDialog] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const bookings = allBookings.sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

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
      <div className="flex flex-col sm:flex-row items-center justify-between bg-muted/20 border-2 border-primary/10 p-4 rounded-sm mt-8 gap-4">
        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
          HALAMAN {currentPage} DARI {totalPages}
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-10 px-4 rounded-sm shadow-none font-black text-[10px] uppercase tracking-wider border-2 border-border hover:bg-background"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1.5" />
            SEBELUMNYA
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10 px-4 rounded-sm shadow-none font-black text-[10px] uppercase tracking-wider border-2 border-border hover:bg-background"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            SELANJUTNYA
            <ChevronRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>
    );
  };

  // ==========================================
  // PERUBAHAN PADA UI/UX (FRONTEND KAKU & LEGA)
  // ==========================================
  const BookingCard = ({ booking, showActions }) => (
    <Card className="rounded-sm border-2 border-primary/10 shadow-sm mb-4 bg-card overflow-hidden hover:border-primary/30 transition-all">
      <CardContent className="p-0">
        {/* Header Kartu - Identitas Mahasiswa & Status */}
        <div className="bg-muted/40 border-b border-primary/10 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                Pengaju Bimbingan
              </p>
              <p className="text-sm font-black text-foreground uppercase tracking-wide">
                {booking.student_name}
              </p>
            </div>
          </div>
          <div className="flex shrink-0">
            <StatusBadge status={booking.status} />
          </div>
        </div>

        {/* Body Kartu - Detail Jadwal */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Informasi Waktu */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 bg-background border border-border px-3 py-2 rounded-sm">
                <CalendarDays className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {format(new Date(booking.date), "dd MMMM yyyy", {
                    locale: localeId,
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2.5 bg-background border border-border px-3 py-2 rounded-sm">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-mono font-black text-foreground uppercase tracking-wider">
                  {booking.start_time} - {booking.end_time} WIB
                </span>
              </div>
            </div>

            {/* Informasi Metode */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 bg-muted/30 border border-border px-3 py-2 rounded-sm">
                {booking.mode === "online" ? (
                  <Video className="w-4 h-4 text-blue-600 shrink-0" />
                ) : (
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {booking.mode === "online"
                    ? "DARING (ONLINE)"
                    : "LURING (TATAP MUKA)"}
                </span>
              </div>
            </div>

            {/* Kolom Catatan / Alasan */}
            <div className="space-y-3 lg:col-span-3">
              {booking.notes && (
                <div className="p-4 bg-accent/5 border border-accent/20 rounded-sm">
                  <p className="text-[10px] font-black text-accent-foreground uppercase tracking-widest flex items-center gap-2 border-b border-accent/10 pb-2 mb-2">
                    <FileText className="w-3.5 h-3.5" />
                    Catatan Pengajuan
                  </p>
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {booking.notes}
                  </p>
                </div>
              )}

              {booking.reject_reason && (
                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-sm">
                  <p className="text-[10px] font-black text-destructive uppercase tracking-widest flex items-center gap-2 border-b border-destructive/10 pb-2 mb-2">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    Alasan Penolakan Dosen
                  </p>
                  <p className="text-sm font-medium text-destructive/90 leading-relaxed">
                    {booking.reject_reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Kartu - Aksi (Jika ada) */}
        {(showActions || booking.status === "approved") && (
          <div className="bg-muted/20 border-t border-border px-6 py-4 flex flex-col sm:flex-row justify-end gap-3">
            {showActions && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 px-5 rounded-sm font-black uppercase tracking-wider border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground shadow-none"
                  onClick={() => setRejectDialog(booking)}
                  disabled={loadingId === booking.id}
                >
                  <XCircle className="w-4 h-4 mr-2" /> TOLAK
                </Button>
                <Button
                  size="sm"
                  className="h-10 px-5 rounded-sm font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-none"
                  onClick={() => updateStatus(booking.id, "approved")}
                  disabled={loadingId === booking.id}
                >
                  {loadingId === booking.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  SETUJUI JADWAL
                </Button>
              </>
            )}

            {booking.status === "approved" && (
              <Button
                size="sm"
                className="h-10 px-6 rounded-sm font-black uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground shadow-none w-full sm:w-auto"
                onClick={() => updateStatus(booking.id, "completed")}
                disabled={loadingId === booking.id}
              >
                {loadingId === booking.id ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                TANDAI SELESAI
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Halaman - Formal & Lega */}
      <div className="bg-card border border-primary/15 p-6 sm:p-8 rounded-sm shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
        <div className="pl-2">
          <h1 className="text-2xl font-black text-primary uppercase tracking-tight">
            Permintaan Bimbingan Masuk
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-2 border-l-2 border-primary/30 pl-3">
            Tinjau dan kelola pengajuan jadwal bimbingan dari mahasiswa akademik
            Anda.
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full mt-6"
      >
        {/* Style Tabs Enterprise - Kotak, Kapital, Solid */}
        <TabsList className="w-full sm:w-auto flex flex-col sm:flex-row bg-muted/40 border-2 border-border rounded-sm p-1.5 h-auto gap-1">
          <TabsTrigger
            value="pending"
            className="flex-1 justify-center gap-2.5 rounded-sm data-[state=active]:bg-card data-[state=active]:border-primary/20 data-[state=active]:shadow-sm border border-transparent py-2.5 px-6 transition-all"
          >
            <span className="font-black text-xs uppercase tracking-wider">
              Menunggu
            </span>
            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-sm text-[10px] font-black border border-amber-200">
              {pending.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="flex-1 justify-center gap-2.5 rounded-sm data-[state=active]:bg-card data-[state=active]:border-primary/20 data-[state=active]:shadow-sm border border-transparent py-2.5 px-6 transition-all"
          >
            <span className="font-black text-xs uppercase tracking-wider">
              Disetujui
            </span>
            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-sm text-[10px] font-black border border-emerald-200">
              {approved.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="others"
            className="flex-1 justify-center rounded-sm font-black text-xs uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:border-primary/20 data-[state=active]:shadow-sm border border-transparent py-2.5 px-6 transition-all"
          >
            Riwayat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pending.length === 0 ? (
            <div className="border border-border rounded-sm bg-card">
              <EmptyState
                icon={CalendarDays}
                title="TIDAK ADA PERMINTAAN BARU"
                description="Belum ada pengajuan jadwal bimbingan masuk dari mahasiswa."
              />
            </div>
          ) : (
            <div>
              {getPaginatedData(pending).map((b) => (
                <BookingCard key={b.id} booking={b} showActions />
              ))}
              {renderPagination(pending.length)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          {approved.length === 0 ? (
            <div className="border border-border rounded-sm bg-card">
              <EmptyState
                icon={CheckCircle}
                title="TIDAK ADA JADWAL DISETUJUI"
                description="Jadwal yang telah Anda setujui akan muncul di sini."
              />
            </div>
          ) : (
            <div>
              {getPaginatedData(approved).map((b) => (
                <BookingCard key={b.id} booking={b} />
              ))}
              {renderPagination(approved.length)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="others" className="mt-6">
          {others.length === 0 ? (
            <div className="border border-border rounded-sm bg-card">
              <EmptyState
                icon={FileText}
                title="TIDAK ADA RIWAYAT"
                description="Data bimbingan yang selesai, ditolak, atau dibatalkan akan tampil di sini."
              />
            </div>
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

      {/* Dialog Tolak Pengajuan Formal */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent className="rounded-sm border-2 border-destructive/20 sm:max-w-md p-0 overflow-hidden bg-card">
          <DialogHeader className="px-6 py-5 border-b border-destructive/10 bg-destructive/5">
            <DialogTitle className="font-black text-base uppercase tracking-wide text-destructive flex items-center gap-2">
              <AlertOctagon className="w-5 h-5" />
              Tolak Pengajuan Bimbingan
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 py-5 space-y-3">
            <Label className="font-black text-[10px] uppercase tracking-wider text-foreground">
              Alasan Penolakan (Opsional)
            </Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Berikan alasan logis agar mahasiswa dapat menyesuaikan jadwal pengajuan berikutnya..."
              className="rounded-sm border-2 border-border focus-visible:ring-destructive shadow-none h-28 resize-none p-3 font-medium text-sm"
            />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
              Catatan: Aksi ini tidak dapat dibatalkan.
            </p>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex flex-row justify-end gap-3">
            <Button
              variant="outline"
              className="rounded-sm shadow-none font-black uppercase tracking-wider text-xs border-border px-5"
              onClick={() => setRejectDialog(null)}
            >
              BATALKAN
            </Button>
            <Button
              className="rounded-sm shadow-none font-black uppercase tracking-wider text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground px-5"
              onClick={() =>
                updateStatus(rejectDialog.id, "rejected", rejectReason)
              }
              disabled={loadingId === rejectDialog?.id}
            >
              {loadingId === rejectDialog?.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  MEMPROSES...
                </>
              ) : (
                "KONFIRMASI TOLAK"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
