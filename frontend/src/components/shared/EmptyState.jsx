import React from "react";
import { FolderOpen } from "lucide-react";

export default function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Kotak Ikon Formal */}
      <div className="w-16 h-16 rounded-md bg-muted/50 border border-border flex items-center justify-center mb-4 shadow-sm">
        <Icon className="w-8 h-8 text-muted-foreground/70" />
      </div>

      {/* Teks Judul */}
      <h3 className="text-base font-bold text-foreground tracking-wide">
        {title || "Tidak Ada Data"}
      </h3>

      {/* Teks Deskripsi */}
      {description && (
        <p className="text-sm font-medium text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
