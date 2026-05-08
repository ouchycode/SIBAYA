import React from "react";
import { Card } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function SetupRole() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ornamen Background (Sama dengan halaman Login) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="max-w-md w-full p-8 text-center rounded-md border-border shadow-lg relative z-10 bg-card">
        {/* Ikon Peringatan/Info Formal */}
        <div className="w-16 h-16 rounded bg-primary border border-primary flex items-center justify-center mx-auto mb-5 shadow-sm">
          <ShieldAlert className="w-8 h-8 text-primary-foreground" />
        </div>

        <h1 className="text-2xl font-black text-foreground tracking-wide">
          Akses Tertunda
        </h1>
        <h2 className="text-sm font-bold text-primary mt-1 uppercase tracking-widest">
          Sistem Informasi Bimbingan SIBAYA
        </h2>

        <div className="h-px w-12 bg-border mx-auto my-5" />

        <p className="text-sm font-medium text-muted-foreground leading-relaxed">
          Akun Anda saat ini
          <span className="font-bold text-foreground">belum dikonfigurasi</span>
          oleh sistem.
        </p>
        <p className="text-sm font-medium text-muted-foreground leading-relaxed mt-2">
          Silakan hubungi
          <span className="font-bold text-foreground">Administrator</span> untuk
          mengatur peran (role) dan melengkapi data akademik Anda agar dapat
          masuk ke dalam *dashboard*.
        </p>
      </Card>
    </div>
  );
}
