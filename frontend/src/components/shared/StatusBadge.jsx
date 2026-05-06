import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle, XCircle, Ban, CircleDot } from "lucide-react";

const statusConfig = {
  pending: {
    label: "Menunggu",
    color: "bg-amber-50 text-amber-700 border-amber-300",
    icon: Clock,
  },
  approved: {
    label: "Disetujui",
    color: "bg-emerald-50 text-emerald-700 border-emerald-300",
    icon: CheckCircle,
  },
  rejected: {
    label: "Ditolak",
    color: "bg-red-50 text-red-700 border-red-300",
    icon: XCircle,
  },
  cancelled: {
    label: "Dibatalkan",
    color: "bg-muted text-muted-foreground border-border",
    icon: Ban,
  },
  completed: {
    label: "Selesai",
    color: "bg-primary/10 text-primary border-primary/30",
    icon: CircleDot,
  },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-sm border",
        config.color,
      )}
    >
      <Icon className="w-3 h-3 shrink-0" />
      {config.label}
    </Badge>
  );
}
