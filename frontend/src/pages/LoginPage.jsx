import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sibaApi } from "@/api/apiClient";
import {
  BookOpen,
  User,
  Lock,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await sibaApi.auth.login(email, password);
      navigate("/", { replace: true });
      window.location.reload();
    } catch (err) {
      setError(
        err.message ||
          "Kredensial tidak valid. Silakan periksa kembali NIM/NIDN dan Kata Sandi Anda.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Container Split-Screen menggunakan Card bawaan */}
      <Card className="w-full max-w-4xl rounded-md shadow-xl border-border overflow-hidden bg-card flex flex-col md:flex-row">
        {/* ==========================================
            SISI KIRI: BRANDING & FITUR STATIS
            ========================================== */}
        <div className="w-full md:w-5/12 bg-muted/40 p-8 border-b md:border-b-0 md:border-r border-border flex flex-col justify-between">
          <div>
            {/* Header Branding dengan Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-background flex items-center justify-center rounded-sm p-1.5 shadow-sm border border-border shrink-0">
                <img
                  src="/logo-uym.png"
                  alt="Logo UYM"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <div className="hidden bg-primary/10 rounded items-center justify-center w-full h-full">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-black text-foreground tracking-tight leading-none">
                  SIBAYA
                </h1>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                  Universitas Yatsi Madani
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-bold text-foreground leading-snug">
                Sistem Informasi Bimbingan Akademik
              </h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Platform resmi untuk memfasilitasi pencatatan dan monitoring
                kegiatan bimbingan antara mahasiswa dan dosen pembimbing.
              </p>
            </div>

            {/* List Fitur Statis */}
            <div className="space-y-5">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Logbook Digital
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Catat histori dan progres bimbingan secara terstruktur tanpa
                    kertas.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Monitoring Real-time
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Pantau status persetujuan dan ketersediaan waktu dosen
                    pembimbing.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Aman & Terpusat
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Terintegrasi langsung dengan database akademik universitas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Kiri */}
          <div className="mt-8 pt-5 border-t border-border">
            <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
              &copy; {new Date().getFullYear()} Kevin Ardiansyah
              <br />
              Universitas Yatsi Madani
            </p>
          </div>
        </div>

        {/* ==========================================
            SISI KANAN: FORM LOGIN
            ========================================== */}
        <div className="w-full md:w-7/12 p-8 lg:p-12 flex flex-col justify-center bg-card">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground">
              Masuk ke Sistem
            </h2>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Gunakan kredensial SIYAMA Anda.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 p-3 bg-destructive/10 border border-destructive/20 rounded-sm mb-2">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-xs font-bold text-destructive leading-relaxed">
                  {error}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="font-bold text-foreground text-xs uppercase tracking-wider"
              >
                NIM / NIDN / Email
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <Input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan identitas..."
                  className="pl-9 h-11 bg-background border-border shadow-none rounded-sm text-sm font-medium focus-visible:ring-primary"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="font-bold text-foreground text-xs uppercase tracking-wider"
                >
                  Kata Sandi
                </Label>
                <a
                  href="#"
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  Lupa Sandi?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-10 h-11 bg-background border-border shadow-none rounded-sm text-sm font-medium focus-visible:ring-primary tracking-widest placeholder:tracking-normal"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                  tabIndex="-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              className="w-full h-11 rounded-sm font-bold shadow-none text-sm mt-6"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                "Masuk ke Dashboard"
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
