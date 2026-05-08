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
    <div className="space-y-5 max-w-7xl">
      {/* Header Halaman */}
      <div className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1">
            Mapping
          </p>
          <h1 className="text-base font-semibold text-foreground">
            Mapping Dosen Pembimbing
          </h1>
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
          size="sm"
          className="h-8 px-4 rounded text-xs shadow-none shrink-0"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Tambah Mapping
        </Button>
      </div>

      {/* Area Pencarian Utama */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cari berdasarkan nama mahasiswa, NIM, atau nama dosen..."
          className="pl-10 h-10 border border-border shadow-sm rounded-md bg-card text-sm focus-visible:ring-primary/50"
          value={searchMapping}
          onChange={(e) => setSearchMapping(e.target.value)}
        />
      </div>

      {filteredMappings.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title={searchMapping ? "Data tidak ditemukan" : "Belum ada mapping"}
          description={
            searchMapping
              ? "Tidak ada hasil yang sesuai dengan kata kunci pencarian Anda."
              : "Silakan tambah pemetaan (mapping) mahasiswa ke dosen pembimbing baru."
          }
        />
      ) : (
        <div className="space-y-4">
          {currentMappings.map((m) => (
            <div
              key={m.id}
              className="bg-card rounded-md shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden"
            >
              <div className="flex flex-col lg:flex-row lg:items-stretch">
                {/* Konten Utama Kiri */}
                <div className="flex-1 p-5 border-b lg:border-b-0 lg:border-r border-border/50">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 lg:gap-12">
                    {/* Entitas Mahasiswa */}
                    <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                      <div className="w-10 h-10 rounded bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {m.student_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {m.student_nim || m.student_email}
                        </p>
                      </div>
                    </div>

                    {/* Panah Indikator (Relasi) */}
                    <ArrowRight className="hidden sm:block w-4 h-4 text-muted-foreground shrink-0" />

                    {/* Entitas Dosen */}
                    <div className="flex items-center gap-3 flex-1 min-w-0 w-full mt-2 sm:mt-0 pt-4 sm:pt-0 border-t border-dashed border-border sm:border-0">
                      <div className="w-10 h-10 rounded bg-accent text-accent-foreground flex items-center justify-center shrink-0">
                        <BookType className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {m.supervisor_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {m.supervisor_email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Judul Skripsi / Topik */}
                  <div className="mt-5 pt-4 border-t border-border/50">
                    <div className="flex items-start gap-2">
                      <BookType className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-0.5">
                          Topik / Judul Tugas Akhir
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {m.thesis_title ? m.thesis_title : <span className="text-muted-foreground italic">Belum ada judul</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Aksi Kanan */}
                <div className="p-5 lg:w-32 flex flex-row lg:flex-col items-center justify-center gap-2 shrink-0 bg-muted/10">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-full rounded text-xs shadow-none border-border/60 hover:bg-background"
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
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-full rounded text-xs shadow-none border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setDeleteTarget(m)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Hapus
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Selanjutnya
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog Form Mapping */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-md border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:max-w-md p-0 overflow-hidden bg-card">
          <DialogHeader className="px-5 py-4 border-b border-border/50">
            <DialogTitle className="text-sm font-semibold text-foreground">
              {editId ? "Edit Mapping" : "Tambah Mapping Baru"}
            </DialogTitle>
          </DialogHeader>

          <div className="px-5 py-4 space-y-4">
            {/* SEARCHABLE MAHASISWA */}
            <div className="space-y-1.5 flex flex-col">
              <Label className="text-xs font-medium text-foreground">
                Mahasiswa <span className="text-primary">*</span>
              </Label>
              <Popover
                open={openStudentSelect}
                onOpenChange={setOpenStudentSelect}
              >
                <PopoverTrigger asChild disabled={!!editId}>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="justify-between rounded border-border/60 shadow-none h-9 text-sm"
                  >
                    {form.student_email
                      ? students.find((s) => s.email === form.student_email)
                          ?.full_name
                      : "Pilih mahasiswa..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[400px] p-0 rounded-md border border-border shadow-md"
                  align="start"
                >
                  <Command>
                    <CommandInput
                      placeholder="Cari mahasiswa..."
                      className="text-sm"
                    />
                    <CommandList>
                      <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
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
                            className="text-sm"
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
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({s.nim || "Tanpa NIM"})
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
            <div className="space-y-1.5 flex flex-col">
              <Label className="text-xs font-medium text-foreground">
                Dosen Pembimbing <span className="text-primary">*</span>
              </Label>
              <Popover open={openDosenSelect} onOpenChange={setOpenDosenSelect}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="justify-between rounded border-border/60 shadow-none h-9 text-sm"
                  >
                    {form.supervisor_email
                      ? dosens.find((d) => d.email === form.supervisor_email)
                          ?.full_name
                      : "Pilih dosen pembimbing..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[400px] p-0 rounded-md border border-border shadow-md"
                  align="start"
                >
                  <Command>
                    <CommandInput
                      placeholder="Cari dosen..."
                      className="text-sm"
                    />
                    <CommandList>
                      <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
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
                            className="text-sm"
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
              <Label className="text-xs font-medium text-foreground mb-1.5 block">
                Judul Skripsi (Opsional)
              </Label>
              <Input
                value={form.thesis_title}
                onChange={(e) =>
                  setForm({ ...form, thesis_title: e.target.value })
                }
                placeholder="Masukkan judul tugas akhir..."
                className="mt-1.5 rounded border-border/60 focus-visible:ring-primary shadow-none h-9 text-sm"
              />
            </div>
          </div>

          <DialogFooter className="px-5 py-3.5 border-t border-border/50 bg-muted/20 flex flex-row justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded text-xs"
              onClick={() => setShowDialog(false)}
            >
              Batal
            </Button>
            <Button
              size="sm"
              className="rounded text-xs"
              onClick={handleSave}
              disabled={
                !form.student_email || !form.supervisor_email || isSubmitting
              }
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Delete */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-md border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:max-w-md p-0 overflow-hidden bg-card">
          <AlertDialogHeader className="px-5 py-4 border-b border-border/50">
            <AlertDialogTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-destructive" />
              Nonaktifkan Mapping
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm mt-1">
              Pemetaan akademik antara mahasiswa{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.student_name}
              </span>{" "}
              dan dosen{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.supervisor_name}
              </span>{" "}
              akan dinonaktifkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="px-5 py-3.5 border-t border-border/50 bg-muted/20 flex flex-row justify-end gap-2">
            <AlertDialogCancel className="rounded text-xs mt-0">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Menonaktifkan..." : "Ya, Nonaktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
