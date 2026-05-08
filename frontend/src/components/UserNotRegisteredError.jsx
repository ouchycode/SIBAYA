import React from "react";
import { UserX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/AuthContext";

const UserNotRegisteredError = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-destructive/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full p-8 bg-card rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-border/50 relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 mb-5 rounded-full bg-destructive/10">
            <UserX className="w-7 h-7 text-destructive" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-1 tracking-tight">
            Akses Ditolak
          </h1>
          <h2 className="text-sm font-semibold text-destructive mb-5">
            Pengguna Tidak Terdaftar
          </h2>

          <div className="h-px w-12 bg-border/60 mx-auto my-4" />

          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Akun email atau NIM Anda belum terdaftar untuk menggunakan sistem akademik{" "}
            <span className="font-semibold text-foreground">SIBAYA</span>. Silakan
            hubungi Administrator Biro Akademik untuk meminta akses.
          </p>

          <div className="p-5 bg-muted/30 border border-border/50 rounded-lg text-sm text-left mb-6">
            <p className="font-semibold text-foreground mb-2.5 text-xs">
              Jika ini adalah sebuah kesalahan, Anda dapat:
            </p>
            <ul className="list-disc list-outside ml-4 space-y-2 text-xs text-muted-foreground">
              <li>
                Memastikan Anda memasukkan NIM/NIDN/Email yang
                benar.
              </li>
              <li>
                Menghubungi Administrator untuk pengecekan data di sistem.
              </li>
            </ul>
          </div>

          <button
            onClick={() => logout()}
            className="w-full h-10 rounded bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center"
          >
            Kembali ke Halaman Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;
