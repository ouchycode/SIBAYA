import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
        name,
        photo,
      });
      
      setUser({ ...user, name: updatedUser.name, photo: updatedUser.photo });
      
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Profil</h1>
        <p className="text-muted-foreground">
          Kelola informasi profil dan sesuaikan foto Anda.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Personal</CardTitle>
            <CardDescription>
              Perbarui nama dan foto profil Anda. NIM dan Email tidak dapat diubah.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Photo Upload */}
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                <div className="relative group cursor-pointer">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-muted bg-muted flex items-center justify-center">
                    {photo ? (
                      <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <label htmlFor="photo-upload" className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-6 h-6 text-white" />
                  </label>
                  <input 
                    id="photo-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePhotoChange} 
                  />
                </div>
                <div className="text-center sm:text-left">
                  <h4 className="text-sm font-semibold">Foto Profil</h4>
                  <p className="text-xs text-muted-foreground mt-1 mb-2">
                    Format JPG, PNG atau GIF. Maksimal 2MB.
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('photo-upload').click()}>
                    Pilih Foto Baru
                  </Button>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Masukkan nama Anda"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-muted-foreground">Email</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <Input 
                      id="email" 
                      value={user?.email || ""} 
                      disabled 
                      className="pl-9 bg-muted/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nim" className="text-muted-foreground">
                    {user?.role === 'dosen' ? 'NIP / NIDN' : 'NIM'}
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <Input 
                      id="nim" 
                      value={user?.role === 'dosen' ? (user?.nip || "-") : (user?.nim || "-")} 
                      disabled 
                      className="pl-9 bg-muted/50"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
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
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
