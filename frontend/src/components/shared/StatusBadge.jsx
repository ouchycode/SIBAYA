import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle, XCircle, Ban, CircleDot } from "lucide-react";

const statusConfig = {
  pending: {
    label: "Menunggu",
    color: "bg-amber-500 text-white border-amber-600",
    icon: Clock,
  },
  approved: {
    label: "Disetujui",
    color: "bg-emerald-500 text-white border-emerald-600",
    icon: CheckCircle,
  },
  rejected: {
    label: "Ditolak",
    color: "bg-red-500 text-white border-red-600",
    icon: XCircle,
  },
  cancelled: {
    label: "Dibatalkan",
    color: "bg-muted-foreground text-white border-muted",
    icon: Ban,
  },
  completed: {
    label: "Selesai",
    color: "bg-primary text-primary-foreground border-primary",
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
