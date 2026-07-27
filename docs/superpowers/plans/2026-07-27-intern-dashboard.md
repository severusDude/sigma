# Intern Dashboard Implementation Plan

**Goal:** Build the Intern dashboard with welcome header, KPI cards, logbook progress chart, mentor info card, and activity feed.

**Architecture:** Server component fetches data via Prisma + `"use cache"` pattern, passes serialized data to client component.

**Tech Stack:** Next.js 16 App Router, Prisma 7, Recharts v3, shadcn/ui (Card, ScrollArea, Skeleton), `@/components/shared/stat-block`

## Global Constraints

- Labels/text in Bahasa Indonesia
- Charts use `Cell` with CSS variables for color
- Routing: dashboard at `/intern/dashboard` (matching sidebar), `/intern` redirects there

---

### Task 1: Dashboard Types

**Files:**
- Create: `features/intern/types/dashboard-types.ts`

- [ ] **Step 1: Create types**

```ts
export type InternDashboardData = {
  name: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  activeDay: number;
  totalDays: number;
  logbookFilled: number;
  logbookTotal: number;
  logbookTrend: number;
  attendancePresent: number;
  attendanceTotal: number;
  attendanceTrend: number;
  avgScore: number | null;
  avgGrade: string | null;
  supervisorName: string | null;
  supervisorNip: string | null;
  departmentName: string | null;
  weeklyLogbooks: { week: string; approved: number; pending: number; revision: number }[];
  recentActivity: { date: string; activity: string; status: string }[];
};
```

- [ ] **Step 2: Commit**

```bash
git add features/intern/types/dashboard-types.ts
git commit -m "feat(intern): add dashboard type definitions"
```

---

### Task 2: Dashboard Data Layer

**Files:**
- Create: `features/intern/data/dashboard-data.ts`

- [ ] **Step 1: Create data function**

```ts
import { prisma } from "@/lib/prisma";
import { cacheTag } from "next/cache";
import { differenceInDays, startOfWeek, format, subWeeks } from "date-fns";
import { id } from "date-fns/locale";
import type { InternDashboardData } from "../types/dashboard-types";

export async function fetchInternDashboardData(
  userId: string,
): Promise<InternDashboardData | null> {
  "use cache";
  cacheTag(`intern-dashboard-${userId}`);

  const profile = await prisma.internProfile.findUnique({
    where: { userId, deletedAt: null },
    include: {
      user: { select: { name: true } },
      department: { select: { name: true } },
      supervisorAssignments: {
        where: { endedAt: null },
        include: {
          supervisorProfile: {
            include: { user: { select: { name: true } } },
          },
        },
      },
      logbooks: {
        where: { deletedAt: null },
        orderBy: { date: "desc" },
        select: { id: true, date: true, status: true, activity: true },
      },
      attendanceRecords: {
        where: { deletedAt: null },
        select: { status: true },
      },
      assessments: {
        where: { status: "finalized" },
        include: { components: { select: { score: true } } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!profile) return null;

  const now = new Date();
  const totalDays = differenceInDays(profile.periodEnd, profile.periodStart) + 1;
  const elapsedDays = differenceInDays(now, profile.periodStart) + 1;
  const activeDay = Math.max(1, Math.min(elapsedDays, totalDays));

  const filledDates = new Set(
    profile.logbooks.map((l) => l.date.toISOString().slice(0, 10)),
  ).size;

  const presentCount = profile.attendanceRecords.filter(
    (a) => a.status === "present" || a.status === "late" || a.status === "field_duty",
  ).length;

  const assessment = profile.assessments[0];
  const avgScore = assessment?.components.length
    ? Math.round(
        assessment.components.reduce((s, c) => s + (c.score ?? 0), 0) /
          assessment.components.length,
      )
    : null;
  const avgGrade =
    avgScore !== null
      ? avgScore >= 81 ? "Sangat Baik"
        : avgScore >= 61 ? "Baik"
        : avgScore >= 41 ? "Cukup"
        : avgScore >= 21 ? "Kurang"
        : "Sangat Kurang"
      : null;

  const prevWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const prevWeekFilled = profile.logbooks.filter(
    (l) => l.date >= prevWeekStart && l.date < thisWeekStart,
  ).length;
  const thisWeekFilled = profile.logbooks.filter(
    (l) => l.date >= thisWeekStart,
  ).length;
  const logbookTrend = prevWeekFilled > 0
    ? Math.round(((thisWeekFilled - prevWeekFilled) / prevWeekFilled) * 100)
    : thisWeekFilled > 0 ? 100 : 0;

  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthPresent = profile.attendanceRecords.filter(
    (a) => a.status === "present" || a.status === "late" || a.status === "field_duty",
  ).length;
  const prevMonthTotal = profile.attendanceRecords.length;
  const attTrend = prevMonthTotal > 0
    ? Math.round(((presentCount - prevMonthPresent) / prevMonthTotal) * 100)
    : 0;

  const weeklyLogbooks = [];
  for (let i = 11; i >= 0; i--) {
    const ws = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const we = new Date(ws);
    we.setDate(we.getDate() + 6);
    const entries = profile.logbooks.filter((l) => l.date >= ws && l.date <= we);
    weeklyLogbooks.push({
      week: format(ws, "d MMM", { locale: id }),
      approved: entries.filter((l) => l.status === "approved").length,
      pending: entries.filter((l) => l.status === "pending_review").length,
      revision: entries.filter((l) => l.status === "revision").length,
    });
  }

  const supervisor = profile.supervisorAssignments[0]?.supervisorProfile;

  return {
    name: profile.user.name,
    status: profile.status,
    periodStart: profile.periodStart.toISOString(),
    periodEnd: profile.periodEnd.toISOString(),
    activeDay,
    totalDays,
    logbookFilled: filledDates,
    logbookTotal: activeDay,
    logbookTrend,
    attendancePresent: presentCount,
    attendanceTotal: profile.attendanceRecords.length,
    attendanceTrend: attTrend,
    avgScore,
    avgGrade,
    supervisorName: supervisor?.user.name ?? null,
    supervisorNip: supervisor?.nip ?? null,
    departmentName: profile.department?.name ?? null,
    weeklyLogbooks,
    recentActivity: profile.logbooks.slice(0, 10).map((l) => ({
      date: l.date.toISOString(),
      activity: l.activity,
      status: l.status,
    })),
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add features/intern/data/dashboard-data.ts
git commit -m "feat(intern): add dashboard data layer"
```

