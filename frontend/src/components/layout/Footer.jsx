import React from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border mt-auto z-10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-center md:text-left">
            <p className="text-sm font-bold text-foreground">
              SIBAYA{" "}
              <span className="font-medium text-muted-foreground">
                | Sistem Bimbingan Akademik
              </span>
            </p>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">
              &copy; {currentYear} Universitas Yatsi Madani. Hak Cipta
              Dilindungi.
            </p>
          </div>

          {/* Bagian Kanan: Versi atau Link Tambahan */}
          <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">
              Bantuan
            </a>
            <span className="w-1 h-1 rounded-full bg-border"></span>
            <a href="#" className="hover:text-primary transition-colors">
              Privasi
            </a>
            <span className="w-1 h-1 rounded-full bg-border"></span>
            <span className="opacity-60">Versi 1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
