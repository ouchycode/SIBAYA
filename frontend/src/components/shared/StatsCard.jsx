import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}) {
  // Menambahkan border tipis dan menggelapkan teks sedikit agar kontrasnya lebih baik di layar
  const colorMap = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200", // Menggunakan emerald agar hijaunya lebih formal
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <Card className="p-5 rounded-md border border-border shadow-none bg-card transition-none">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
            {title}
          </p>
          <p className="text-2xl font-black mt-1 text-foreground tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-[10px] font-medium text-muted-foreground mt-1 uppercase tracking-wider truncate">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "p-2.5 rounded border flex items-center justify-center shrink-0",
              colorMap[color] || colorMap.blue,
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </Card>
  );
}
