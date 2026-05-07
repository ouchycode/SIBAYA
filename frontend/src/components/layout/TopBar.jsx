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

  const typeColors = {
    booking_new: "bg-blue-50 text-blue-700 border-blue-200",
    booking_approved: "bg-green-50 text-green-700 border-green-200",
    booking_rejected: "bg-red-50 text-red-700 border-red-200",
    booking_cancelled: "bg-amber-50 text-amber-700 border-amber-200",
    reminder: "bg-purple-50 text-purple-700 border-purple-200",
    system: "bg-muted text-muted-foreground border-border",
  };

  const handleNotificationClick = (n) => {
    if (!n.is_read) markRead.mutate(n.id);
    if (n.link) {
      navigate(n.link);
      setOpen(false);
    }
  };

  return (
    <header className="h-14 bg-card border-b border-border/50 flex items-center justify-between px-5 sticky top-0 z-30 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      {/* Kiri: toggle + judul */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-semibold text-foreground tracking-wide">
          {title}
        </h2>
      </div>

      {/* Kanan: notifikasi */}
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-destructive text-destructive-foreground rounded-full text-[9px] font-bold flex items-center justify-center px-1 leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="w-80 p-0 rounded-md border-0 shadow-[0_4px_20px_rgba(0,0,0,0.1)] bg-card overflow-hidden"
            align="end"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-muted-foreground" />
                <h3 className="text-xs font-semibold text-foreground">
                  Notifikasi
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-primary/10 text-primary font-semibold px-1.5 py-0.5 rounded-full">
                    {unreadCount} baru
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  <CheckCheck className="w-3 h-3" />
                  Tandai semua
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[340px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-3">
                    <Bell className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tidak ada notifikasi
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={cn(
                      "flex gap-3 px-4 py-3.5 border-b border-border/40 last:border-0 cursor-pointer transition-colors relative",
                      !n.is_read
                        ? "bg-primary/[0.03] hover:bg-primary/[0.06]"
                        : "hover:bg-muted/50",
                    )}
                  >
                    {/* Indikator unread */}
                    {!n.is_read && (
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-r" />
                    )}

                    <div className="flex-1 min-w-0 pl-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={cn(
                            "text-[10px] inline-flex items-center px-1.5 py-0.5 rounded border font-medium",
                            typeColors[n.type] || typeColors.system,
                          )}
                        >
                          {n.type?.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {n.created_date &&
                            format(new Date(n.created_date), "dd MMM, HH:mm", {
                              locale: localeId,
                            })}
                        </span>
                      </div>

                      <p
                        className={cn(
                          "text-xs font-semibold leading-snug",
                          !n.is_read ? "text-foreground" : "text-foreground/75",
                        )}
                      >
                        {n.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
