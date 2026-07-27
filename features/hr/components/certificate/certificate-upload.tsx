"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStorageToast } from "@/hooks/use-storage-toast";
import {
  uploadCertificateTemplate,
  type CertificateTemplateInfo,
} from "../../actions/certificate-template-actions";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

type Props = {
  onUploadComplete: (template: CertificateTemplateInfo) => void;
};

export default function CertificateUpload({ onUploadComplete }: Props) {
  const [uploadPending, setUploadPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { execute } = useStorageToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setUploadPending(true);
    await execute(
      () => uploadCertificateTemplate(null, formData),
      {
        loading: "Mengupload template sertifikat...",
        success: "Template berhasil diunggah",
        onSuccess: (data) => {
          formRef.current?.reset();
          onUploadComplete(data);
        },
      },
    );
    setUploadPending(false);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <Alert>
        <Info className="size-4 mt-0.5" />
        <AlertTitle>Panduan Template Sertifikat</AlertTitle>
        <AlertDescription>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Desain sertifikat di Canva dengan area kosong untuk teks (nama, tanggal, dll)</li>
            <li>Export desain sebagai <strong>PDF</strong> dari Canva</li>
            <li>Upload PDF di sini, lalu atur posisi setiap field teks di langkah berikutnya</li>
          </ol>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Nama Template</Label>
          <Input
            name="name"
            placeholder="Sertifikat Magang BPS 2026"
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">File Template (.pdf)</Label>
          <Input
            type="file"
            name="file"
            accept=".pdf"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
            required
          />
          <p className="text-xs text-muted-foreground">
            Export dari Canva sebagai PDF. Pastikan area untuk teks dikosongkan.
          </p>
        </div>
      </div>

      <Button type="submit" disabled={uploadPending} className="gap-2">
        <Upload className="size-4" />
        {uploadPending ? "Mengupload..." : "Upload Template"}
      </Button>
    </form>
  );
}
