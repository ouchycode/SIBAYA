import React, { useState, useMemo } from "react";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEntityList } from "@/lib/hooks/useEntityList";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

export default function MappingPage() {
  const queryClient = useQueryClient();
  const { data: mappings = [] } = useEntityList("Mapping");
  const { data: users = [] } = useEntityList("User");

  // State Utama
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchMapping, setSearchMapping] = useState("");

  // State Form
  const [form, setForm] = useState({
    student_email: "",
    supervisor_email: "",
    thesis_title: "",
  });

  // State Popover (Combobox)
  const [openStudentSelect, setOpenStudentSelect] = useState(false);
  const [openDosenSelect, setOpenDosenSelect] = useState(false);

  // State Hapus
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Filter Data User
  const students = users.filter(
    (u) => u.role === "mahasiswa" && (u.status === "active" || !u.status),
  );
  const dosens = users.filter((u) => u.role === "dosen");

  // Filter Mapping berdasarkan Search Box
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

  const handleSave = async () => {
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
        await base44.entities.Mapping.update(editId, payload);
        toast.success("Data mapping diperbarui");
      } else {
        await base44.entities.Mapping.create(payload);
        toast.success("Mapping berhasil ditambahkan");
      }
      queryClient.invalidateQueries({ queryKey: ["Mapping"] });
      setShowDialog(false);
    } catch (error) {
      toast.error("Gagal menyimpan mapping.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await base44.entities.Mapping.update(deleteTarget.id, {
        status: "inactive",
      });
      queryClient.invalidateQueries({ queryKey: ["Mapping"] });
      toast.success("Mapping dinonaktifkan");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search Bar Utama */}
      <div className="bg-card border border-border p-5 rounded-md shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Mapping Dosen Pembimbing
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Kelola alokasi mahasiswa kepada dosen pembimbing.
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
            className="gap-2 font-bold shadow-none rounded-sm"
          >
            <Plus className="w-4 h-4" /> Tambah Mapping
          </Button>
        </div>

        {/* Input Cari Mapping yang sudah ada */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari berdasarkan Nama Mahasiswa, NIM, atau Nama Dosen..."
            className="pl-10 h-11 border-border shadow-none rounded-sm bg-muted/20"
            value={searchMapping}
            onChange={(e) => setSearchMapping(e.target.value)}
          />
        </div>
      </div>

      {filteredMappings.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="Data Tidak Ditemukan"
          description="Silakan tambah mapping baru atau ubah kata kunci pencarian Anda."
        />
      ) : (
        <div className="space-y-3">
          {filteredMappings.map((m) => (
            <Card
              key={m.id}
              className="rounded-md border border-border shadow-none bg-card hover:border-primary/40 transition-colors"
            >
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row lg:items-stretch">
                  <div className="flex-1 p-5 border-b lg:border-b-0 lg:border-r border-border">
                    <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-12">
                      {/* Mahasiswa */}
                      <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                        <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-black text-primary">
                            MHS
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">
                            {m.student_name}
                          </p>
                          <p className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
                            {m.student_nim || m.student_email}
                          </p>
                        </div>
                      </div>

                      <ArrowRight className="hidden sm:block w-5 h-5 text-muted-foreground/20" />

                      {/* Dosen */}
                      <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                        <div className="w-10 h-10 rounded-sm bg-accent text-accent-foreground border border-accent/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-black">DSN</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">
                            {m.supervisor_name}
                          </p>
                          <p className="text-[11px] font-medium text-muted-foreground truncate italic">
                            {m.supervisor_email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Judul Skripsi */}
                    <div className="mt-4 pt-3 border-t border-dashed border-border">
                      <div className="flex items-start gap-2.5">
                        <BookType className="w-4 h-4 text-primary mt-1" />
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            Judul Tugas Akhir
                          </p>
                          <p className="text-sm font-bold text-foreground leading-snug">
                            {m.thesis_title || "Judul belum diinput"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Aksi */}
                  <div className="bg-muted/10 p-3 lg:w-16 flex lg:flex-col items-center justify-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 hover:bg-primary/10 hover:text-primary"
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
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeleteTarget(m)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Form Mapping dengan Combobox (Searchable Select) */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-md border-border sm:max-w-md">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="font-bold text-lg">
              {editId ? "Edit Mapping" : "Tambah Mapping Baru"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* SEARCHABLE MAHASISWA */}
            <div className="space-y-2 flex flex-col">
              <Label className="font-bold">Mahasiswa (Ketik Nama/NIM)</Label>
              <Popover
                open={openStudentSelect}
                onOpenChange={setOpenStudentSelect}
              >
                <PopoverTrigger asChild disabled={!!editId}>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="justify-between rounded-sm border-border font-medium shadow-none h-10"
                  >
                    {form.student_email
                      ? students.find((s) => s.email === form.student_email)
                          ?.full_name
                      : "Cari mahasiswa..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Ketik nama atau NIM mahasiswa..." />
                    <CommandList>
                      <CommandEmpty>Mahasiswa tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {students.map((s) => (
                          <CommandItem
                            key={s.id}
                            value={`${s.full_name} ${s.nim}`}
                            onSelect={() => {
                              setForm({ ...form, student_email: s.email });
                              setOpenStudentSelect(false);
                            }}
                            className="text-sm font-medium"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                form.student_email === s.email
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {s.full_name}{" "}
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({s.nim || "No NIM"})
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
              <Label className="font-bold">Dosen Pembimbing</Label>
              <Popover open={openDosenSelect} onOpenChange={setOpenDosenSelect}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="justify-between rounded-sm border-border font-medium shadow-none h-10"
                  >
                    {form.supervisor_email
                      ? dosens.find((d) => d.email === form.supervisor_email)
                          ?.full_name
                      : "Cari dosen..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Ketik nama dosen..." />
                    <CommandList>
                      <CommandEmpty>Dosen tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {dosens.map((d) => (
                          <CommandItem
                            key={d.id}
                            value={d.full_name}
                            onSelect={() => {
                              setForm({ ...form, supervisor_email: d.email });
                              setOpenDosenSelect(false);
                            }}
                            className="text-sm font-medium"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
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
              <Label className="font-bold">Judul Skripsi / Tugas Akhir</Label>
              <Input
                value={form.thesis_title}
                onChange={(e) =>
                  setForm({ ...form, thesis_title: e.target.value })
                }
                placeholder="Masukkan judul jika sudah ada..."
                className="mt-1.5 rounded-sm border-border shadow-none h-10"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-4 mt-2">
            <Button
              variant="outline"
              className="rounded-sm font-bold shadow-none"
              onClick={() => setShowDialog(false)}
            >
              Batal
            </Button>
            <Button
              className="rounded-sm font-bold shadow-none"
              onClick={handleSave}
              disabled={!form.student_email || !form.supervisor_email}
            >
              {editId ? "Simpan Perubahan" : "Simpan Mapping"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Delete */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-destructive">
              Nonaktifkan Mapping?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground">
              Mapping antara{" "}
              <span className="font-bold">{deleteTarget?.student_name}</span>{" "}
              dan{" "}
              <span className="font-bold">{deleteTarget?.supervisor_name}</span>{" "}
              akan dinonaktifkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold rounded-sm">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 font-bold rounded-sm"
            >
              Nonaktifkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
