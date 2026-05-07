import React from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border/50 mt-auto z-10 relative shadow-[0_-1px_4px_rgba(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto px-5 py-3.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Kiri */}
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="text-xs font-semibold text-foreground">
              SIBAYA
            </span>
            <div className="w-px h-3 bg-border" />
            <span className="text-xs text-muted-foreground">
              Sistem Bimbingan Akademik
            </span>
            <div className="w-px h-3 bg-border hidden sm:block" />
            <span className="text-[11px] text-muted-foreground hidden sm:block">
              &copy; {currentYear} Universitas Yatsi Madani
            </span>
          </div>

          {/* Kanan */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              Bantuan BAA
            </a>
            <div className="w-px h-3 bg-border" />
            <a href="#" className="hover:text-foreground transition-colors">
              Kebijakan Privasi
            </a>
            <div className="w-px h-3 bg-border" />
            <span className="font-mono text-[10px] bg-muted px-2 py-0.5 rounded border border-border/50 text-muted-foreground">
              v1.0.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
