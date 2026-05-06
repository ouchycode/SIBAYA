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
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntityList } from "@/lib/hooks/useEntityList";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

const ITEMS_PER_PAGE = 5;

export default function RequestsPage() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: allBookings = [] } = useEntityList("Booking");

  // State untuk Tabs dan Pagination
  const [activeTab, setActiveTab] = useState("pending");
  const [currentPage, setCurrentPage] = useState(1);

  const [rejectDialog, setRejectDialog] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const bookings = allBookings
    .filter((b) => b.supervisor_email === user?.email)
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Urutkan terbaru ke terlama

  const updateStatus = async (id, status, reason) => {
    await base44.entities.Booking.update(id, {
      status,
      reject_reason: reason || null,
    });
    queryClient.invalidateQueries({ queryKey: ["Booking"] });
    toast.success("Status berhasil diperbarui");
    setRejectDialog(null);
    setRejectReason("");
  };

  // Pengelompokan Data
  const pending = bookings.filter((b) => b.status === "pending");
  const approved = bookings.filter((b) => b.status === "approved");
  const others = bookings.filter((b) =>
    ["completed", "rejected", "cancelled"].includes(b.status),
  );

  // Fungsi Reset Pagination saat Tab berubah
  const handleTabChange = (value) => {
    setActiveTab(value);
    setCurrentPage(1); // Kembali ke halaman 1 setiap pindah tab
  };

  // Fungsi Helper untuk memotong array berdasarkan halaman
  const getPaginatedData = (array) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return array.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  // Fungsi Helper untuk merender kontrol Pagination
  const renderPagination = (totalItems) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between bg-card border border-border p-3 rounded-md shadow-sm mt-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Halaman {currentPage} dari {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 rounded-sm shadow-none font-bold text-xs"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 rounded-sm shadow-none font-bold text-xs"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Selanjutnya
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  };

  const BookingCard = ({ booking, showActions }) => (
    <Card className="rounded-md border border-border shadow-none mb-3 bg-card overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 gap-4">
          <div className="flex items-start sm:items-center gap-4">
            {/* Ikon Mahasiswa bergaya formal */}
            <div className="w-12 h-12 rounded bg-muted border border-border flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">
                {booking.student_name}
              </p>

              <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-sm border border-border/50">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {format(new Date(booking.date), "dd MMMM yyyy", {
                    locale: localeId,
                  })}
                </span>
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-sm border border-border/50">
                  <Clock className="w-3.5 h-3.5" />
                  {booking.start_time} - {booking.end_time} WIB
                </span>
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-sm border border-border/50">
                  {booking.mode === "online" ? (
                    <Video className="w-3.5 h-3.5" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5" />
                  )}
                  {booking.mode === "online"
                    ? "Online (Daring)"
                    : "Offline (Tatap Muka)"}
                </span>
              </div>

              {booking.notes && (
                <div className="mt-2 p-2.5 bg-accent/5 border border-accent/20 rounded-sm">
                  <p className="text-xs font-bold text-foreground mb-0.5">
                    Catatan Pengajuan:
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {booking.notes}
                  </p>
                </div>
              )}

              {booking.reject_reason && (
                <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-sm">
                  <p className="text-xs font-bold text-red-700">
                    Alasan Penolakan:
                  </p>
                  <p className="text-xs text-red-600">
                    {booking.reject_reason}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-center sm:justify-end gap-2 border-t border-border lg:border-0 pt-3 lg:pt-0 mt-2 lg:mt-0 w-full lg:w-auto shrink-0">
            <StatusBadge status={booking.status} />

            {showActions && (
              <div className="flex items-center gap-2 w-full sm:w-auto mt-1 lg:mt-2">
                <Button
                  size="sm"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm font-bold shadow-none flex-1 sm:flex-auto"
                  onClick={() => updateStatus(booking.id, "approved")}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Setujui
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground rounded-sm font-bold shadow-none flex-1 sm:flex-auto"
                  onClick={() => setRejectDialog(booking)}
                >
                  <XCircle className="w-3.5 h-3.5" /> Tolak
                </Button>
              </div>
            )}

            {booking.status === "approved" && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 mt-1 lg:mt-2 rounded-sm font-bold shadow-none w-full sm:w-auto border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => updateStatus(booking.id, "completed")}
              >
                <CheckCircle className="w-3.5 h-3.5" /> Tandai Selesai
              </Button>
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
        <h1 className="text-2xl font-bold text-foreground">
          Permintaan Bimbingan Masuk
        </h1>
        <p className="text-sm font-medium text-muted-foreground mt-1">
          Tinjau dan kelola pengajuan jadwal bimbingan dari mahasiswa Anda.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        {/* Style Tabs agar mirip sistem enterprise */}
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex bg-muted/50 border border-border rounded-md p-1 h-auto">
          <TabsTrigger
            value="pending"
            className="gap-2 rounded-sm data-[state=active]:bg-card data-[state=active]:shadow-sm py-2"
          >
            <span className="font-bold">Menunggu</span>
            <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-sm text-[10px] font-black leading-none">
              {pending.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="gap-2 rounded-sm data-[state=active]:bg-card data-[state=active]:shadow-sm py-2"
          >
            <span className="font-bold">Disetujui</span>
            <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-sm text-[10px] font-black leading-none">
              {approved.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="others"
            className="rounded-sm font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm py-2"
          >
            Riwayat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-3">
          {pending.length === 0 ? (
            <div className="border border-border rounded-md bg-card">
              <EmptyState
                title="Tidak ada permintaan baru"
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

        <TabsContent value="approved" className="mt-4 space-y-3">
          {approved.length === 0 ? (
            <div className="border border-border rounded-md bg-card">
              <EmptyState
                title="Tidak ada jadwal disetujui"
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

        <TabsContent value="others" className="mt-4 space-y-3">
          {others.length === 0 ? (
            <div className="border border-border rounded-md bg-card">
              <EmptyState
                title="Tidak ada riwayat"
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
        <DialogContent className="rounded-md border-border sm:max-w-md">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="font-bold text-lg text-destructive">
              Tolak Pengajuan
            </DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <Label className="font-bold text-foreground">
              Alasan Penolakan
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Berikan alasan agar mahasiswa dapat menyesuaikan pengajuan
              berikutnya.
            </p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Misal: Saya ada rapat mendadak di jam tersebut, silakan pilih hari lain."
              className="mt-1 rounded-sm border-border shadow-none h-24 resize-none"
            />
          </div>
          <DialogFooter className="border-t border-border pt-4 sm:justify-end gap-2">
            <Button
              variant="outline"
              className="rounded-sm shadow-none font-bold"
              onClick={() => setRejectDialog(null)}
            >
              Batal
            </Button>
            <Button
              className="rounded-sm shadow-none font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() =>
                updateStatus(rejectDialog.id, "rejected", rejectReason)
              }
            >
              Konfirmasi Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
