"use client";

import { useState } from "react";
import { Save, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useStorageToast } from "@/hooks/use-storage-toast";
import {
  saveCertificateFieldConfig,
  type CertificateTemplateInfo,
} from "../../actions/certificate-template-actions";
import type { TextField } from "@/lib/pdf-certificate";

const FIELD_LABELS: Record<string, string> = {
  nama_peserta: "Nama Peserta",
  nomor_sertifikat: "Nomor Sertifikat",
  nik: "NIK",
  institusi: "Institusi",
  program: "Program",
  bidang: "Bidang",
  tanggal_mulai: "Tanggal Mulai",
  tanggal_selesai: "Tanggal Selesai",
  nama_pembimbing: "Nama Pembimbing",
  nip_pembimbing: "NIP Pembimbing",
  tanggal_sertifikat: "Tanggal Sertifikat",
};

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "LibreBaskerville", label: "Libre Baskerville" },
];

const ALIGN_OPTIONS = [
  { value: "left", label: "Kiri" },
  { value: "center", label: "Tengah" },
  { value: "right", label: "Kanan" },
];

type Props = {
  template: CertificateTemplateInfo;
  onComplete: () => void;
};

export default function FieldConfigurator({ template, onComplete }: Props) {
  const [fields, setFields] = useState<TextField[]>(template.variables);
  const [saving, setSaving] = useState(false);
  const { execute } = useStorageToast();

  const updateField = (index: number, key: keyof TextField, value: string | number) => {
    setFields((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await execute(
      () => saveCertificateFieldConfig(template.id, fields),
      {
        loading: "Menyimpan konfigurasi...",
        success: "Konfigurasi berhasil disimpan",
        onSuccess: () => onComplete(),
      },
    );
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings2 className="size-4" />
            Konfigurasi Posisi Field
          </h3>
          <p className="text-sm text-muted-foreground">
            Atur posisi (X, Y), ukuran font, dan alignment untuk setiap field pada template &ldquo;{template.name}&rdquo;
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="size-4" />
          {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
        </Button>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground p-4">
        <p className="text-xs text-muted-foreground mb-2">
          <strong>Koordinat:</strong> X = jarak dari kiri (pt), Y = jarak dari atas (pt). A4 Landscape = 842 x 595 pt.
        </p>
        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2 pb-2 border-b">
          <div className="col-span-2">Field</div>
          <div className="col-span-1">X</div>
          <div className="col-span-1">Y</div>
          <div className="col-span-1">Size</div>
          <div className="col-span-2">Font</div>
          <div className="col-span-2">Align</div>
          <div className="col-span-3">Preview</div>
        </div>

        {fields.map((field, i) => (
          <div
            key={field.name}
            className="grid grid-cols-12 gap-2 items-center py-2.5 px-2 border-b last:border-0 hover:bg-muted/30 transition-colors"
          >
            <div className="col-span-2">
              <Label className="text-xs font-medium">
                {FIELD_LABELS[field.name] ?? field.name}
              </Label>
              <p className="text-[10px] text-muted-foreground font-mono">
                {`{${field.name}}`}
              </p>
            </div>

            <div className="col-span-1">
              <Input
                type="number"
                value={field.x}
                onChange={(e) => updateField(i, "x", Number(e.target.value))}
                className="h-8 text-xs"
                min={0}
                max={842}
              />
            </div>

            <div className="col-span-1">
              <Input
                type="number"
                value={field.y}
                onChange={(e) => updateField(i, "y", Number(e.target.value))}
                className="h-8 text-xs"
                min={0}
                max={595}
              />
            </div>

            <div className="col-span-1">
              <Input
                type="number"
                value={field.size}
                onChange={(e) => updateField(i, "size", Number(e.target.value))}
                className="h-8 text-xs"
                min={6}
                max={72}
              />
            </div>

            <div className="col-span-2">
              <Select
                value={field.font ?? "Inter"}
                onValueChange={(v) => { if (v) updateField(i, "font", v); }}
                items={FONT_OPTIONS}
              >
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {FONT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Select
                value={field.align ?? "left"}
                onValueChange={(v) => { if (v) updateField(i, "align", v as "left" | "center" | "right"); }}
                items={ALIGN_OPTIONS}
              >
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {ALIGN_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-3 text-xs text-muted-foreground truncate font-mono">
              ({field.x}, {field.y}) {field.size}px {field.align}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2" size="lg">
          <Save className="size-4" />
          {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
        </Button>
      </div>
    </div>
  );
}
