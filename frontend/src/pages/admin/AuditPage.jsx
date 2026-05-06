import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Clock, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useEntityList } from "@/lib/hooks/useEntityList";

const actionColors = {
  create_booking: "bg-primary/10 text-primary border-primary/20",
  cancel_booking: "bg-amber-50 text-amber-700 border-amber-300",
  approved_booking: "bg-emerald-50 text-emerald-700 border-emerald-300",
  rejected_booking: "bg-destructive/10 text-destructive border-destructive/20",
  completed_booking: "bg-blue-50 text-blue-700 border-blue-300",
  create_slot: "bg-primary/10 text-primary border-primary/20",
  delete_slot: "bg-destructive/10 text-destructive border-destructive/20",
  create_mapping: "bg-emerald-50 text-emerald-700 border-emerald-300",
  deactivate_mapping: "bg-amber-50 text-amber-700 border-amber-300",
  create_period: "bg-primary/10 text-primary border-primary/20",
  activate_period: "bg-emerald-50 text-emerald-700 border-emerald-300",
  deactivate_period: "bg-amber-50 text-amber-700 border-amber-300",
  update_user: "bg-purple-50 text-purple-700 border-purple-300",
};

const roleColors = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  dosen: "bg-primary/10 text-primary border-primary/20",
  mahasiswa: "bg-emerald-50 text-emerald-700 border-emerald-300",
};

export default function AuditPage() {
  const { data: activityLogs = [] } = useEntityList("ActivityLog");
  const logs = [...activityLogs].sort(
    (a, b) => new Date(b.created_date) - new Date(a.created_date),
  );
  // ==========================================

  return (
    <div className="space-y-6">
      {/* Header Halaman Formal */}
      <div className="bg-card border border-border p-5 rounded-md shadow-sm">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          Audit Trail Sistem
        </h1>
        <p className="text-sm font-medium text-muted-foreground mt-1">
          Rekaman dan pemantauan seluruh aktivitas kritikal pengguna di dalam
          sistem SIBAYA.
        </p>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <Card
            key={log.id}
            className="rounded-md border border-border shadow-none bg-card hover:bg-muted/10 transition-none"
          >
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Ikon Profil */}
                <div className="w-10 h-10 rounded border border-border bg-muted flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header Log: Nama & Badges */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-sm font-bold text-foreground">
                      {log.actor_name || log.actor_email}
                    </span>
                    <Badge
                      variant="outline"
                      className={`font-bold uppercase tracking-wider text-[9px] px-2 py-0.5 rounded-sm ${
                        roleColors[log.actor_role] ||
                        "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {log.actor_role || "Unknown"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`font-bold uppercase tracking-wider text-[9px] px-2 py-0.5 rounded-sm ${
                        actionColors[log.action] ||
                        "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {log.action?.replace(/_/g, " ")}
                    </Badge>
                  </div>

                  {/* Deskripsi Aktivitas */}
                  <p className="text-sm font-medium text-foreground mt-1.5 leading-relaxed">
                    {log.description}
                  </p>

                  {/* Timestamp */}
                  <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-border/50">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                      {log.created_date &&
                        format(
                          new Date(log.created_date),
                          "dd MMMM yyyy • HH:mm:ss 'WIB'",
                          { locale: localeId },
                        )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
