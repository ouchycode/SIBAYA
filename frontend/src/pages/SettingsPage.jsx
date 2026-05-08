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
import { toast } from "sonner";
import { sibaApi } from "@/api/apiClient";
import { User, Mail, Hash, Camera, Loader2, Save } from "lucide-react";

export default function SettingsPage() {
  const { user, setUser } = useAuth();

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
        toast.error("Maksimal ukuran foto adalah 2MB.");
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

      toast.success("Profil Anda berhasil diperbarui.");
    } catch (error) {
      toast.error(error.data?.message || error.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // PERUBAHAN HANYA PADA UI/UX (FRONTEND KAKU)
  // ==========================================
  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-10">
      {/* Header Halaman */}
      <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5">
        <h1 className="text-base font-semibold text-foreground">
          Pengaturan Profil
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola informasi profil dan sesuaikan foto Anda.
        </p>
      </div>

      <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden border border-border/50">
        <div className="px-5 py-4 border-b border-border/50 bg-muted/10">
          <h3 className="text-sm font-semibold text-foreground">
            Informasi Personal
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Perbarui foto profil Anda. Nama, NIM, dan Email tidak dapat diubah.
          </p>
        </div>

        <div className="p-5">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Area Upload Pas Foto */}
            <div className="flex flex-col sm:flex-row gap-5 p-4 border border-border/50 bg-muted/20 rounded-md items-start">
              <div className="relative group cursor-pointer shrink-0">
                {/* Frame Foto Paspor */}
                <div className="w-28 h-36 rounded-md overflow-hidden border border-border bg-background flex items-center justify-center">
                  {photo ? (
                    <img
                      src={photo}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground/50" />
                  )}
                </div>

                {/* Hover Overlay */}
                <label
                  htmlFor="photo-upload"
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white rounded-md"
                >
                  <Camera className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">Ubah Foto</span>
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
                <h4 className="text-sm font-semibold text-foreground">
                  Foto Profil
                </h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Format wajib: JPG, PNG atau GIF.</p>
                  <p>• Maksimal ukuran file: 2MB.</p>
                </div>
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-4 rounded text-xs shadow-none border-border/60 hover:bg-muted/40"
                    onClick={() =>
                      document.getElementById("photo-upload").click()
                    }
                  >
                    Pilih Foto Baru
                  </Button>
                </div>
              </div>
            </div>

            {/* Input Form */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="name"
                  className="text-xs font-medium text-foreground"
                >
                  Nama Lengkap
                </Label>
                <Input
                  id="name"
                  value={name}
                  disabled
                  className="rounded h-9 border-border/60 bg-muted/30 text-muted-foreground text-sm shadow-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-xs font-medium text-foreground"
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
                      className="pl-9 h-9 rounded border-border/60 bg-muted/30 text-muted-foreground text-sm shadow-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="nim"
                    className="text-xs font-medium text-foreground"
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
                      className="pl-9 h-9 rounded border-border/60 bg-muted/30 text-muted-foreground font-mono text-sm shadow-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="pt-4 border-t border-border/50 flex justify-end">
              <Button
                type="submit"
                disabled={isLoading}
                size="sm"
                className="h-8 px-5 rounded text-xs shadow-none w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
