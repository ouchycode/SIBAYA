import React from "react";
import { cn } from "@/lib/utils";

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}) {
  const colorMap = {
    blue: { bg: "bg-blue-50 dark:bg-blue-950/40", icon: "text-blue-500" },
    green: {
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      icon: "text-emerald-500",
    },
    amber: { bg: "bg-amber-50 dark:bg-amber-950/40", icon: "text-amber-500" },
    red: { bg: "bg-red-50 dark:bg-red-950/40", icon: "text-red-500" },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-950/40",
      icon: "text-purple-500",
    },
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-card rounded-md p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col justify-between min-h-[110px]">
      <p className="text-xs text-muted-foreground">{title}</p>
      <div className="flex items-end justify-between mt-2">
        <div>
          <p className="text-3xl font-semibold text-foreground leading-none">
            {value}
          </p>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "w-8 h-8 rounded flex items-center justify-center shrink-0",
              c.bg,
            )}
          >
            <Icon className={cn("w-4 h-4", c.icon)} strokeWidth={1.8} />
          </div>
        )}
      </div>
    </div>
  );
}
