"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  SaveIcon,
  SendHorizontalIcon,
  ClockIcon,
  CalendarClock,
  University,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  createOrUpdateAssessment,
  submitAssessment,
} from "../actions/assessment-form-actions";

import type { ComponentFormValue } from "../types/assessment-form-types";
import type { AssessmentFormData } from "../types/assessment-form-types";
import type { AssessmentStatus } from "../types/assessment-form-types";

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

const STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  draft: { label: "Draft", variant: "outline" },
  submitted: { label: "Submitted", variant: "secondary" },
  finalized: { label: "Finalized", variant: "default" },
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

interface AssessmentFormProps {
  data: AssessmentFormData;
}

function ComponentRow({
  component,
  index,
  onChange,
  disabled,
}: {
  component: ComponentFormValue;
  index: number;
  onChange: (
    index: number,
    field: keyof ComponentFormValue,
    value: unknown,
  ) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`space-y-2 rounded-none border p-4 ${disabled ? "opacity-60" : ""}`}
    >
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{component.name}</Label>
        <span className="text-xs text-muted-foreground">
          {component.weight}%
        </span>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          value={component.score ?? 0}
          onChange={(e) => onChange(index, "score", Number(e.target.value))}
          disabled={disabled}
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%) 0% 0% / ${component.score ?? 0}% 100% no-repeat #e5e7eb`,
          }}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-none [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Input
          type="number"
          min={0}
          max={100}
          value={component.score ?? ""}
          onChange={(e) => {
            const v = e.target.value === "" ? null : Number(e.target.value);
            onChange(index, "score", v);
          }}
          disabled={disabled}
          className="w-16 text-center shrink-0"
        />
      </div>

      <Textarea
        placeholder="Catatan (opsional)"
        maxLength={500}
        rows={2}
        value={component.notes}
        onChange={(e) => onChange(index, "notes", e.target.value)}
        disabled={disabled}
        className="text-xs resize-none"
      />
      <p className="text-xs text-right text-muted-foreground">
        {component.notes.length}/500
      </p>
    </div>
  );
}

export default function AssessmentForm({ data }: AssessmentFormProps) {
  const router = useRouter();
  const [components, setComponents] = useState<ComponentFormValue[]>(
    data.components,
  );
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const isReadOnly = data.status !== null && data.status !== "draft";

  const handleChange = useCallback(
    (index: number, field: keyof ComponentFormValue, value: unknown) => {
      if (isReadOnly) return;
      setComponents((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    [isReadOnly],
  );

  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  const totalScore =
    totalWeight > 0
      ? components.reduce((sum, c) => sum + (c.score ?? 0) * c.weight, 0) /
        totalWeight
      : 0;

  const allFilled = components.every((c) => c.score !== null);

  async function handleSaveDraft() {
    const promise = createOrUpdateAssessment({
      internProfileId: data.internProfileId,
      components: components.map((c) => ({
        name: c.name,
        weight: c.weight,
        score: c.score,
        notes: c.notes,
      })),
    });

    toast.promise(promise, {
      loading: "Menyimpan draft...",
      success: "Draft tersimpan",
      error: (err) =>
        err instanceof Error ? err.message : "Gagal menyimpan draft",
    });

    const res = await promise;
    if (res.success) router.refresh();
  }

  async function handleSubmitClick() {
    if (!allFilled) {
      toast.error("Semua komponen wajib diisi sebelum submit");
      return;
    }
    setShowSubmitDialog(true);
  }

  async function handleConfirmSubmit() {
    setShowSubmitDialog(false);

    const saved = await createOrUpdateAssessment({
      internProfileId: data.internProfileId,
      components: components.map((c) => ({
        name: c.name,
        weight: c.weight,
        score: c.score!,
        notes: c.notes,
      })),
    });

    if (!saved.success) {
      toast.error(saved.error ?? "Gagal menyimpan penilaian");
      return;
    }

    const promise = submitAssessment(saved.data!.assessmentId);

    toast.promise(promise, {
      loading: "Mensubmit nilai...",
      success: "Nilai berhasil disubmit",
      error: (err) =>
        err instanceof Error ? err.message : "Gagal submit nilai",
    });

    const res = await promise;
    if (res.success) router.push("/supervisor/penilaian");
  }

  return (
    <div className="space-y-4">
      <Button
        variant="link"
        onClick={() => router.back()}
        className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Kembali
      </Button>

      {/* Card Header */}
      <div className="flex items-center justify-between p-4 border rounded-none bg-card">
        <div className="flex items-center gap-3">
          <Avatar className="rounded-none size-10">
            <AvatarImage
              src={data.avatarUrl ?? undefined}
              alt={data.internName}
            />
            <AvatarFallback className="rounded-none">
              {getInitials(data.internName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold leading-tight">
              {data.internName}
            </h2>
            <div className="flex items-center gap-1">
              <University className="size-3" />
              <p className="text-sm text-muted-foreground">
                {data.institution}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <CalendarClock className="size-3" />
              <p className="text-xs text-muted-foreground">
                {formatDate(data.periodStart)} — {formatDate(data.periodEnd)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          {data.status ? (
            <Badge
              variant={STATUS_MAP[data.status]?.variant ?? "outline"}
              className="text-xs rounded-none"
            >
              {STATUS_MAP[data.status]?.label ?? data.status}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs rounded-none">
              Belum Dinilai
            </Badge>
          )}
          {data.lastModified && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ClockIcon className="size-3" />
              {formatDateTime(data.lastModified)}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
              Komponen Penilaian
            </h3>

            {components.map((comp, i) => (
              <ComponentRow
                key={comp.name}
                component={comp}
                index={i}
                onChange={handleChange}
                disabled={isReadOnly}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 border rounded-none bg-card">
            <h3 className="mb-3 text-sm font-semibold tracking-wider uppercase text-muted-foreground">
              Ringkasan
            </h3>

            <dl className="space-y-2 text-sm">
              {components.map((comp) => (
                <div
                  key={comp.name}
                  className="flex items-center justify-between"
                >
                  <dt className="pr-2 truncate text-muted-foreground">
                    {comp.name}
                  </dt>
                  <dd className="font-medium tabular-nums">
                    {comp.score !== null ? (
                      comp.score
                    ) : (
                      <span className="text-muted-foreground">&mdash;</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <hr className="my-3" />

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Nilai Akhir</span>
              <span className="text-2xl font-bold tabular-nums">
                {Math.round(totalScore * 10) / 10}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / 100
                </span>
              </span>
            </div>
          </div>

          {!isReadOnly && (
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleSaveDraft}
                variant="outline"
                className="w-full gap-2"
              >
                <SaveIcon className="size-4" />
                Simpan Draft
              </Button>
              <Button
                onClick={handleSubmitClick}
                disabled={!allFilled}
                className="w-full gap-2"
              >
                <SendHorizontalIcon className="size-4" />
                Submit Nilai
              </Button>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <AlertTriangleIcon className="text-amber-500" />
            </AlertDialogMedia>
            <AlertDialogTitle>Submit Penilaian</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin submit? Nilai tidak bisa diubah setelah
              disubmit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit}>
              Ya, Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
