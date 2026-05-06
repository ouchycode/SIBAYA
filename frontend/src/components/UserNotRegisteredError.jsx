import React from "react";
import { UserX } from "lucide-react";
import { Card } from "@/components/ui/card";

const UserNotRegisteredError = () => {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-destructive/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <Card className="max-w-md w-full p-8 bg-card rounded-md shadow-lg border border-border relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-5 rounded border border-destructive/20 bg-destructive/10 shadow-sm">
            <UserX className="w-8 h-8 text-destructive" />
          </div>

          <h1 className="text-2xl font-black text-foreground mb-1 tracking-wide">
            Akses Ditolak
          </h1>
          <h2 className="text-sm font-bold text-destructive mb-5 uppercase tracking-widest">
            Pengguna Tidak Terdaftar
          </h2>

          <div className="h-px w-12 bg-border mx-auto my-4" />

          <p className="text-sm font-medium text-muted-foreground mb-6 leading-relaxed">
            Akun email Anda belum terdaftar untuk menggunakan sistem akademik{" "}
            <span className="font-bold text-foreground">SIBAYA</span>. Silakan
            hubungi Administrator Biro Akademik untuk meminta akses.
          </p>

          <div className="p-4 bg-muted/50 border border-border rounded-md text-sm text-left">
            <p className="font-bold text-foreground mb-2 text-xs uppercase tracking-wider">
              Jika ini adalah sebuah kesalahan, Anda dapat:
            </p>
            <ul className="list-disc list-outside ml-4 space-y-1.5 text-xs font-medium text-muted-foreground">
              <li>
                Memastikan Anda masuk (login) menggunakan akun email kampus yang
                benar.
              </li>
              <li>
                Menghubungi Administrator untuk pengecekan data di sistem.
              </li>
              <li>Mencoba keluar dari akun dan masuk kembali.</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserNotRegisteredError;
