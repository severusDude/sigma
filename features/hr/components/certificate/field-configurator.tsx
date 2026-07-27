"use client";

import { useState, useRef, useEffect } from "react";
import { Save, Settings2, Move, Type, AlignLeft } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
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

const FIELD_COLORS = [
  "border-red-500 bg-red-500/10 text-red-600",
  "border-blue-500 bg-blue-500/10 text-blue-600",
  "border-green-500 bg-green-500/10 text-green-600",
  "border-orange-500 bg-orange-500/10 text-orange-600",
  "border-purple-500 bg-purple-500/10 text-purple-600",
  "border-pink-500 bg-pink-500/10 text-pink-600",
  "border-teal-500 bg-teal-500/10 text-teal-600",
  "border-amber-500 bg-amber-500/10 text-amber-600",
  "border-indigo-500 bg-indigo-500/10 text-indigo-600",
  "border-cyan-500 bg-cyan-500/10 text-cyan-600",
  "border-rose-500 bg-rose-500/10 text-rose-600",
];

const CANVAS_W = 842;
const CANVAS_H = 595;

const BOX_W_RATIO = 9;

type Props = {
  template: CertificateTemplateInfo;
  onComplete: () => void;
};

export default function FieldConfigurator({ template, onComplete }: Props) {
  const [fields, setFields] = useState<TextField[]>(template.variables);
  const [saving, setSaving] = useState(false);
  const [scale, setScale] = useState(0.75);
  const previewRef = useRef<HTMLDivElement>(null);
  const { execute } = useStorageToast();

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
        setScale(w > 0 ? w / CANVAS_W : 0.75);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const updateField = (index: number, key: keyof TextField, value: string | number) => {
    setFields((prev) => {
      const next = [...prev];
      (next[index] as Record<string, unknown>)[key] = value;
      return next;
    });
  };

  const updateColor = (index: number, hex: string) => {
    const clean = hex.replace("#", "");
    setFields((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        color: {
          r: Number.parseInt(clean.slice(0, 2), 16) / 255,
          g: Number.parseInt(clean.slice(2, 4), 16) / 255,
          b: Number.parseInt(clean.slice(4, 6), 16) / 255,
        },
      };
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings2 className="size-4" />
            Konfigurasi Posisi Field
          </h3>
          <p className="text-sm text-muted-foreground">
            Atur posisi field pada template &ldquo;{template.name}&rdquo;
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="size-4" />
          {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* ── Left: Form Fields ── */}
        <Card className="h-[75vh] flex flex-col">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlignLeft className="size-4" />
              Posisi Field
            </CardTitle>
            <CardDescription>
              Canvas: {CANVAS_W} &times; {CANVAS_H} pt. X = kiri, Y = atas.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full px-6 pb-4">
              <div className="space-y-3">
                {fields.map((field, i) => {
                  const isCenter = field.align === "center";
                  const isRight = field.align === "right";
                  return (
                    <div
                      key={field.name}
                      className="rounded-lg border p-3 space-y-2 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`size-3 rounded-full ${FIELD_COLORS[i % FIELD_COLORS.length].split(" ")[1]}`}
                        />
                        <span className="text-sm font-medium">
                          {FIELD_LABELS[field.name] ?? field.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                          {`{${field.name}}`}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Move className="size-3" /> X
                          </Label>
                          <Input
                            type="number"
                            value={field.x}
                            onChange={(e) => updateField(i, "x", Number(e.target.value))}
                            className="h-7 text-xs"
                            min={0}
                            max={CANVAS_W}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Move className="size-3 rotate-90" /> Y
                          </Label>
                          <Input
                            type="number"
                            value={field.y}
                            onChange={(e) => updateField(i, "y", Number(e.target.value))}
                            className="h-7 text-xs"
                            min={0}
                            max={CANVAS_H}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Type className="size-3" /> Size
                          </Label>
                          <Input
                            type="number"
                            value={field.size}
                            onChange={(e) => updateField(i, "size", Number(e.target.value))}
                            className="h-7 text-xs"
                            min={6}
                            max={72}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Align</Label>
                          <Select
                            value={field.align ?? "left"}
                            onValueChange={(v) => {
                              if (v) updateField(i, "align", v as "left" | "center" | "right");
                            }}
                            items={ALIGN_OPTIONS}
                          >
                            <SelectTrigger className="h-7 text-xs w-full">
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
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Font</Label>
                          <Select
                            value={field.font ?? "Inter"}
                            onValueChange={(v) => {
                              if (v) updateField(i, "font", v);
                            }}
                            items={FONT_OPTIONS}
                          >
                            <SelectTrigger className="h-7 text-xs w-full">
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

                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Warna</Label>
                          <div className="flex items-center gap-2 h-7">
                            <input
                              type="color"
                              value={
                                field.color
                                  ? `#${Math.round(field.color.r * 255).toString(16).padStart(2, "0")}${Math.round(field.color.g * 255).toString(16).padStart(2, "0")}${Math.round(field.color.b * 255).toString(16).padStart(2, "0")}`
                                  : "#000000"
                              }
                              onChange={(e) => updateColor(i, e.target.value)}
                              className="size-7 rounded border cursor-pointer"
                            />
                            <span className="text-[10px] text-muted-foreground">
                              ({field.x}, {field.y}) {field.size}pt{" "}
                              {isCenter ? "tengah" : isRight ? "kanan" : "kiri"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* ── Right: PDF Preview with Overlay ── */}
        <Card className="h-[75vh] flex flex-col">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <Move className="size-4" />
              Live Preview
            </CardTitle>
            <CardDescription>
            Posisi field akan tampil di atas template. Seret nilai X/Y untuk menyesuaikan.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0 relative">
            <div ref={previewRef} className="relative w-full h-full">
              <embed
                src={`/api/templates/${template.id}/file`}
                type="application/pdf"
                className="w-full h-full rounded-none border-0"
              />
              {fields.map((field, i) => {
                const boxW = field.size * BOX_W_RATIO * scale;
                const boxH = field.size * 1.6 * scale;
                const left = field.x * scale;
                const top = field.y * scale;
                const colorClass = FIELD_COLORS[i % FIELD_COLORS.length];
                const isCenter = field.align === "center";
                const isRight = field.align === "right";
                const boxLeft = isCenter ? left - boxW / 2 : isRight ? left - boxW : left;

                return (
                  <div
                    key={field.name}
                    className={`absolute border-2 pointer-events-none ${colorClass.split(" ")[0]} ${colorClass.split(" ")[1]}`}
                    style={{
                      left: boxLeft,
                      top,
                      width: boxW,
                      height: boxH,
                      transition: "all 0.1s ease",
                    }}
                  >
                    <span
                      className={`absolute -top-4 left-0 text-[9px] leading-none px-1 py-0.5 rounded-t ${colorClass.split(" ")[2]} ${colorClass.split(" ")[1]}`}
                    >
                      {FIELD_LABELS[field.name] ?? field.name} ({field.size}pt)
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
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
