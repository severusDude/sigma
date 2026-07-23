"use client";

import { useState, useActionState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Upload, Trash2, CheckCircle2, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  uploadTemplate,
  deleteTemplate,
  setActiveTemplate,
  type TemplateRow,
} from "../actions/template-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  certificate: "Sertifikat",
  assignment_letter: "Surat Tugas",
  assessment_report: "Laporan Penilaian",
  attendance_report: "Rekap Absensi",
  completion_letter: "Surat Keterangan Selesai",
};

const DOCUMENT_TYPE_OPTIONS = Object.entries(DOCUMENT_TYPE_LABELS)
  .filter(([key]) => key !== "certificate")
  .map(([value, label]) => ({ value, label }));

export default function TemplatePage({
  initialTemplates,
}: {
  initialTemplates: TemplateRow[];
}) {
  const [templates, setTemplates] = useState<TemplateRow[]>(initialTemplates);
  const [state, formAction, pending] = useActionState(uploadTemplate, null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (state?.success && state.data) {
      toast.success("Template berhasil diunggah");
      startTransition(() => {
        setTemplates((prev) => [state.data!, ...prev]);
      });
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, startTransition]);

  const handleDelete = async (id: string) => {
    const result = await deleteTemplate(id);
    if (result.success) {
      toast.success("Template berhasil dihapus");
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } else {
      toast.error(result.error || "Gagal menghapus template");
    }
  };

  const handleSetActive = async (id: string) => {
    const result = await setActiveTemplate(id);
    if (result.success) {
      toast.success("Template aktif telah diubah");
      setTemplates((prev) =>
        prev.map((t) => ({
          ...t,
          isActive: t.id === id,
        })),
      );
    } else {
      toast.error(result.error || "Gagal mengaktifkan template");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Kelola Template Dokumen
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload dan kelola template .docx untuk dokumen HR
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Template Baru</CardTitle>
          <CardDescription>
            File .docx dengan placeholder Docxtemplater (contoh: {"{nama}"},{" "}
            {"{nik}"})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nama Template</Label>
                <Input
                  name="name"
                  placeholder="Surat Tugas Magang v2"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="space-y-2 ">
                <Label className="text-sm font-medium">Tipe Dokumen</Label>
                <Select name="documentType" required items={DOCUMENT_TYPE_OPTIONS}>
                  <SelectTrigger className={'w-full'}>
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">File Template (.docx)</Label>
              <Input
                type="file"
                name="file"
                accept=".docx"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
                required
              />
            </div>
            <Button type="submit" disabled={pending} className="gap-2">
              <Upload className="size-4" />
              {pending ? "Mengupload..." : "Upload Template"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Template</CardTitle>
          <CardDescription>
            Template yang aktif akan digunakan saat generate dokumen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Belum ada template. Upload template .docx untuk memulai.
            </p>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="size-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{template.name}</span>
                        {template.isActive ? (
                          <Badge className="bg-green-600">Aktif</Badge>
                        ) : (
                          <Badge variant="secondary">Tidak Aktif</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {DOCUMENT_TYPE_LABELS[template.documentType] ??
                          template.documentType}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {template.variables.length} placeholder tersedia
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!template.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetActive(template.id)}
                        className="gap-1"
                      >
                        <CheckCircle2 className="size-3" />
                        Aktifkan
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      className="text-destructive gap-1"
                    >
                      <Trash2 className="size-3" />
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
