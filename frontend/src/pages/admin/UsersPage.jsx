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
      <Card className="rounded-sm border-2 border-border shadow-none bg-card hover:border-primary/40 transition-colors mb-3 overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row lg:items-stretch">
            {/* Bagian Kiri: Profil & Informasi Akademik */}
            <div className="flex-1 p-5 lg:p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-border/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Avatar / Foto */}
                <div className="flex items-center gap-4 w-full sm:w-1/2">
                  <div className="w-12 h-16 sm:w-[60px] sm:h-[80px] rounded-sm bg-muted border-2 border-primary/20 flex flex-col items-center justify-center shrink-0 overflow-hidden shadow-inner text-muted-foreground">
                    {u.photo ? (
                      <img
                        src={u.photo}
                        alt={u.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <Icon className="w-6 h-6 text-primary mb-1" />
                        <span className="text-[9px] font-black uppercase text-primary/70 leading-none">
                          ROLE
                        </span>
                      </>
                    )}
                  </div>
                  <div className="min-w-0 space-y-1.5 flex-1">
                    <p className="text-sm sm:text-base font-black text-foreground uppercase tracking-wide truncate">
                      {u.full_name || "NAMA BELUM DIATUR"}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-2.5 py-1 rounded-sm border border-border inline-block truncate max-w-full">
                      {u.email}
                    </p>
                  </div>
                </div>

                {/* Identitas Akademik */}
                <div className="w-full sm:w-1/2 pt-4 sm:pt-0 border-t sm:border-0 border-dashed border-border">
                  {u.nim || u.nip ? (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        NIM / NIP / NIDN
                      </p>
                      <p className="text-sm font-mono font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-sm inline-block">
                        {u.nim || u.nip}
                      </p>
                      {u.program_studi && (
                        <p className="text-[10px] font-bold text-foreground mt-1 uppercase tracking-wider truncate flex items-center gap-1.5 before:content-[''] before:w-1 before:h-1 before:bg-primary before:rounded-none">
                          {u.program_studi}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground/60 p-2 bg-muted/20 border border-border/50 rounded-sm">
                      <Shield className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        DATA AKADEMIK KOSONG
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bagian Kanan: Status & Aksi */}
            <div className="bg-muted/10 p-5 lg:w-[220px] flex flex-row lg:flex-col items-center sm:justify-between lg:justify-center gap-4 shrink-0">
              <div className="flex-1 w-full flex justify-start lg:justify-center">
                <Badge
                  variant="outline"
                  className={cn(
                    "font-black uppercase tracking-widest text-[10px] px-3 py-1.5 rounded-sm border-2 w-full text-center flex justify-center",
                    statusColors[u.status] || statusColors.active,
                  )}
                >
                  {statusLabels[u.status] || u.status || "AKTIF"}
                </Badge>
              </div>

              <div className="flex items-center gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 flex-1 rounded-sm border-2 border-border shadow-none hover:bg-primary/10 hover:text-primary hover:border-primary/30 font-black px-0 text-[10px] uppercase tracking-wider"
                  onClick={() => openEdit(u)}
                >
                  <Pencil className="w-3.5 h-3.5 mr-0 sm:mr-1.5" />{" "}
                  <span className="hidden sm:inline">EDIT</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 flex-1 rounded-sm border-2 border-destructive/20 shadow-none hover:bg-destructive/10 text-destructive hover:text-destructive hover:border-destructive/40 font-black px-0 text-[10px] uppercase tracking-wider"
                  onClick={() => setUserToDelete(u)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-0 sm:mr-1.5" />{" "}
                  <span className="hidden sm:inline">HAPUS</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Halaman Formal & Lega */}
      <div className="bg-card border border-primary/15 p-6 sm:p-8 rounded-sm shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
        <div className="pl-2">
          <h1 className="text-2xl font-black text-primary uppercase tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 shrink-0" />
            Kelola Pengguna Sistem
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-2 border-l-2 border-primary/30 pl-3">
            Atur peran (role), status keaktifan, dan kredensial akademik seluruh
            pengguna aplikasi SIBAYA.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="h-10 px-6 gap-2 rounded-sm font-black uppercase tracking-wider shadow-none border-2 border-transparent shrink-0"
        >
          <Plus className="w-4 h-4" /> TAMBAH PENGGUNA
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full mt-6"
      >
        {/* Style Tabs Enterprise - Kotak, Kapital, Solid */}
        <TabsList className="w-full sm:w-auto flex flex-col sm:flex-row bg-muted/40 border-2 border-border rounded-sm p-1.5 h-auto gap-1 mb-6">
          <TabsTrigger
            value="all"
            className="flex-1 justify-center gap-2.5 rounded-sm data-[state=active]:bg-card data-[state=active]:border-primary/20 data-[state=active]:shadow-sm border border-transparent py-2.5 px-6 transition-all"
          >
            <span className="font-black text-xs uppercase tracking-wider">
              Semua Pengguna
            </span>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-sm text-[10px] font-black border border-primary/20">
              {users.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="dosen"
            className="flex-1 justify-center gap-2.5 rounded-sm data-[state=active]:bg-card data-[state=active]:border-primary/20 data-[state=active]:shadow-sm border border-transparent py-2.5 px-6 transition-all"
          >
            <span className="font-black text-xs uppercase tracking-wider">
              Dosen
            </span>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-sm text-[10px] font-black border border-primary/20">
              {dosens.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="mahasiswa"
            className="flex-1 justify-center gap-2.5 rounded-sm data-[state=active]:bg-card data-[state=active]:border-primary/20 data-[state=active]:shadow-sm border border-transparent py-2.5 px-6 transition-all"
          >
            <span className="font-black text-xs uppercase tracking-wider">
              Mahasiswa
            </span>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-sm text-[10px] font-black border border-primary/20">
              {mahasiswas.length}
            </span>
          </TabsTrigger>
          {unconfigured.length > 0 && (
            <TabsTrigger
              value="unconfigured"
              className="flex-1 justify-center gap-2.5 rounded-sm data-[state=active]:bg-card data-[state=active]:border-destructive/20 data-[state=active]:shadow-sm border border-transparent py-2.5 px-6 transition-all"
            >
              <span className="font-black text-xs uppercase tracking-wider text-destructive">
                Belum Diatur
              </span>
              <span className="bg-destructive/10 text-destructive px-2 py-0.5 rounded-sm text-[10px] font-black border border-destructive/20">
                {unconfigured.length}
              </span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tabel Header Semu (Hanya di Desktop) */}
        <div className="hidden lg:flex items-center px-6 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted/40 border-2 border-border rounded-sm mb-3">
          <div className="w-1/2 flex items-center gap-2">
            <Users className="w-3.5 h-3.5" /> INFORMASI PROFIL & AKUN
          </div>
          <div className="flex-1">IDENTITAS AKADEMIK</div>
          <div className="w-[200px] text-center flex items-center justify-center gap-2">
            <Settings2 className="w-3.5 h-3.5" /> STATUS & AKSI
          </div>
        </div>

        {["all", "dosen", "mahasiswa", "unconfigured"].map((tab) => (
          <TabsContent
            key={tab}
            value={tab}
            className="m-0 focus-visible:outline-none"
          >
            {currentUsers.length === 0 ? (
              <div className="border-2 border-border rounded-sm bg-card mt-2">
                <EmptyState
                  icon={Shield}
                  title="TIDAK ADA DATA PENGGUNA"
                  description="Tidak ada pengguna sistem yang terdaftar pada kategori ini."
                />
              </div>
            ) : (
              <div className="space-y-3">
                {currentUsers.map((u) => (
                  <UserRow key={u.id} u={u} />
                ))}

                {/* Kontrol Pagination Formal - Box Kaku */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between bg-muted/20 border-2 border-primary/10 p-4 rounded-sm mt-8 gap-4">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                      HALAMAN {currentPage} DARI {totalPages}
                    </p>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-4 rounded-sm shadow-none font-black text-[10px] uppercase tracking-wider border-2 border-border hover:bg-background"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1.5" />
                        SEBELUMNYA
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-4 rounded-sm shadow-none font-black text-[10px] uppercase tracking-wider border-2 border-border hover:bg-background"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages),
                          )
                        }
                        disabled={currentPage === totalPages}
                      >
                        SELANJUTNYA
                        <ChevronRight className="w-4 h-4 ml-1.5" />
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
        <DialogContent className="rounded-sm border-2 border-primary/20 sm:max-w-xl p-0 overflow-hidden bg-card max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader className="px-6 py-5 border-b border-primary/10 bg-muted/40">
            <DialogTitle className="text-base font-black uppercase tracking-wide text-primary">
              {editUserId
                ? "Formulir Edit Pengguna"
                : "Formulir Pendaftaran Pengguna Baru"}
            </DialogTitle>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 truncate">
              {editUserId
                ? form.full_name || form.email
                : "MASUKKAN DETAIL KREDENSIAL DAN PROFIL AKADEMIK"}
            </p>
          </DialogHeader>

          <div className="px-6 py-6 space-y-6">
            {/* Bagian 1: Kredensial Sistem */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground flex items-center gap-2 border-b-2 border-border/50 pb-2">
                <div className="w-2 h-2 rounded-none bg-primary" /> Kredensial
                Sistem
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    Nama Lengkap <span className="text-primary">*</span>
                  </Label>
                  <Input
                    value={form.full_name}
                    onChange={(e) =>
                      setForm({ ...form, full_name: e.target.value })
                    }
                    className="rounded-sm border-2 border-border focus-visible:ring-primary shadow-none h-10 font-bold uppercase"
                    placeholder="MISAL: KEVIN ARDIANSYAH"
                  />
                </div>
                <div>
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    Alamat Email <span className="text-primary">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="rounded-sm border-2 border-border focus-visible:ring-primary shadow-none h-10 font-bold"
                    placeholder="misal: kevin@yatsi.ac.id"
                    disabled={!!editUserId}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between mb-1.5">
                    <span>
                      Password Sistem{" "}
                      {!editUserId && <span className="text-primary">*</span>}
                    </span>
                    {editUserId && (
                      <span className="text-muted-foreground/60">
                        (KOSONGKAN JIKA TIDAK DIUBAH)
                      </span>
                    )}
                  </Label>
                  <Input
                    type="text"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className="rounded-sm border-2 border-border focus-visible:ring-primary shadow-none h-10 font-mono font-bold"
                    placeholder={
                      editUserId
                        ? "KETIK UNTUK MENGUBAH PASSWORD"
                        : "MINIMAL 6 KARAKTER ALFANUMERIK"
                    }
                  />
                </div>
              </div>
            </div>

            {/* Bagian 2: Profil Akademik */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground flex items-center gap-2 border-b-2 border-border/50 pb-2">
                <div className="w-2 h-2 rounded-none bg-accent" /> Profil
                Akademik
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    Peran (Role)
                  </Label>
                  <Select
                    value={form.role}
                    onValueChange={(v) => setForm({ ...form, role: v })}
                  >
                    <SelectTrigger className="rounded-sm border-2 border-border focus-visible:ring-primary shadow-none h-10 font-bold text-xs uppercase tracking-wider bg-background">
                      <SelectValue placeholder="PILIH PERAN" />
                    </SelectTrigger>
                    <SelectContent className="rounded-sm border-2 border-border shadow-md">
                      <SelectItem
                        value="admin"
                        className="font-black text-xs text-primary uppercase tracking-wider focus:bg-primary/10"
                      >
                        ADMINISTRATOR
                      </SelectItem>
                      <SelectItem
                        value="dosen"
                        className="font-bold text-xs uppercase tracking-wider focus:bg-primary/10"
                      >
                        DOSEN PEMBIMBING
                      </SelectItem>
                      <SelectItem
                        value="mahasiswa"
                        className="font-bold text-xs uppercase tracking-wider focus:bg-primary/10"
                      >
                        MAHASISWA
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    Status Keanggotaan
                  </Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v })}
                  >
                    <SelectTrigger className="rounded-sm border-2 border-border focus-visible:ring-primary shadow-none h-10 font-bold text-xs uppercase tracking-wider bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-sm border-2 border-border shadow-md">
                      <SelectItem
                        value="active"
                        className="font-black text-xs text-emerald-600 uppercase tracking-wider focus:bg-emerald-50"
                      >
                        AKTIF
                      </SelectItem>
                      <SelectItem
                        value="inactive"
                        className="font-bold text-xs text-muted-foreground uppercase tracking-wider focus:bg-muted"
                      >
                        NONAKTIF
                      </SelectItem>
                      <SelectItem
                        value="graduated"
                        className="font-bold text-xs text-blue-600 uppercase tracking-wider focus:bg-blue-50"
                      >
                        LULUS ALUMNI
                      </SelectItem>
                      <SelectItem
                        value="cuti"
                        className="font-bold text-xs text-amber-600 uppercase tracking-wider focus:bg-amber-50"
                      >
                        CUTI AKADEMIK
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.role === "mahasiswa" && (
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 block">
                      Nomor Induk Mahasiswa (NIM)
                    </Label>
                    <Input
                      value={form.nim}
                      onChange={(e) =>
                        setForm({ ...form, nim: e.target.value })
                      }
                      className="rounded-sm border-2 border-border focus-visible:ring-primary shadow-none h-10 font-mono font-bold uppercase"
                      placeholder="MASUKKAN NIM..."
                    />
                  </div>
                )}

                {form.role === "dosen" && (
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 block">
                      Nomor Induk Pegawai (NIP/NIDN)
                    </Label>
                    <Input
                      value={form.nip}
                      onChange={(e) =>
                        setForm({ ...form, nip: e.target.value })
                      }
                      className="rounded-sm border-2 border-border focus-visible:ring-primary shadow-none h-10 font-mono font-bold uppercase"
                      placeholder="MASUKKAN NIP/NIDN..."
                    />
                  </div>
                )}

                <div
                  className={cn(
                    form.role !== "admin" ? "sm:col-span-1" : "sm:col-span-2",
                  )}
                >
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    Program Studi (Departemen)
                  </Label>
                  <Input
                    value={form.program_studi}
                    onChange={(e) =>
                      setForm({ ...form, program_studi: e.target.value })
                    }
                    className="rounded-sm border-2 border-border focus-visible:ring-primary shadow-none h-10 font-bold uppercase"
                    placeholder="MISAL: TEKNIK INFORMATIKA"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-primary/10 bg-muted/20 flex flex-row justify-end gap-3">
            <Button
              variant="outline"
              className="rounded-sm shadow-none font-black uppercase tracking-wider text-xs border-border px-5"
              onClick={() => setIsDialogOpen(false)}
            >
              BATALKAN
            </Button>
            <Button
              className="rounded-sm shadow-none font-black uppercase tracking-wider text-xs px-5"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? "MEMPROSES..." : "SIMPAN DATA PENGGUNA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Alert Konfirmasi Hapus Formal */}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={() => setUserToDelete(null)}
      >
        <AlertDialogContent className="rounded-sm border-2 border-destructive/20 sm:max-w-md p-0 overflow-hidden bg-card">
          <AlertDialogHeader className="px-6 py-5 border-b border-destructive/10 bg-destructive/5">
            <AlertDialogTitle className="font-black text-base uppercase tracking-wide text-destructive flex items-center gap-2">
              <AlertOctagon className="w-5 h-5" />
              Hapus Pengguna Sistem?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="px-6 py-5">
            <AlertDialogDescription className="text-sm font-medium text-foreground leading-relaxed">
              Apakah Anda yakin ingin menghapus akun{" "}
              <span className="font-black uppercase text-destructive">
                "{userToDelete?.full_name || userToDelete?.email}"
              </span>
              ?
              <br />
              <br />
              <span className="font-bold text-muted-foreground text-[10px] uppercase tracking-widest border-l-2 border-destructive pl-2 block">
                Tindakan ini tidak dapat dibatalkan. Pastikan pengguna ini tidak
                memiliki riwayat bimbingan atau data akademik yang masih terikat
                di sistem.
              </span>
            </AlertDialogDescription>
          </div>
          <AlertDialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex flex-row justify-end gap-3">
            <AlertDialogCancel className="rounded-sm shadow-none mt-0 font-black uppercase tracking-wider text-xs border-border px-5">
              BATALKAN
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-sm shadow-none bg-destructive text-destructive-foreground hover:bg-destructive/90 font-black uppercase tracking-wider text-xs px-5 m-0"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "MEMPROSES..." : "YA, HAPUS PERMANEN"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
