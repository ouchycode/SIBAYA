import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { sibaApi } from "@/api/apiClient";
import { User, Mail, Hash, Camera, Loader2, Save } from "lucide-react";

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [photo, setPhoto] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhoto(user.photo || "");
    }
  }, [user]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Ukuran File Terlalu Besar",
          description: "Maksimal ukuran foto adalah 2MB.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updatedUser = await sibaApi.entities.User.update(user.id, {
        photo,
      });

      setUser({ ...user, photo: updatedUser.photo });

      toast({
        title: "Berhasil",
        description: "Profil Anda berhasil diperbarui.",
      });
    } catch (error) {
      toast({
        title: "Gagal Memperbarui Profil",
        description: error.message || "Terjadi kesalahan saat menyimpan data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // PERUBAHAN HANYA PADA UI/UX (FRONTEND KAKU)
  // ==========================================
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1 border-b border-primary/10 pb-4">
        <h1 className="text-2xl font-black tracking-tight uppercase">
          Pengaturan Profil
        </h1>
        <p className="text-sm text-muted-foreground font-medium">
          Kelola informasi profil dan sesuaikan foto Anda.
        </p>
      </div>

      <Card className="rounded-sm border border-primary/15 shadow-sm">
        <CardHeader className="bg-muted/30 border-b border-primary/10 border-l-4 border-l-primary pb-4">
          <CardTitle className="text-base font-bold uppercase tracking-wide">
            Informasi Personal
          </CardTitle>
          <CardDescription className="text-xs font-medium">
            Perbarui foto profil Anda. Nama, NIM, dan Email tidak dapat diubah.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Area Upload Pas Foto (Rasio 3:4 Formal) */}
            <div className="flex flex-col sm:flex-row gap-6 p-4 border border-primary/10 bg-primary/5 rounded-sm items-start">
              <div className="relative group cursor-pointer shrink-0">
                {/* Frame Foto Paspor Kaku */}
                <div className="w-[120px] h-[160px] rounded-sm overflow-hidden border-2 border-muted bg-background flex items-center justify-center shadow-inner">
                  {photo ? (
                    <img
                      src={photo}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground/50" />
                  )}
                </div>

                {/* Hover Overlay */}
                <label
                  htmlFor="photo-upload"
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                >
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold uppercase">
                    Ubah Foto
                  </span>
                </label>

                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              <div className="flex-1 space-y-2">
                <h4 className="text-sm font-bold uppercase tracking-wide">
                  Foto Profil
                </h4>
                <div className="text-xs text-muted-foreground space-y-1 pb-2">
                  <p>• Format wajib: JPG, PNG atau GIF.</p>
                  <p>• Maksimal ukuran file: 2MB.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-sm text-xs font-bold"
                  onClick={() =>
                    document.getElementById("photo-upload").click()
                  }
                >
                  Pilih Foto Baru
                </Button>
              </div>
            </div>

            {/* Input Form Kaku & Administratif */}
            <div className="grid gap-5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="name"
                  className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground"
                >
                  Nama Lengkap
                </Label>
                <Input
                  id="name"
                  value={name}
                  disabled
                  className="rounded-sm h-10 border-primary/10 bg-muted/50 text-muted-foreground font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground"
                  >
                    Email
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-muted-foreground/70" />
                    </div>
                    <Input
                      id="email"
                      value={user?.email || ""}
                      disabled
                      className="pl-9 bg-muted/50 border-primary/10 text-muted-foreground rounded-sm h-10 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="nim"
                    className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground"
                  >
                    {user?.role === "dosen" ? "NIP / NIDN" : "NIM"}
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hash className="w-4 h-4 text-muted-foreground/70" />
                    </div>
                    <Input
                      id="nim"
                      value={
                        user?.role === "dosen"
                          ? user?.nip || "-"
                          : user?.nim || "-"
                      }
                      disabled
                      className="pl-9 bg-muted/50 border-primary/10 text-muted-foreground rounded-sm h-10 font-mono font-semibold tracking-widest"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="pt-2 border-t border-primary/10">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto rounded-sm font-bold uppercase tracking-wide mt-4"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
