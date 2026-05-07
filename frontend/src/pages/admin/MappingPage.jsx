import React, { useState, useMemo } from "react";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  UserCheck,
  Plus,
  Trash2,
  ArrowRight,
  Pencil,
  BookType,
  Search,
  Check,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  AlertOctagon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEntityList } from "@/lib/hooks/useEntityList";
import { sibaApi } from "@/api/apiClient";
import { useQueryClient } from "@tanstack/react-query";

export default function MappingPage() {
  // ==========================================
  // LOGIKA TETAP UTUH (TIDAK ADA YANG DIUBAH)
  // ==========================================
  const queryClient = useQueryClient();
  const { data: mappings = [] } = useEntityList("Mapping");
  const { data: users = [] } = useEntityList("User");

  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchMapping, setSearchMapping] = useState("");

  const [form, setForm] = useState({
    student_email: "",
    supervisor_email: "",
    thesis_title: "",
  });

  const [openStudentSelect, setOpenStudentSelect] = useState(false);
  const [openDosenSelect, setOpenDosenSelect] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const students = users.filter(
    (u) => u.role === "mahasiswa" && (u.status === "active" || !u.status),
  );
  const dosens = users.filter((u) => u.role === "dosen");

  const filteredMappings = useMemo(() => {
    return mappings
      .filter((m) => m.status === "active")
      .filter((m) => {
        const query = searchMapping.toLowerCase();
        return (
          m.student_name?.toLowerCase().includes(query) ||
          m.student_nim?.toLowerCase().includes(query) ||
          m.supervisor_name?.toLowerCase().includes(query)
        );
      });
  }, [mappings, searchMapping]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchMapping]);

  const totalPages = Math.ceil(filteredMappings.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentMappings = filteredMappings.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const handleSave = async () => {
    setIsSubmitting(true);
    const student = students.find((s) => s.email === form.student_email);
    const dosen = dosens.find((d) => d.email === form.supervisor_email);

    const payload = {
      student_email: form.student_email,
      student_name: student?.full_name || form.student_email,
      student_nim: student?.nim || "",
      supervisor_email: form.supervisor_email,
      supervisor_name: dosen?.full_name || form.supervisor_email,
      thesis_title: form.thesis_title,
      period_id: 1,
      status: "active",
    };

    try {
      if (editId) {
        await sibaApi.entities.Mapping.update(editId, payload);
        toast.success("Data mapping diperbarui");
      } else {
        await sibaApi.entities.Mapping.create(payload);
        toast.success("Mapping berhasil ditambahkan");
      }
      queryClient.invalidateQueries({ queryKey: ["Mapping"] });
      setShowDialog(false);
    } catch (error) {
      toast.error(
        error.data?.message || error.message || "Gagal menyimpan mapping.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await sibaApi.entities.Mapping.update(deleteTarget.id, {
        status: "inactive",
      });
      queryClient.invalidateQueries({ queryKey: ["Mapping"] });
      toast.success("Mapping dinonaktifkan");
    } catch (error) {
      toast.error(
        error.data?.message || error.message || "Gagal menonaktifkan mapping.",
      );
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ==========================================
  // PERUBAHAN PADA UI/UX (FRONTEND KAKU & LEGA)
  // ==========================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Halaman Formal & Lega */}
      <div className="bg-card border border-primary/15 p-6 sm:p-8 rounded-sm shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
        <div className="pl-2">
          <h1 className="text-2xl font-black text-primary uppercase tracking-tight">
            Mapping Dosen Pembimbing
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-2 border-l-2 border-primary/30 pl-3">
            Kelola alokasi mahasiswa kepada dosen pembimbing akademik secara
            sistematis.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditId(null);
            setForm({
              student_email: "",
              supervisor_email: "",
              thesis_title: "",
            });
            setShowDialog(true);
          }}
          className="h-10 px-6 gap-2 font-black shadow-none rounded-sm uppercase tracking-wider shrink-0 border-2 border-transparent"
        >
          <Plus className="w-4 h-4" /> TAMBAH MAPPING
        </Button>
      </div>

      {/* Area Pencarian Utama */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
        <Input
          placeholder="CARI BERDASARKAN NAMA MAHASISWA, NIM, ATAU DOSEN..."
          className="pl-12 h-12 border-2 border-primary/10 shadow-sm rounded-sm bg-card text-xs font-bold uppercase tracking-wider focus-visible:ring-primary/50"
          value={searchMapping}
          onChange={(e) => setSearchMapping(e.target.value)}
        />
      </div>

      {filteredMappings.length === 0 ? (
        <div className="border-2 border-border rounded-sm bg-card mt-6">
          <EmptyState
            icon={UserCheck}
            title={searchMapping ? "DATA TIDAK DITEMUKAN" : "BELUM ADA MAPPING"}
            description={
              searchMapping
                ? "Tidak ada hasil yang sesuai dengan kata kunci pencarian Anda."
                : "Silakan tambah pemetaan (mapping) mahasiswa ke dosen pembimbing baru."
            }
          />
        </div>
      ) : (
        <div className="space-y-4 mt-6">
          {currentMappings.map((m) => (
            <Card
              key={m.id}
              className="rounded-sm border-2 border-primary/10 shadow-sm bg-card hover:border-primary/30 transition-all overflow-hidden"
            >
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row lg:items-stretch">
                  {/* Konten Utama Kiri */}
                  <div className="flex-1 p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-border/50">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 lg:gap-12">
                      {/* Entitas Mahasiswa */}
                      <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
                        <div className="w-12 h-12 rounded-sm bg-primary/10 border border-primary/20 flex flex-col items-center justify-center shrink-0 shadow-inner">
                          <span className="text-[10px] font-black uppercase text-primary/70 mb-0.5 leading-none">
                            ROLE
                          </span>
                          <span className="text-sm font-black text-primary leading-none">
                            MHS
                          </span>
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-black text-foreground uppercase tracking-wide truncate">
                            {m.student_name}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-2 py-0.5 rounded-sm border border-border inline-block">
                            {m.student_nim || m.student_email}
                          </p>
                        </div>
                      </div>

                      {/* Panah Indikator (Relasi) */}
                      <ArrowRight className="hidden sm:block w-6 h-6 text-primary/30 shrink-0" />

                      {/* Entitas Dosen */}
                      <div className="flex items-center gap-4 flex-1 min-w-0 w-full mt-2 sm:mt-0 pt-4 sm:pt-0 border-t border-dashed border-border sm:border-0">
                        <div className="w-12 h-12 rounded-sm bg-accent/10 border border-accent/20 text-accent-foreground flex flex-col items-center justify-center shrink-0 shadow-inner">
                          <span className="text-[10px] font-black uppercase text-accent-foreground/70 mb-0.5 leading-none">
                            ROLE
                          </span>
                          <span className="text-sm font-black leading-none text-accent-foreground">
                            DSN
                          </span>
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-black text-foreground uppercase tracking-wide truncate">
                            {m.supervisor_name}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-2 py-0.5 rounded-sm border border-border inline-block truncate max-w-full">
                            {m.supervisor_email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Judul Skripsi / Topik */}
                    <div className="mt-6 pt-4 border-t-2 border-border/50">
                      <div className="flex items-start gap-3 bg-muted/20 p-4 rounded-sm border border-border/50">
                        <BookType className="w-5 h-5 text-primary shrink-0" />
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            Topik / Judul Tugas Akhir
                          </p>
                          <p className="text-sm font-bold text-foreground leading-snug">
                            {m.thesis_title
                              ? `"${m.thesis_title}"`
                              : "JUDUL BELUM DIINPUT"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Aksi Kanan */}
                  <div className="bg-muted/10 p-5 lg:w-28 flex flex-row lg:flex-col items-center justify-center gap-3 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 w-full rounded-sm font-black shadow-none text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary border-border bg-background"
                      onClick={() => {
                        setEditId(m.id);
                        setForm({
                          student_email: m.student_email,
                          supervisor_email: m.supervisor_email,
                          thesis_title: m.thesis_title || "",
                        });
                        setShowDialog(true);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-0 lg:mr-1.5" />
                      <span className="hidden lg:inline">EDIT</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 w-full rounded-sm font-black shadow-none text-[10px] uppercase tracking-wider text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground bg-destructive/5"
                      onClick={() => setDeleteTarget(m)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-0 lg:mr-1.5" />
                      <span className="hidden lg:inline">HAPUS</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              SELANJUTNYA
              <ChevronRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog Form Mapping dengan Combobox (Searchable Select) */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-sm border-2 border-primary/20 sm:max-w-lg p-0 overflow-hidden bg-card">
          <DialogHeader className="px-6 py-5 border-b border-primary/10 bg-muted/40">
            <DialogTitle className="text-base font-black uppercase tracking-wide text-primary">
              {editId
                ? "Formulir Edit Mapping"
                : "Formulir Tambah Mapping Baru"}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-6 space-y-6">
            {/* SEARCHABLE MAHASISWA */}
            <div className="space-y-2 flex flex-col">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Mahasiswa (Ketik Nama/NIM){" "}
                <span className="text-primary">*</span>
              </Label>
              <Popover
                open={openStudentSelect}
                onOpenChange={setOpenStudentSelect}
              >
                <PopoverTrigger asChild disabled={!!editId}>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="justify-between rounded-sm border-2 border-border shadow-none h-10 font-bold text-xs uppercase"
                  >
                    {form.student_email
                      ? students.find((s) => s.email === form.student_email)
                          ?.full_name
                      : "PILIH MAHASISWA..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[400px] p-0 rounded-sm border-2 border-border shadow-md"
                  align="start"
                >
                  <Command>
                    <CommandInput
                      placeholder="Ketik nama atau NIM mahasiswa..."
                      className="uppercase font-bold text-xs"
                    />
                    <CommandList>
                      <CommandEmpty className="py-6 text-center text-xs font-bold uppercase text-muted-foreground">
                        Mahasiswa tidak ditemukan.
                      </CommandEmpty>
                      <CommandGroup>
                        {students.map((s) => (
                          <CommandItem
                            key={s.id}
                            value={`${s.full_name} ${s.nim}`}
                            onSelect={() => {
                              setForm({ ...form, student_email: s.email });
                              setOpenStudentSelect(false);
                            }}
                            className="text-xs font-bold uppercase tracking-wider focus:bg-primary/10"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 text-primary",
                                form.student_email === s.email
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {s.full_name}{" "}
                            <span className="ml-2 text-[10px] text-muted-foreground tracking-widest">
                              ({s.nim || "NO NIM"})
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* SEARCHABLE DOSEN */}
            <div className="space-y-2 flex flex-col">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Dosen Pembimbing <span className="text-primary">*</span>
              </Label>
              <Popover open={openDosenSelect} onOpenChange={setOpenDosenSelect}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="justify-between rounded-sm border-2 border-border shadow-none h-10 font-bold text-xs uppercase"
                  >
                    {form.supervisor_email
                      ? dosens.find((d) => d.email === form.supervisor_email)
                          ?.full_name
                      : "PILIH DOSEN PEMBIMBING..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[400px] p-0 rounded-sm border-2 border-border shadow-md"
                  align="start"
                >
                  <Command>
                    <CommandInput
                      placeholder="Ketik nama dosen..."
                      className="uppercase font-bold text-xs"
                    />
                    <CommandList>
                      <CommandEmpty className="py-6 text-center text-xs font-bold uppercase text-muted-foreground">
                        Dosen tidak ditemukan.
                      </CommandEmpty>
                      <CommandGroup>
                        {dosens.map((d) => (
                          <CommandItem
                            key={d.id}
                            value={d.full_name}
                            onSelect={() => {
                              setForm({ ...form, supervisor_email: d.email });
                              setOpenDosenSelect(false);
                            }}
                            className="text-xs font-bold uppercase tracking-wider focus:bg-primary/10"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 text-primary",
                                form.supervisor_email === d.email
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {d.full_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Judul Skripsi / Tugas Akhir (Opsional)
              </Label>
              <Input
                value={form.thesis_title}
                onChange={(e) =>
                  setForm({ ...form, thesis_title: e.target.value })
                }
                placeholder="MASUKKAN JUDUL JIKA SUDAH ADA..."
                className="mt-1.5 rounded-sm border-2 border-border focus-visible:ring-primary shadow-none h-10 font-bold uppercase"
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-primary/10 bg-muted/20 flex flex-row justify-end gap-3">
            <Button
              variant="outline"
              className="rounded-sm shadow-none font-black uppercase tracking-wider text-xs border-border px-5"
              onClick={() => setShowDialog(false)}
            >
              BATALKAN
            </Button>
            <Button
              className="rounded-sm shadow-none font-black uppercase tracking-wider text-xs px-5"
              onClick={handleSave}
              disabled={
                !form.student_email || !form.supervisor_email || isSubmitting
              }
            >
              {isSubmitting
                ? "MEMPROSES..."
                : editId
                  ? "SIMPAN PERUBAHAN"
                  : "SIMPAN MAPPING"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Delete Formal */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-sm border-2 border-destructive/20 sm:max-w-md p-0 overflow-hidden bg-card">
          <AlertDialogHeader className="px-6 py-5 border-b border-destructive/10 bg-destructive/5">
            <AlertDialogTitle className="font-black text-base uppercase tracking-wide text-destructive flex items-center gap-2">
              <AlertOctagon className="w-5 h-5" />
              Nonaktifkan Mapping?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="px-6 py-5">
            <AlertDialogDescription className="text-sm font-medium text-foreground leading-relaxed">
              Pemetaan (mapping) akademik antara mahasiswa{" "}
              <span className="font-black uppercase">
                {deleteTarget?.student_name}
              </span>{" "}
              dan dosen{" "}
              <span className="font-black uppercase">
                {deleteTarget?.supervisor_name}
              </span>{" "}
              akan dinonaktifkan.
            </AlertDialogDescription>
          </div>
          <AlertDialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex flex-row justify-end gap-3">
            <AlertDialogCancel className="rounded-sm shadow-none mt-0 font-black uppercase tracking-wider text-xs border-border px-5">
              BATALKAN
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-sm shadow-none bg-destructive text-destructive-foreground hover:bg-destructive/90 font-black uppercase tracking-wider text-xs px-5 m-0"
            >
              {isDeleting ? "MEMPROSES..." : "YA, NONAKTIFKAN"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
