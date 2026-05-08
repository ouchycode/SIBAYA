import React, { useState } from "react";
import EmptyState from "@/components/shared/EmptyState";
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
  AlertOctagon,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { useEntityList } from "@/lib/hooks/useEntityList";
import { sibaApi } from "@/api/apiClient";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

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
  cuti: "Cuti Akademik",
};

export default function UsersPage() {
  // ==========================================
  // LOGIKA TETAP UTUH (TIDAK ADA YANG DIUBAH)
  // ==========================================
  const queryClient = useQueryClient();
  const { data: users = [] } = useEntityList("User");

  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    role: "",
    nim: "",
    nip: "",
    program_studi: "",
    status: "active",
    password: "",
  });

  const [userToDelete, setUserToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const dosens = users.filter((u) => u.role === "dosen");
  const mahasiswas = users.filter((u) => u.role === "mahasiswa");
  const unconfigured = users.filter((u) => !u.role);

  const handleTabChange = (value) => {
    setActiveTab(value);
    setCurrentPage(1);
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
      password: "",
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
      password: "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.email || !form.full_name) {
      toast.error("Email dan Nama Lengkap wajib diisi!");
      return;
    }

    if (!editUserId && !form.password) {
      toast.error("Password wajib diisi untuk pengguna baru!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.password) {
        delete payload.password;
      }

      if (editUserId) {
        await sibaApi.entities.User.update(editUserId, payload);
        toast.success("Data pengguna berhasil diperbarui");
      } else {
        await sibaApi.entities.User.create(payload);
        toast.success("Pengguna baru berhasil ditambahkan");
      }
      queryClient.invalidateQueries({ queryKey: ["User"] });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Gagal simpan user:", error);
      const responseData = error.response?.data;

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
        toast.error(
          error.data?.message ||
            error.message ||
            "Terjadi kesalahan sistem. Gagal menyimpan data.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
        error.data?.message ||
          error.message ||
          "Gagal menghapus pengguna. Pastikan akun ini tidak memiliki data akademik yang terikat.",
      );
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  // ==========================================
  // PERUBAHAN PADA UI/UX (FRONTEND KAKU & LEGA)
  // ==========================================
  const UserRow = ({ u }) => {
    const Icon = roleIcon[u.role] || Users;
    return (
      <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] mb-3 overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-stretch">
          {/* Bagian Kiri: Profil & Informasi Akademik */}
          <div className="flex-1 p-5 border-b lg:border-b-0 lg:border-r border-border/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar / Foto */}
              <div className="flex items-center gap-4 w-full sm:w-1/2">
                <div className="w-12 h-12 rounded-full bg-muted flex flex-col items-center justify-center shrink-0 overflow-hidden text-muted-foreground">
                  {u.photo ? (
                    <img
                      src={u.photo}
                      alt={u.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {u.full_name || "Nama belum diatur"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {u.email}
                  </p>
                </div>
              </div>

              {/* Identitas Akademik */}
              <div className="w-full sm:w-1/2 pt-4 sm:pt-0 border-t sm:border-0 border-dashed border-border/50">
                {u.nim || u.nip ? (
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-0.5">
                      NIM / NIP / NIDN
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {u.nim || u.nip}
                    </p>
                    {u.program_studi && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {u.program_studi}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground/60">
                    <Shield className="w-4 h-4" />
                    <span className="text-xs">Data akademik kosong</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bagian Kanan: Status & Aksi */}
          <div className="p-5 lg:w-[200px] flex flex-row lg:flex-col items-center sm:justify-between lg:justify-center gap-3 shrink-0 bg-muted/10">
            <div className="flex-1 w-full flex justify-start lg:justify-center">
              <Badge
                variant="outline"
                className={cn(
                  "font-medium text-[11px] px-2.5 py-0.5 rounded flex justify-center border-0",
                  statusColors[u.status] || statusColors.active,
                )}
              >
                {statusLabels[u.status] || u.status || "Aktif"}
              </Badge>
            </div>

            <div className="flex items-center gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                className="h-8 flex-1 rounded text-xs shadow-none border-border/60 hover:bg-background"
                onClick={() => openEdit(u)}
              >
                <Pencil className="w-3.5 h-3.5 mr-0 sm:mr-1.5" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 flex-1 rounded text-xs shadow-none border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setUserToDelete(u)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-0 sm:mr-1.5" />
                <span className="hidden sm:inline">Hapus</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header Halaman */}
      <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1">
            Manajemen
          </p>
          <h1 className="text-base font-semibold text-foreground">
            Pengguna Sistem
          </h1>
        </div>
        <Button
          onClick={openCreate}
          size="sm"
          className="h-8 px-4 rounded text-xs shadow-none shrink-0"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Tambah Pengguna
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full mt-4"
      >
        <TabsList className="w-full sm:w-auto flex flex-col sm:flex-row bg-transparent border-b border-border rounded-none p-0 h-auto gap-4 mb-4">
          <TabsTrigger
            value="all"
            className="flex-1 sm:flex-none justify-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 transition-all"
          >
            <span className="text-sm font-medium">Semua</span>
            <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs">
              {users.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="dosen"
            className="flex-1 sm:flex-none justify-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 transition-all"
          >
            <span className="text-sm font-medium">Dosen</span>
            <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs">
              {dosens.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="mahasiswa"
            className="flex-1 sm:flex-none justify-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 transition-all"
          >
            <span className="text-sm font-medium">Mahasiswa</span>
            <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs">
              {mahasiswas.length}
            </span>
          </TabsTrigger>
          {unconfigured.length > 0 && (
            <TabsTrigger
              value="unconfigured"
              className="flex-1 sm:flex-none justify-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-destructive data-[state=active]:text-destructive data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-1 transition-all text-destructive"
            >
              <span className="text-sm font-medium">Belum Diatur</span>
              <span className="bg-destructive/10 text-destructive px-2 py-0.5 rounded-full text-xs">
                {unconfigured.length}
              </span>
            </TabsTrigger>
          )}
        </TabsList>

        {["all", "dosen", "mahasiswa", "unconfigured"].map((tab) => (
          <TabsContent
            key={tab}
            value={tab}
            className="m-0 focus-visible:outline-none"
          >
            {currentUsers.length === 0 ? (
              <EmptyState
                icon={Shield}
                title="Tidak ada data pengguna"
                description="Tidak ada pengguna sistem yang terdaftar pada kategori ini."
              />
            ) : (
              <div className="space-y-3">
                {currentUsers.map((u) => (
                  <UserRow key={u.id} u={u} />
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-5 py-3.5 border border-border/50 rounded-md flex items-center justify-between bg-card mt-4">
                    <p className="text-xs text-muted-foreground">
                      Halaman {currentPage} dari {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 rounded text-xs shadow-none border-border/60 hover:bg-muted/40"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                        Sebelumnya
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 rounded text-xs shadow-none border-border/60 hover:bg-muted/40"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages),
                          )
                        }
                        disabled={currentPage === totalPages}
                      >
                        Selanjutnya
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
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
        <DialogContent className="rounded-md border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:max-w-xl p-0 overflow-hidden bg-card max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader className="px-5 py-4 border-b border-border/50">
            <DialogTitle className="text-sm font-semibold text-foreground">
              {editUserId ? "Edit Pengguna" : "Tambah Pengguna Baru"}
            </DialogTitle>
          </DialogHeader>

          <div className="px-5 py-5 space-y-6">
            {/* Bagian 1: Kredensial Sistem */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2 border-b border-border/50 pb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Kredensial
                Sistem
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-foreground mb-1.5 block">
                    Nama Lengkap <span className="text-primary">*</span>
                  </Label>
                  <Input
                    value={form.full_name}
                    onChange={(e) =>
                      setForm({ ...form, full_name: e.target.value })
                    }
                    className="rounded border-border/60 focus-visible:ring-primary shadow-none h-9 text-sm"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-foreground mb-1.5 block">
                    Alamat Email <span className="text-primary">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="rounded border-border/60 focus-visible:ring-primary shadow-none h-9 text-sm"
                    placeholder="misal: nama@yatsi.ac.id"
                    disabled={!!editUserId}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs font-medium text-foreground flex items-center justify-between mb-1.5">
                    <span>
                      Password Sistem{" "}
                      {!editUserId && <span className="text-primary">*</span>}
                    </span>
                    {editUserId && (
                      <span className="text-muted-foreground font-normal text-[11px]">
                        Kosongkan jika tidak diubah
                      </span>
                    )}
                  </Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className="rounded border-border/60 focus-visible:ring-primary shadow-none h-9 text-sm"
                    placeholder={
                      editUserId
                        ? "Ketik untuk mengubah password"
                        : "Minimal 6 karakter"
                    }
                  />
                </div>
              </div>
            </div>

            {/* Bagian 2: Profil Akademik */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2 border-b border-border/50 pb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" /> Profil
                Akademik
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-foreground mb-1.5 block">
                    Peran (Role)
                  </Label>
                  <Select
                    value={form.role}
                    onValueChange={(v) => setForm({ ...form, role: v })}
                  >
                    <SelectTrigger className="rounded border-border/60 focus-visible:ring-primary shadow-none h-9 text-sm">
                      <SelectValue placeholder="Pilih peran" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md border border-border shadow-md">
                      <SelectItem value="admin" className="text-sm">
                        Administrator
                      </SelectItem>
                      <SelectItem value="dosen" className="text-sm">
                        Dosen Pembimbing
                      </SelectItem>
                      <SelectItem value="mahasiswa" className="text-sm">
                        Mahasiswa
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium text-foreground mb-1.5 block">
                    Status
                  </Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v })}
                  >
                    <SelectTrigger className="rounded border-border/60 focus-visible:ring-primary shadow-none h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-md border border-border shadow-md">
                      <SelectItem value="active" className="text-sm">
                        Aktif
                      </SelectItem>
                      <SelectItem value="inactive" className="text-sm">
                        Nonaktif
                      </SelectItem>
                      <SelectItem value="graduated" className="text-sm">
                        Lulus
                      </SelectItem>
                      <SelectItem value="cuti" className="text-sm">
                        Cuti Akademik
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.role === "mahasiswa" && (
                  <div>
                    <Label className="text-xs font-medium text-foreground mb-1.5 block">
                      NIM
                    </Label>
                    <Input
                      value={form.nim}
                      onChange={(e) =>
                        setForm({ ...form, nim: e.target.value })
                      }
                      className="rounded border-border/60 focus-visible:ring-primary shadow-none h-9 text-sm"
                      placeholder="Masukkan NIM..."
                    />
                  </div>
                )}

                {form.role === "dosen" && (
                  <div>
                    <Label className="text-xs font-medium text-foreground mb-1.5 block">
                      NIP/NIDN
                    </Label>
                    <Input
                      value={form.nip}
                      onChange={(e) =>
                        setForm({ ...form, nip: e.target.value })
                      }
                      className="rounded border-border/60 focus-visible:ring-primary shadow-none h-9 text-sm"
                      placeholder="Masukkan NIP/NIDN..."
                    />
                  </div>
                )}

                <div
                  className={cn(
                    form.role !== "admin" ? "sm:col-span-1" : "sm:col-span-2",
                  )}
                >
                  <Label className="text-xs font-medium text-foreground mb-1.5 block">
                    Program Studi
                  </Label>
                  <Input
                    value={form.program_studi}
                    onChange={(e) =>
                      setForm({ ...form, program_studi: e.target.value })
                    }
                    className="rounded border-border/60 focus-visible:ring-primary shadow-none h-9 text-sm"
                    placeholder="Misal: Teknik Informatika"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-5 py-3.5 border-t border-border/50 bg-muted/20 flex flex-row justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded text-xs"
              onClick={() => setIsDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              size="sm"
              className="rounded text-xs"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Alert Konfirmasi Hapus */}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={() => setUserToDelete(null)}
      >
        <AlertDialogContent className="rounded-md border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:max-w-md p-0 overflow-hidden bg-card">
          <AlertDialogHeader className="px-5 py-4 border-b border-border/50">
            <AlertDialogTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-destructive" />
              Hapus Pengguna Sistem?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm mt-1">
              Apakah Anda yakin ingin menghapus akun{" "}
              <span className="font-semibold text-foreground">
                "{userToDelete?.full_name || userToDelete?.email}"
              </span>
              ?
              <br />
              <br />
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="px-5 py-3.5 border-t border-border/50 bg-muted/20 flex flex-row justify-end gap-2">
            <AlertDialogCancel className="rounded text-xs mt-0">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus Permanen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
