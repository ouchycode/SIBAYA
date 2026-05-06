import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sibaApi } from "@/api/apiClient";
import { Bell, Menu, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export default function TopBar({ user, onToggleSidebar, title }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.email],
    queryFn: () =>
      sibaApi.entities.Notification.filter(
        { recipient_email: user?.email },
        "-created_date",
        20,
      ),
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = useMutation({
    mutationFn: (id) =>
      sibaApi.entities.Notification.update(id, { is_read: true }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter((n) => !n.is_read);
      await Promise.all(
        unread.map((n) =>
          sibaApi.entities.Notification.update(n.id, { is_read: true }),
        ),
      );
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // Warna semantik standar tanpa efek transisi aneh-aneh
  const typeColors = {
    booking_new: "bg-blue-100 text-blue-800 border-blue-200",
    booking_approved: "bg-green-100 text-green-800 border-green-200",
    booking_rejected: "bg-red-100 text-red-800 border-red-200",
    booking_cancelled: "bg-amber-100 text-amber-800 border-amber-200",
    reminder: "bg-purple-100 text-purple-800 border-purple-200",
    system: "bg-muted text-muted-foreground border-border",
  };

  const handleNotificationClick = (n) => {
    if (!n.is_read) {
      markRead.mutate(n.id);
    }
    if (n.link) {
      navigate(n.link);
      setOpen(false);
    }
  };

  return (
    // Dibuat flat dengan border solid di bawah, tanpa shadow berlebihan
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-md hover:bg-muted"
            >
              <Bell className="w-5 h-5 text-foreground/80" />
              {unreadCount > 0 && (
                // Badge notifikasi tetap membulat (standar UI UX global untuk notifikasi)
                <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-[9px] font-bold flex items-center justify-center border border-card">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>

          {/* Popover dibuat solid dengan border-md */}
          <PopoverContent
            className="w-80 p-0 rounded-md border-border shadow-md"
            align="end"
          >
            <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground">
                Notifikasi Sistem
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                >
                  <CheckCheck className="w-3 h-3" />
                  Tandai Dibaca
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center text-center">
                  <Bell className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Belum ada pemberitahuan
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={cn(
                      "p-3 border-b border-border/50 last:border-0 cursor-pointer hover:bg-muted/50 relative",
                      !n.is_read ? "bg-primary/5" : "opacity-80",
                    )}
                  >
                    {/* Indikator Belum Dibaca - Simple solid line */}
                    {!n.is_read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                    )}

                    <div className="flex items-start justify-between gap-2 pl-1">
                      <span
                        className={cn(
                          "text-[9px] shrink-0 inline-flex items-center rounded-sm px-1.5 py-0.5 font-bold uppercase tracking-wider border",
                          typeColors[n.type] || typeColors.system,
                        )}
                      >
                        {n.type?.replace(/_/g, " ")}
                      </span>
                      {/* Menggunakan format bahasa Indonesia */}
                      <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                        {n.created_date &&
                          format(new Date(n.created_date), "dd MMM yy, HH:mm", {
                            locale: localeId,
                          })}
                      </span>
                    </div>

                    <div className="mt-2 pl-1">
                      <p
                        className={cn(
                          "text-sm font-bold",
                          !n.is_read ? "text-foreground" : "text-foreground/80",
                        )}
                      >
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* User Avatar in TopBar */}
        <div className="hidden md:flex items-center gap-3 pl-3 border-l border-border">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-foreground">
              {user?.full_name || "User"}
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {user?.role === 'dosen' ? 'Dosen' : user?.role === 'admin' ? 'Administrator' : 'Mahasiswa'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center shrink-0 overflow-hidden border border-border">
            {user?.photo ? (
              <img src={user.photo} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-black">
                {(user?.full_name || "U")[0].toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