---

### Task 3: Chart Component

**Files:**
- Create: `features/intern/components/dashboard/logbook-progress-chart.tsx`

- [ ] **Step 1: Create stacked area chart**

```tsx
"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  approved: { label: "Disetujui", color: "var(--chart-2)" },
  pending: { label: "Menunggu", color: "var(--chart-5)" },
  revision: { label: "Revisi", color: "var(--chart-4)" },
} satisfies ChartConfig;

type LogbookProgressChartProps = {
  data: { week: string; approved: number; pending: number; revision: number }[];
};

export function LogbookProgressChart({ data }: LogbookProgressChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Logbook</CardTitle>
        <CardDescription>Entry logbook per minggu</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-[3/1]">
          <AreaChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="week"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              fontSize={10}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="approved"
              type="monotone"
              stroke="var(--color-approved)"
              fill="var(--color-approved)"
              fillOpacity={0.3}
              stackId="1"
            />
            <Area
              dataKey="pending"
              type="monotone"
              stroke="var(--color-pending)"
              fill="var(--color-pending)"
              fillOpacity={0.3}
              stackId="1"
            />
            <Area
              dataKey="revision"
              type="monotone"
              stroke="var(--color-revision)"
              fill="var(--color-revision)"
              fillOpacity={0.3}
              stackId="1"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/intern/components/dashboard/
git commit -m "feat(intern): add dashboard chart component"
```

---

### Task 4: Client Dashboard Page

**Files:**
- Create: `features/intern/pages/dashboard-page.tsx` (new)
- Delete: `features/intern/dashboard-page.tsx` (old stub)

- [ ] **Step 1: Create client component**

