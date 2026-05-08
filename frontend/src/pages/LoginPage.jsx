import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useAuth } from "@/lib/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuthError } = useAuth();
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
      if (err.data?.error_type === "user_not_registered") {
        setAuthError({
          type: "user_not_registered",
          message: "User not registered in database",
        });
      } else {
        setError(
          err.message ||
            "Kredensial tidak valid. Silakan periksa kembali NIM/NIDN dan kata sandi Anda.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: CheckCircle2,
      title: "Logbook Digital",
      desc: "Catat histori dan progres bimbingan secara terstruktur tanpa kertas.",
    },
    {
      icon: Clock,
      title: "Monitoring Real-time",
      desc: "Pantau status persetujuan dan ketersediaan waktu dosen pembimbing.",
    },
    {
      icon: ShieldCheck,
      title: "Aman & Terpusat",
      desc: "Terintegrasi langsung dengan database akademik universitas.",
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl bg-card rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col md:flex-row">
        {/* Kiri — Branding */}
        <div className="w-full md:w-5/12 bg-muted/40 border-b md:border-b-0 md:border-r border-border/50 p-8 flex flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center overflow-hidden border border-border shrink-0">
                <img
                  src="/logo-uym.png"
                  alt="Logo UYM"
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                />
                <BookOpen className="w-4 h-4 text-primary hidden" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-none">
                  SIBAYA
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wide">
                  Universitas Yatsi Madani
                </p>
              </div>
            </div>

            {/* Tagline */}
            <div className="mb-8">
              <h2 className="text-base font-semibold text-foreground leading-snug">
                Sistem Informasi Bimbingan Akademik
              </h2>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Platform resmi untuk memfasilitasi pencatatan dan monitoring
                kegiatan bimbingan antara mahasiswa dan dosen pembimbing.
              </p>
            </div>

            {/* Fitur */}
            <div className="space-y-4">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer kiri */}
          <div className="mt-8 pt-4 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground">
              &copy; {new Date().getFullYear()} Universitas Yatsi Madani
            </p>
          </div>
        </div>

        {/* Kanan — Form */}
        <div className="w-full md:w-7/12 p-8 lg:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="text-base font-semibold text-foreground">
              Masuk ke Sistem
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Gunakan kredensial SIYAMA Anda untuk mengakses portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 p-3 bg-destructive/5 border border-destructive/20 rounded">
                <AlertCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                <p className="text-xs text-destructive leading-relaxed">
                  {error}
                </p>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-medium text-foreground"
              >
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan identitas..."
                  className="w-full h-9 pl-9 pr-3 rounded text-sm bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                  required
                  autoFocus
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-foreground"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-9 pl-9 pr-9 rounded text-sm bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-9 rounded bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                "Login Sibaya"
              )}
            </button>
          </form>

          <p className="text-[11px] text-muted-foreground text-center mt-6">
            Kesulitan masuk? Hubungi{" "}
            <a
              href="mailto:baa@uym.ac.id"
              className="text-primary hover:underline"
            >
              BAA
            </a>{" "}
            untuk bantuan akses.
          </p>
        </div>
      </div>
    </div>
  );
}
