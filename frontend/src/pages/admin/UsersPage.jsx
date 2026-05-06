import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Pencil,
  GraduationCap,
  BookOpen,
  Shield,
  ShieldCheck,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useEntityList } from "@/lib/hooks/useEntityList";
import { sibaApi } from "@/api/apiClient";
import { useQueryClient } from "@tanstack/react-query";

const ITEMS_PER_PAGE = 5;

const roleIcon = { dosen: BookOpen, mahasiswa: GraduationCap, admin: Shield };

const statusColors = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-300",
  inactive: "bg-muted text-muted-foreground border-border",
  graduated: "bg-blue-50 text-blue-700 border-blue-300",
  cuti: "bg-amber-50 text-amber-700 border-amber-300",
};

const statusLabels = {
  active: "Aktif",
  inactive: "Nonaktif",
  graduated: "Lulus",
  cuti: "Cuti",
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { data: users = [] } = useEntityList("User");

  // State untuk Tabs dan Pagination
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // State untuk Dialog (Tambah & Edit)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editUserId, setEditUserId] = useState(null); // Jika null, berarti Create mode
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    role: "",
    nim: "",
    nip: "",
    program_studi: "",
    status: "active",
  });

  // State untuk Alert Penghapusan
  const [userToDelete, setUserToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pengelompokan Data
  const dosens = users.filter((u) => u.role === "dosen");
  const mahasiswas = users.filter((u) => u.role === "mahasiswa");
  const unconfigured = users.filter((u) => !u.role);

  // ==========================================
  // LOGIKA PAGINATION & TABS
  // ==========================================
  const handleTabChange = (value) => {
    setActiveTab(value);
    setCurrentPage(1); // Reset halaman ke 1 saat pindah tab
  };

  const getActiveData = () => {
    if (activeTab === "dosen") return dosens;
    if (activeTab === "mahasiswa") return mahasiswas;
    if (activeTab === "unconfigured") return unconfigured;
    return users;
  };

  const activeData = getActiveData();
  const totalPages = Math.ceil(activeData.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentUsers = activeData.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  // ==========================================
  // LOGIKA TAMBAH & EDIT USER
  // ==========================================
  const openCreate = () => {
    setEditUserId(null);
    setForm({
      email: "",
      full_name: "",
      role: "",
      nim: "",
      nip: "",
      program_studi: "",
      status: "active",
    });
    setIsDialogOpen(true);
  };

  const openEdit = (u) => {
    setEditUserId(u.id);
    setForm({
      email: u.email || "",
      full_name: u.full_name || "",
      role: u.role || "",
      nim: u.nim || "",
      nip: u.nip || "",
      program_studi: u.program_studi || "",
      status: u.status || "active",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.email || !form.full_name) {
      toast.error("Email dan Nama Lengkap wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editUserId) {
        // UPDATE USER
        await sibaApi.entities.User.update(editUserId, form);
        toast.success("Data pengguna berhasil diperbarui");
      } else {
        // CREATE USER
        await sibaApi.entities.User.create(form);
        toast.success("Pengguna baru berhasil ditambahkan");
      }
      queryClient.invalidateQueries({ queryKey: ["User"] });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Gagal simpan user:", error);
      const responseData = error.response?.data;

      // Tangkap error validasi Laravel (status 422)
      if (error.response?.status === 422 && responseData?.errors) {
        if (responseData.errors.email) {
          toast.error("Gagal: Email sudah digunakan oleh pengguna lain!");
        } else if (responseData.errors.nim) {
          toast.error("Gagal: NIM tersebut sudah terdaftar di sistem!");
        } else if (responseData.errors.nip) {
          toast.error("Gagal: NIP/NIDN tersebut sudah terdaftar di sistem!");
        } else {
          const firstError = Object.values(responseData.errors)[0][0];
          toast.error(`Gagal: ${firstError}`);
        }
      } else {
        toast.error(error.data?.message || error.message || "Terjadi kesalahan sistem. Gagal menyimpan data.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // LOGIKA HAPUS USER
  // ==========================================
  const handleDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await sibaApi.entities.User.delete(userToDelete.id);
      toast.success("Pengguna berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["User"] });
    } catch (error) {
      console.error("Gagal hapus user:", error);
      toast.error(
        error.data?.message || error.message || "Gagal menghapus pengguna. Pastikan akun ini tidak memiliki data akademik yang terikat.",
      );
    } finally {
      setIsDeleting(false);
      setUserToDelete(null); // Tutup dialog setelah selesai
    }
  };

  const UserRow = ({ u }) => {
    const Icon = roleIcon[u.role] || Users;
    return (
      <Card className="rounded-md border border-border shadow-none bg-card hover:border-primary/40 transition-colors mb-2">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Profil Singkat */}
            <div className="flex items-center gap-3 w-full sm:w-2/5">
              <div className="w-10 h-10 rounded bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
                {u.photo ? (
                  <img src={u.photo} alt={u.full_name} className="w-full h-full object-cover" />
                ) : (
                  <Icon className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground truncate">
                  {u.full_name || "Nama Belum Diatur"}
                </p>
                <p className="text-xs font-medium text-muted-foreground truncate mt-0.5">
                  {u.email}
                </p>
              </div>
            </div>

            {/* Identitas Akademik */}
            <div className="hidden sm:block w-1/4">
              {u.nim || u.nip ? (
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {u.nim || u.nip}
                  </p>
                  {u.program_studi && (
                    <p className="text-[10px] font-medium text-muted-foreground mt-0.5 uppercase tracking-wider truncate">
                      {u.program_studi}
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-xs italic text-muted-foreground">
                  Belum ada NIM/NIP
                </span>
              )}
            </div>

            {/* Status & Aksi */}
            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto border-t border-border sm:border-0 pt-3 sm:pt-0 shrink-0">
              <Badge
                variant="outline"
                className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-sm mr-2 ${statusColors[u.status] || statusColors.active}`}
              >
                {statusLabels[u.status] || u.status || "Aktif"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-sm border-border shadow-none hover:bg-primary/10 hover:text-primary font-bold px-2.5"
                onClick={() => openEdit(u)}
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-sm border-transparent shadow-none hover:bg-destructive/10 text-destructive hover:text-destructive hover:border-destructive/30 font-bold px-2.5"
                onClick={() => setUserToDelete(u)}
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman Formal */}
      <div className="bg-card border border-border p-5 rounded-md shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Kelola Pengguna Sistem
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Atur peran (role), status aktif, dan data akademik seluruh pengguna
            aplikasi SIBAYA.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 rounded-md font-bold shadow-none shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah User
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        {/* Desain Tabs ala Panel Kontrol */}
        <TabsList className="w-full sm:w-auto flex flex-wrap bg-muted/50 border border-border rounded-md p-1 h-auto mb-4">
          <TabsTrigger
            value="all"
            className="gap-2 rounded-sm data-[state=active]:bg-card data-[state=active]:shadow-sm py-2"
          >
            <span className="font-bold">Semua User</span>
            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm text-[10px] font-black leading-none border border-primary/20">
              {users.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="dosen"
            className="gap-2 rounded-sm data-[state=active]:bg-card data-[state=active]:shadow-sm py-2"
          >
            <span className="font-bold">Dosen</span>
            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm text-[10px] font-black leading-none border border-primary/20">
              {dosens.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="mahasiswa"
            className="gap-2 rounded-sm data-[state=active]:bg-card data-[state=active]:shadow-sm py-2"
          >
            <span className="font-bold">Mahasiswa</span>
            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm text-[10px] font-black leading-none border border-primary/20">
              {mahasiswas.length}
            </span>
          </TabsTrigger>
          {unconfigured.length > 0 && (
            <TabsTrigger
              value="unconfigured"
              className="gap-2 rounded-sm data-[state=active]:bg-card data-[state=active]:shadow-sm py-2"
            >
              <span className="font-bold text-destructive">Belum Diatur</span>
              <span className="bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-sm text-[10px] font-black leading-none border border-destructive/20">
                {unconfigured.length}
              </span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tabel Header (Hanya di Desktop) */}
        <div className="hidden sm:flex items-center px-5 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
          <div className="w-2/5">Informasi Akun</div>
          <div className="w-1/4">Data Akademik</div>
          <div className="flex-1 text-right">Status & Aksi</div>
        </div>

        {["all", "dosen", "mahasiswa", "unconfigured"].map((tab) => (
          <TabsContent
            key={tab}
            value={tab}
            className="m-0 focus-visible:outline-none"
          >
            {currentUsers.length === 0 ? (
              <div className="p-8 text-center bg-card border border-border rounded-md text-sm text-muted-foreground font-medium">
                Tidak ada data pengguna di tab ini.
              </div>
            ) : (
              <div className="space-y-2">
                {currentUsers.map((u) => (
                  <UserRow key={u.id} u={u} />
                ))}

                {/* Kontrol Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between bg-card border border-border p-3 rounded-md shadow-sm mt-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Halaman {currentPage} dari {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 rounded-sm shadow-none font-bold text-xs"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Sebelumnya
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 rounded-sm shadow-none font-bold text-xs"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages),
                          )
                        }
                        disabled={currentPage === totalPages}
                      >
                        Selanjutnya
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog Form Tambah / Edit User */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-md border-border sm:max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="font-bold text-lg">
              {editUserId ? "Edit Pengguna" : "Tambah Pengguna Baru"}
            </DialogTitle>
            <p className="text-sm font-medium text-muted-foreground mt-1 truncate">
              {editUserId
                ? form.full_name || form.email
                : "Masukkan detail akun dan profil pengguna"}
            </p>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <Label className="font-bold text-foreground">Nama Lengkap</Label>
              <Input
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                className="mt-1.5 rounded-sm border-border shadow-none"
                placeholder="Misal: Kevin Ardiansyah"
              />
            </div>

            <div>
              <Label className="font-bold text-foreground">Alamat Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1.5 rounded-sm border-border shadow-none"
                placeholder="Misal: kevin@yatsi.ac.id"
                disabled={!!editUserId} // Opsional: Email tidak bisa diubah jika sedang edit
              />
            </div>

            <div className="h-px bg-border my-2" />

            <div>
              <Label className="font-bold text-foreground">Peran (Role)</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v })}
              >
                <SelectTrigger className="mt-1.5 rounded-sm border-border shadow-none bg-background">
                  <SelectValue placeholder="Pilih Peran Sistem" />
                </SelectTrigger>
                <SelectContent className="rounded-sm border-border">
                  <SelectItem value="admin" className="font-bold text-primary">
                    Administrator
                  </SelectItem>
                  <SelectItem value="dosen" className="font-medium">
                    Dosen
                  </SelectItem>
                  <SelectItem value="mahasiswa" className="font-medium">
                    Mahasiswa
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.role === "mahasiswa" && (
              <div>
                <Label className="font-bold text-foreground">
                  Nomor Induk Mahasiswa (NIM)
                </Label>
                <Input
                  value={form.nim}
                  onChange={(e) => setForm({ ...form, nim: e.target.value })}
                  className="mt-1.5 rounded-sm border-border shadow-none"
                  placeholder="Masukkan NIM..."
                />
              </div>
            )}

            {form.role === "dosen" && (
              <div>
                <Label className="font-bold text-foreground">
                  Nomor Induk Pegawai (NIP/NIDN)
                </Label>
                <Input
                  value={form.nip}
                  onChange={(e) => setForm({ ...form, nip: e.target.value })}
                  className="mt-1.5 rounded-sm border-border shadow-none"
                  placeholder="Masukkan NIP/NIDN..."
                />
              </div>
            )}

            <div>
              <Label className="font-bold text-foreground">
                Program Studi (Departemen)
              </Label>
              <Input
                value={form.program_studi}
                onChange={(e) =>
                  setForm({ ...form, program_studi: e.target.value })
                }
                className="mt-1.5 rounded-sm border-border shadow-none"
                placeholder="Misal: Teknik Informatika"
              />
            </div>

            <div>
              <Label className="font-bold text-foreground">
                Status Keanggotaan
              </Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger className="mt-1.5 rounded-sm border-border shadow-none bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-sm border-border">
                  <SelectItem
                    value="active"
                    className="font-bold text-emerald-600"
                  >
                    Aktif
                  </SelectItem>
                  <SelectItem value="inactive" className="font-medium">
                    Nonaktif
                  </SelectItem>
                  <SelectItem
                    value="graduated"
                    className="font-medium text-blue-600"
                  >
                    Lulus
                  </SelectItem>
                  <SelectItem
                    value="cuti"
                    className="font-medium text-amber-600"
                  >
                    Cuti Akademik
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-4 sm:justify-end gap-2 mt-4">
            <Button
              variant="outline"
              className="rounded-sm shadow-none font-bold"
              onClick={() => setIsDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              className="rounded-sm shadow-none font-bold"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Alert Konfirmasi Hapus */}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={() => setUserToDelete(null)}
      >
        <AlertDialogContent className="rounded-md border-border sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Hapus Pengguna?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground font-medium">
              Apakah Anda yakin ingin menghapus akun{" "}
              <span className="font-bold">
                {userToDelete?.full_name || userToDelete?.email}
              </span>
              ?
              <br />
              <span className="text-muted-foreground mt-2 block text-xs">
                Tindakan ini tidak dapat dibatalkan. Pastikan pengguna ini tidak
                memiliki data bimbingan yang masih aktif.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="rounded-sm shadow-none font-bold mt-0 border-border">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-sm shadow-none font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Memproses..." : "Ya, Hapus Permanen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
