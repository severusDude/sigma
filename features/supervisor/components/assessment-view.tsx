"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  DownloadIcon,
  LockIcon,
  ShieldCheckIcon,
  FileCheckIcon,
  AlertTriangleIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import type { AssessmentViewData } from "../types/assessment-view-types";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function CircularGauge({
  score,
  size = 140,
}: {
  score: number;
  size?: number;
}) {
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  const color =
    score >= 81
      ? "#16a34a"
      : score >= 61
        ? "#2563eb"
        : score >= 41
          ? "#ca8a04"
          : score >= 21
            ? "#ea580c"
            : "#dc2626";

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
        className="transition-all duration-700"
      />
      <text
        x={center}
        y={center - 4}
        textAnchor="middle"
        className="text-2xl font-bold"
        fill="currentColor"
      >
        {score.toFixed(1)}
      </text>
      <text
        x={center}
        y={center + 12}
        textAnchor="middle"
        className="text-xs"
        fill="hsl(var(--muted-foreground))"
      >
        SKOR AKHIR
      </text>
    </svg>
  );
}

interface AssessmentViewProps {
  data: AssessmentViewData;
}

export default function AssessmentView({ data }: AssessmentViewProps) {
  const router = useRouter();

  const isFinalized = data.status === "finalized";
  const hasAssessment = data.assessmentId !== null;

  const computedScore =
    data.finalScore !== null
      ? data.finalScore
      : data.components.length > 0
        ? data.components.reduce(
            (sum, c) => sum + (c.score ?? 0) * c.weight,
            0,
          ) / data.components.reduce((sum, c) => sum + c.weight, 0)
        : null;

  return (
    <div className="space-y-2">
      <Button
        variant="link"
        onClick={() => router.push("/supervisor/penilaian")}
        className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Kembali
      </Button>

      {isFinalized && (
        <Alert variant={"destructive"}>
          <AlertTriangleIcon className="w-4 h-4" />
          <AlertTitle>Perhatian</AlertTitle>
          <AlertDescription>
            Penilaian ini sudah difinalisasi oleh HR/Admin dan tidak dapat
            diubah lagi{" "}
          </AlertDescription>
        </Alert>
      )}
      <div className="flex items-start gap-1.5">
        <div className="w-1/3">
          <div className="rounded-none border bg-card p-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <Avatar className="size-20 rounded-none">
                <AvatarImage
                  src={data.avatarUrl ?? undefined}
                  alt={data.internName}
                />
                <AvatarFallback className="rounded-none text-2xl">
                  {getInitials(data.internName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-bold">{data.internName}</h2>
                <p className="text-xs text-muted-foreground">
                  {data.institution}
                </p>
              </div>
            </div>

            <hr className="my-3" />

            {hasAssessment && computedScore !== null && (
              <div className="mb-3 flex gap-2">
                <div className="flex flex-1 flex-col items-center rounded-none border bg-primary/5 p-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Nilai Akhir
                  </span>
                  <span className="text-xl font-bold tabular-nums">
                    {computedScore.toFixed(1)}
                  </span>
                </div>
                <div className="flex flex-1 flex-col items-center rounded-none border bg-primary/5 p-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Grade
                  </span>
                  <span className="text-xl font-bold">{data.grade}</span>
                </div>
              </div>
            )}

            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Supervisor</dt>
                <dd className="font-medium text-right">
                  {data.supervisorName}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Periode</dt>
                <dd className="font-medium text-right text-xs">
                  {formatDate(data.periodStart)} — {formatDate(data.periodEnd)}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  {data.status === "finalized" ? (
                    <Badge
                      variant="default"
                      className="gap-1 rounded-none text-xs"
                    >
                      <LockIcon className="size-3" />
                      Finalized
                    </Badge>
                  ) : data.status === "submitted" ? (
                    <Badge variant="secondary" className="rounded-none text-xs">
                      Submitted
                    </Badge>
                  ) : data.status === "draft" ? (
                    <Badge variant="outline" className="rounded-none text-xs">
                      Draft
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-none text-xs">
                      Belum Dinilai
                    </Badge>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="space-y-4 w-2/3">
          <div className="rounded-none border bg-card p-6">
            {hasAssessment && computedScore !== null && (
              <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center">
                <CircularGauge
                  score={Math.round(computedScore * 10) / 10}
                  size={180}
                />

                <div className="text-center sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Predikat Kinerja
                  </p>
                  <p className="text-2xl font-bold">
                    {data.predikat}
                    <span className="ml-2 inline-flex items-center justify-center rounded-none border px-2 py-0.5 text-sm font-semibold tracking-wide">
                      {data.grade}
                    </span>
                  </p>
                  <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                    {isFinalized && (
                      <Badge
                        variant="secondary"
                        className="gap-1 rounded-none text-xs"
                      >
                        <ShieldCheckIcon className="size-3" />
                        Tervalidasi HR
                      </Badge>
                    )}
                    {isFinalized && (
                      <Badge
                        variant="default"
                        className="gap-1 rounded-none text-xs"
                      >
                        <FileCheckIcon className="size-3" />
                        Dokumen Tersedia
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {!hasAssessment ? (
            <div className="flex flex-col items-center justify-center rounded-none border bg-card py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Belum ada penilaian. Hubungi supervisor untuk informasi lebih
                lanjut.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-none border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Komponen Penilaian
                  </h2>
                  <span className="text-xs font-medium text-muted-foreground">
                    Bobot & Skor
                  </span>
                </div>

                <div className="divide-y">
                  {data.components.map((comp) => (
                    <div key={comp.name} className="py-4 first:pt-0 last:pb-0">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-sm font-medium">{comp.name}</span>
                        <span className="text-xs text-muted-foreground">
                          <sup className="tabular-nums">{comp.weight}%</sup>
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative h-2.5 flex-1 overflow-hidden rounded-none bg-muted">
                          <div
                            className="absolute inset-y-0 left-0 rounded-none transition-all duration-500"
                            style={{
                              width: `${comp.score ?? 0}%`,
                              backgroundColor:
                                comp.score !== null
                                  ? comp.score >= 81
                                    ? "#16a34a"
                                    : comp.score >= 61
                                      ? "#2563eb"
                                      : comp.score >= 41
                                        ? "#ca8a04"
                                        : comp.score >= 21
                                          ? "#ea580c"
                                          : "#dc2626"
                                  : "hsl(var(--muted-foreground) / 0.3)",
                            }}
                          />
                        </div>
                        <span className="min-w-[4.5rem] text-right text-sm font-semibold tabular-nums">
                          {comp.score !== null ? `${comp.score}/100` : "—"}
                        </span>
                      </div>

                      {comp.notes && (
                        <p className="mt-1.5 text-xs italic text-muted-foreground">
                          &ldquo;{comp.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {isFinalized && (
                <div className="flex flex-col gap-2 rounded-none border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <ShieldCheckIcon className="size-4 shrink-0 text-green-600" />
                    <span>
                      <span className="font-medium">Difinalisasi oleh:</span>{" "}
                      <span className="text-muted-foreground">
                        {data.finalizedBy ?? "—"}
                        {data.finalizedAt
                          ? `, ${formatDate(data.finalizedAt)}`
                          : ""}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileCheckIcon className="size-4 shrink-0 text-green-600" />
                    <span className="text-muted-foreground">
                      Dokumen Penilaian: Tersedia untuk pengarsipan
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
