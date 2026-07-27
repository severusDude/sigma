"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Trash2, CheckCircle2, FileText, Info, Image } from "lucide-react";

import { useStorageToast } from "@/hooks/use-storage-toast";

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
import {
  deleteCertificateTemplate,
  listCertificateTemplates,
  type CertificateTemplateInfo,
} from "../actions/certificate-template-actions";
import { VARIABLE_INFO } from "../data/variable-info";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import CertificateUpload from "../components/certificate/certificate-upload";
import FieldConfigurator from "../components/certificate/field-configurator";

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
  const [selectedType, setSelectedType] = useState("");
  const [uploadPending, setUploadPending] = useState(false);
  const { execute } = useStorageToast();
  const formRef = useRef<HTMLFormElement>(null);

  const [certTemplates, setCertTemplates] = useState<CertificateTemplateInfo[]>([]);
  const [showCertUpload, setShowCertUpload] = useState(false);
  const [certConfigTarget, setCertConfigTarget] = useState<CertificateTemplateInfo | null>(null);

  const loadCertTemplates = async () => {
    const result = await listCertificateTemplates();
    if (result.success && result.data) {
      setCertTemplates(result.data);
    }
  };

  useEffect(() => {
    loadCertTemplates();
  }, []);

  const handleDelete = async (id: string) => {
    await execute(
      () => deleteTemplate(id),
      {
        loading: "Menghapus template...",
        success: "Template berhasil dihapus",
        onSuccess: () => {
          setTemplates((prev) => prev.filter((t) => t.id !== id));
        },
      },
    );
  };

  const handleSetActive = async (id: string) => {
    await execute(
      () => setActiveTemplate(id),
      {
        loading: "Mengaktifkan template...",
        success: "Template aktif telah diubah",
        onSuccess: () => {
          setTemplates((prev) =>
            prev.map((t) => ({
              ...t,
              isActive: t.id === id,
            })),
          );
        },
      },
    );
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setUploadPending(true);
    await execute(
      () => uploadTemplate(null, formData),
      {
        loading: "Mengupload template...",
        success: "Template berhasil diunggah",
        onSuccess: (data) => {
          formRef.current?.reset();
          setTemplates((prev) => [data, ...prev]);
        },
      },
    );
    setUploadPending(false);
  };

  const handleCertUploadComplete = (template: CertificateTemplateInfo) => {
    setShowCertUpload(false);
    setCertConfigTarget(template);
  };

  const handleCertConfigComplete = () => {
    setCertConfigTarget(null);
    loadCertTemplates();
  };

  const handleDeleteCert = async (id: string) => {
    await execute(
      () => deleteCertificateTemplate(id),
      {
        loading: "Menghapus template...",
        success: "Template berhasil dihapus",
        onSuccess: () => {
          setCertTemplates((prev) => prev.filter((t) => t.id !== id));
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Kelola Template Dokumen
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload dan kelola template untuk dokumen HR
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
          <form ref={formRef} onSubmit={handleUpload} className="space-y-4">
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
                <Select
                  name="documentType"
                  onValueChange={(v) => { if (v) setSelectedType(v as string); }}
                  required
                  items={DOCUMENT_TYPE_OPTIONS}
                >
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

            {selectedType && VARIABLE_INFO[selectedType] && (
              <Alert>
                <Info className="size-4 mt-0.5" />
                <AlertTitle>Placeholder yang tersedia</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">
                    Template {DOCUMENT_TYPE_LABELS[selectedType]?.toLowerCase() ?? selectedType} mendukung placeholder berikut:
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {VARIABLE_INFO[selectedType].map((v) => (
                      <div key={v.name} className="flex items-baseline gap-1.5">
                        <code className="text-[11px] font-mono font-medium text-foreground whitespace-nowrap">
                          {"{" + v.name + "}"}
                        </code>
                        <span className="text-[11px] text-muted-foreground">
                          {v.isLoop ? "Looping: " : ""}{v.description}
                        </span>
                      </div>
                    ))}
                  </div>
                  {VARIABLE_INFO[selectedType].some((v) => v.isLoop) && (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Untuk looping, gunakan <code>{`{#nama_var}`}</code> ... <code>{`{/nama_var}`}</code> di template
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}

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
            <Button type="submit" disabled={uploadPending} className="gap-2">
              <Upload className="size-4" />
              {uploadPending ? "Mengupload..." : "Upload Template"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Template Sertifikat</CardTitle>
              <CardDescription>
                Upload desain sertifikat dari Canva (export PDF), lalu atur posisi setiap field teks
              </CardDescription>
            </div>
            {!showCertUpload && !certConfigTarget && (
              <Button variant="outline" onClick={() => setShowCertUpload(true)} className="gap-2">
                <Image className="size-4" />
                Upload Template Sertifikat
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {certConfigTarget ? (
            <FieldConfigurator
              template={certConfigTarget}
              onComplete={handleCertConfigComplete}
            />
          ) : showCertUpload ? (
            <div className="space-y-4">
              <CertificateUpload onUploadComplete={handleCertUploadComplete} />
              <Button variant="ghost" size="sm" onClick={() => setShowCertUpload(false)}>
                Batal
              </Button>
            </div>
          ) : certTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Belum ada template sertifikat. Klik &ldquo;Upload Template Sertifikat&rdquo; untuk memulai.
            </p>
          ) : (
            <div className="space-y-3">
              {certTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <Image className="size-5 mt-0.5 text-muted-foreground" />
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
                        Sertifikat
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {template.variables.length} field teks
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!template.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCertConfigTarget(template);
                        }}
                        className="gap-1"
                      >
                        <CheckCircle2 className="size-3" />
                      Atur Posisi
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCert(template.id)}
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