```tsx
"use client";

import { BookOpen, CalendarCheck, GraduationCap, Trophy, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  StatBlock,
  StatContent,
  StatDescription,
  StatHeader,
  StatIcon,
  StatMain,
  StatSubValue,
  StatTitle,
  StatValue,
} from "@/components/shared/stat-block";
import type { InternDashboardData } from "../types/dashboard-types";
import { LogbookProgressChart } from "../components/dashboard/logbook-progress-chart";

type DashboardPageProps = {
  data: InternDashboardData;
};

export default function DashboardPage({ data }: DashboardPageProps) {
  const logbookPct =
    data.logbookTotal > 0
      ? Math.round((data.logbookFilled / data.logbookTotal) * 100)
      : 0;
  const attPct =
    data.attendanceTotal > 0
      ? Math.round((data.attendancePresent / data.attendanceTotal) * 100)
      : 0;
  const hasRecent = data.recentActivity.length > 0;

  return (
    <ScrollArea className="w-full max-h-[calc(100vh-5rem)] mx-auto space-y-8 pr-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Selamat datang, {data.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan aktivitas magang Anda
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-medium text-emerald-600 bg-emerald-500/10">
          {data.status === "active" ? "Aktif" : data.status}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock mode="range" data={{ current: data.activeDay, previous: data.totalDays }}>
          <StatHeader>
            <StatIcon icon={<CalendarCheck className="h-5 w-5" />} />
            <div>
              <StatTitle>Hari Aktif</StatTitle>
              <StatDescription>Periode magang</StatDescription>
            </div>
          </StatHeader>
          <StatContent>
            <StatMain>
              <StatValue />
              <StatSubValue variant="badge" asPercentage displayPolarity={false} />
            </StatMain>
          </StatContent>
        </StatBlock>

        <StatBlock mode="range" data={{ current: data.logbookFilled, previous: data.logbookTotal }}>
          <StatHeader>
            <StatIcon icon={<BookOpen className="h-5 w-5" />} />
            <div>
              <StatTitle>Logbook Terisi</StatTitle>
              <StatDescription>{data.logbookTrend >= 0 ? "▲ Naik" : "▼ Turun"} vs minggu lalu</StatDescription>
            </div>
          </StatHeader>
          <StatContent>
            <StatMain>
              <StatValue />
              <StatSubValue variant="badge" asPercentage displayPolarity={false} />
            </StatMain>
          </StatContent>
        </StatBlock>

        <StatBlock mode="range" data={{ current: data.attendancePresent, previous: data.attendanceTotal }}>
          <StatHeader>
            <StatIcon icon={<User className="h-5 w-5" />} />
            <div>
              <StatTitle>Kehadiran</StatTitle>
              <StatDescription>Total presensi</StatDescription>
            </div>
          </StatHeader>
          <StatContent>
            <StatMain>
              <StatValue />
              <StatSubValue variant="badge" asPercentage displayPolarity={false} />
            </StatMain>
          </StatContent>
        </StatBlock>

        <StatBlock mode="single" data={{ value: data.avgGrade ?? "—" }}>
          <StatHeader>
            <StatIcon icon={<Trophy className="h-5 w-5" />} />
            <div>
              <StatTitle>Rata-rata Nilai</StatTitle>
              <StatDescription>{data.avgScore !== null ? `Skor ${data.avgScore}` : "Belum ada"}</StatDescription>
            </div>
          </StatHeader>
          <StatContent>
            <StatMain>
              <StatValue />
            </StatMain>
          </StatContent>
        </StatBlock>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LogbookProgressChart data={data.weeklyLogbooks} />
        <Card>
          <CardHeader>
            <CardTitle>Info Pembimbing</CardTitle>
            <CardDescription>Supervisor dan divisi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {data.supervisorName ?? "Belum ada"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.supervisorNip
                    ? `NIP. ${data.supervisorNip}`
                    : "Supervisor"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {data.departmentName ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">Divisi</p>
              </div>
            </div>
            <div className="pt-2 text-xs text-muted-foreground">
              Periode: {new Date(data.periodStart).toLocaleDateString("id-ID")} —{" "}
              {new Date(data.periodEnd).toLocaleDateString("id-ID")}
            </div>
          </CardContent>
        </Card>
      </div>

      {hasRecent && (
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>10 entry logbook terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {data.recentActivity.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{item.activity}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.date).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <span
                    className={`ml-3 shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.status === "approved"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : item.status === "pending_review"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-rose-500/10 text-rose-600"
                    }`}
                  >
                    {item.status === "approved"
                      ? "Disetujui"
                      : item.status === "pending_review"
                        ? "Menunggu"
                        : "Revisi"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!hasRecent && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">Belum ada data logbook</p>
        </div>
      )}
    </ScrollArea>
  );
}
```

- [ ] **Step 2: Delete old stub**

Run: `git rm features/intern/dashboard-page.tsx`

- [ ] **Step 3: Commit**

```bash
git add features/intern/pages/dashboard-page.tsx
git commit -m "feat(intern): implement dashboard client page"
```

---

### Task 5: Server Routes

**Files:**
- Create: `app/intern/dashboard/page.tsx`
- Modify: `app/intern/page.tsx` (redirect to /intern/dashboard)

- [ ] **Step 1: Create dashboard route**

```tsx
import { requireAuth } from "@/helpers/guard";
import { Role } from "@/generated/prisma/enums";
import { fetchInternDashboardData } from "@/features/intern/data/dashboard-data";
import DashboardPage from "@/features/intern/pages/dashboard-page";

export default async function Page() {
  const { user } = await requireAuth([Role.admin, Role.intern]);

  const data = await fetchInternDashboardData(user.id);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Profil intern tidak ditemukan.
        </p>
      </div>
    );
  }

  return <DashboardPage data={data} />;
}
```

- [ ] **Step 2: Redirect root /intern to /intern/dashboard**

```tsx
import { redirect } from "next/navigation";

export default function Page() {
  redirect("/intern/dashboard");
}
```

- [ ] **Step 3: Commit**

```bash
git add app/intern/dashboard/page.tsx app/intern/page.tsx
git commit -m "feat(intern): add dashboard route with redirect"
```

---

### Task 6: Verify & Update Linear

- [ ] **Step 1: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Lint**

Run: `pnpm run lint`
Expected: No new errors

- [ ] **Step 3: Update Linear**

Update SGM-16 — mark Intern Dashboard AC as done, add comment.
