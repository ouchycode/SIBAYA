import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { BookOpen, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await base44.auth.login(email, password);
      navigate("/", { replace: true });
      window.location.reload();
    } catch (err) {
      setError(err.message || "Email atau password tidak valid.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ornamen Background (Opsional untuk estetika portal akademik) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md p-0 rounded-md border-border shadow-lg overflow-hidden relative z-10 bg-card">
        {/* Header/Banner Login */}
        <div className="bg-primary px-6 py-8 text-center border-b border-primary-foreground/10">
          <div className="w-14 h-14 bg-card rounded flex items-center justify-center mx-auto mb-4 shadow-sm border border-border">
            <BookOpen className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-primary-foreground tracking-wide">
            SIBAYA
          </h1>
          <p className="text-xs font-semibold text-primary-foreground/80 mt-1 uppercase tracking-widest">
            Universitas Yatsi Madani
          </p>
        </div>

        {/* Form Login */}
        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground">
              Masuk ke Sistem
            </h2>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Gunakan email dan kata sandi yang terdaftar di sistem akademik.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-foreground">
                Alamat Email
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@uym.ac.id"
                  className="pl-9 rounded-sm border-border shadow-none focus-visible:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-bold text-foreground">
                  Kata Sandi
                </Label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 rounded-sm border-border shadow-none focus-visible:ring-primary"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-sm">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-xs font-bold text-red-700 leading-relaxed">
                  {error}
                </p>
              </div>
            )}

            <Button
              className="w-full rounded-sm font-bold shadow-none mt-2 h-10"
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

          <div className="mt-8 text-center border-t border-border pt-4">
            <p className="text-[11px] font-medium text-muted-foreground">
              Mengalami kendala saat login? Hubungi{" "}
              <span className="font-bold text-foreground">
                Biro Akademik (BAA)
              </span>
              .
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
