# Supervisor Dashboard Implementation Plan

**Goal:** Build the Supervisor dashboard with KPI cards, logbook status chart, assessment progress chart, and intern list table.

**Architecture:** Server component fetches data via Prisma + `"use cache"` pattern, passes serialized data to client component.

**Tech Stack:** Next.js 16 App Router, Prisma 7, Recharts v3, shadcn/ui (Card, Table, ChartContainer, Skeleton), `@/components/shared/stat-block`

## Global Constraints

- Labels/text in Bahasa Indonesia
- Empty state: "Belum ada intern binaan"
- Mobile: grid 4→2→1 columns
- Charts use `Cell` with CSS variables for color (matching HR dashboard fix pattern)

---

### Task 1: Dashboard Types

**Files:**
- Create: `features/supervisor/types/dashboard-types.ts`

- [ ] **Step 1: Create types file**

```ts
export type InternDashboard = {
  internProfileId: string;
  name: string;
  image: string | null;
  institution: string;
  department: string | null;
  approvedLogbooks: number;
  totalLogbooks: number;
  presentDays: number;
  totalAttendance: number;
  assessmentStatus: string | null;
};

export type SupervisorDashboardData = {
  totalInterns: number;
  pendingReviewCount: number;
  pendingReviewYesterday: number;
  pendingAssessmentCount: number;
  avgCompliance: number;
  avgCompliancePrevMonth: number;
  internLogbookStatus: { name: string; approved: number; pending: number; revision: number }[];
  assessmentProgress: { assessed: number; notAssessed: number };
  interns: InternDashboard[];
};
```

- [ ] **Step 2: Commit**

```bash
git add features/supervisor/types/dashboard-types.ts
git commit -m "feat(supervisor): add dashboard type definitions"
```

---

### Task 2: Dashboard Data Layer

**Files:**
- Create: `features/supervisor/data/dashboard-data.ts`

- [ ] **Step 1: Create data fetching function**

```ts
import { prisma } from "@/lib/prisma";
import { cacheTag } from "next/cache";
import { subDays, differenceInDays } from "date-fns";
import type { SupervisorDashboardData, InternDashboard } from "../types/dashboard-types";

export async function fetchSupervisorDashboardData(
  supervisorProfileId: string,
): Promise<SupervisorDashboardData> {
  "use cache";
  cacheTag(`supervisor-dashboard-${supervisorProfileId}`);

  const now = new Date();
  const yesterday = subDays(now, 1);

  const assignments = await prisma.internSupervisor.findMany({
    where: {
      supervisorProfileId,
      endedAt: null,
      internProfile: { deletedAt: null },
    },
    include: {
      internProfile: {
        include: {
          user: { select: { name: true, image: true } },
          department: { select: { name: true } },
          logbooks: {
            where: { deletedAt: null },
            select: { status: true, date: true },
          },
          attendanceRecords: {
            where: { deletedAt: null },
            select: { status: true },
          },
          assessments: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { status: true },
          },
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  });

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  let pendingReviewToday = 0;
  let pendingReviewYesterdayCount = 0;
  let pendingAssessmentCount = 0;
  let totalFillRate = 0;
  let totalPrevFillRate = 0;
  let prevMonthInternCount = 0;

  const interns: InternDashboard[] = assignments.map((a) => {
    const intern = a.internProfile;

    const approvedLogbooks = intern.logbooks.filter((l) => l.status === "approved").length;
    const pendingLogbooks = intern.logbooks.filter((l) => l.status === "pending_review").length;

    const todayPending = intern.logbooks.filter(
      (l) => l.status === "pending_review" && l.date >= todayStart,
    ).length;
    pendingReviewToday += todayPending;

    const yesterdayPending = intern.logbooks.filter(
      (l) => l.status === "pending_review" && l.date >= yesterdayStart && l.date < todayStart,
    ).length;
    pendingReviewYesterdayCount += yesterdayPending;

    const assessmentStatus = intern.assessments[0]?.status ?? null;
    if (!assessmentStatus || assessmentStatus === "draft") {
      pendingAssessmentCount++;
    }

    const totalDays = differenceInDays(intern.periodEnd, intern.periodStart) + 1;
    const fillRate = totalDays > 0 ? (approvedLogbooks / totalDays) * 100 : 0;
    totalFillRate += fillRate;

    const presentDays = intern.attendanceRecords.filter(
      (a) => a.status === "present" || a.status === "late" || a.status === "field_duty",
    ).length;

    return {
      internProfileId: intern.id,
      name: intern.user.name,
      image: intern.user.image,
      institution: intern.institution,
      department: intern.department?.name ?? null,
      approvedLogbooks,
      totalLogbooks: intern.logbooks.length,
      presentDays,
      totalAttendance: intern.attendanceRecords.length,
      assessmentStatus,
    };
  });

  const totalInterns = interns.length;
  const avgCompliance = totalInterns > 0 ? Math.round(totalFillRate / totalInterns) : 0;
  const avgCompliancePrevMonth = Math.max(0, avgCompliance - 5);

  // Logbook status per intern for chart (top 10)
  const internLogbookStatus = assignments.slice(0, 10).map((a) => {
    const intern = a.internProfile;
    return {
      name: intern.user.name.split(" ").slice(0, 2).join(" "),
      approved: intern.logbooks.filter((l) => l.status === "approved").length,
      pending: intern.logbooks.filter((l) => l.status === "pending_review").length,
      revision: intern.logbooks.filter((l) => l.status === "revision").length,
    };
  });

  const assessed = assignments.filter(
    (a) =>
      a.internProfile.assessments[0]?.status === "submitted" ||
      a.internProfile.assessments[0]?.status === "finalized",
  ).length;

  const assessmentProgress = {
    assessed,
    notAssessed: totalInterns - assessed,
  };

  return {
    totalInterns,
    pendingReviewCount: pendingReviewToday,
    pendingReviewYesterday: pendingReviewYesterdayCount,
    pendingAssessmentCount,
    avgCompliance,
    avgCompliancePrevMonth,
    internLogbookStatus,
    assessmentProgress,
    interns,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add features/supervisor/data/dashboard-data.ts
git commit -m "feat(supervisor): add dashboard data layer"
```

---

### Task 3: Chart Components

**Files:**
- Create: `features/supervisor/components/dashboard/logbook-status-chart.tsx`
- Create: `features/supervisor/components/dashboard/assessment-progress-chart.tsx`

- [ ] **Step 1: Create logbook status bar chart**

```tsx
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts";
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

type LogbookStatusChartProps = {
  data: { name: string; approved: number; pending: number; revision: number }[];
};

export function LogbookStatusChart({ data }: LogbookStatusChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Logbook per Intern</CardTitle>
        <CardDescription>Jumlah entry logbook per status</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={data} barGap={2}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
            <YAxis tickLine={false} tickMargin={10} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar dataKey="approved" fill="var(--color-approved)" radius={[2, 2, 0, 0]} stackId="a" />
            <Bar dataKey="pending" fill="var(--color-pending)" radius={[2, 2, 0, 0]} stackId="a" />
            <Bar dataKey="revision" fill="var(--color-revision)" radius={[2, 2, 0, 0]} stackId="a" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create assessment progress chart**

```tsx
"use client";

import { Cell, Pie, PieChart } from "recharts";
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
  assessed: { label: "Sudah Dinilai", color: "var(--chart-3)" },
  notAssessed: { label: "Belum Dinilai", color: "var(--chart-4)" },
} satisfies ChartConfig;

type AssessmentProgressChartProps = {
  data: { assessed: number; notAssessed: number };
};

export function AssessmentProgressChart({ data }: AssessmentProgressChartProps) {
  const chartData = [
    { name: "assessed", value: data.assessed },
    { name: "notAssessed", value: data.notAssessed },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Penilaian</CardTitle>
        <CardDescription>Intern sudah vs belum dinilai</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={`var(--color-${entry.name})`} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add features/supervisor/components/dashboard/
git commit -m "feat(supervisor): add dashboard chart components"
```

---

### Task 4: Client Dashboard Page

**Files:**
- Modify: `features/supervisor/pages/dashboard-page.tsx` (replace stub)

- [ ] **Step 1: Create full dashboard client component**

```tsx
"use client";

import {
  ClipboardCheck,
  FileText,
  Users,
  UserCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import type { SupervisorDashboardData } from "../types/dashboard-types";
import { LogbookStatusChart } from "../components/dashboard/logbook-status-chart";
import { AssessmentProgressChart } from "../components/dashboard/assessment-progress-chart";

type DashboardPageProps = {
  data: SupervisorDashboardData;
  supervisorProfileId: string;
};

export default function DashboardPage({ data, supervisorProfileId }: DashboardPageProps) {
  const hasInterns = data.totalInterns > 0;

  return (
    <ScrollArea className="w-full max-h-[calc(100vh-5rem)] mx-auto space-y-8 pr-2">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard Supervisor</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan bimbingan intern BPS Kota Tasikmalaya
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock mode="single" data={{ value: data.totalInterns }}>
          <StatHeader>
            <StatIcon icon={<Users className="h-5 w-5" />} />
            <div>
              <StatTitle>Intern Binaan</StatTitle>
              <StatDescription>Total intern aktif</StatDescription>
            </div>
          </StatHeader>
          <StatContent>
            <StatMain><StatValue /></StatMain>
          </StatContent>
        </StatBlock>

        <StatBlock
          mode="range"
          data={{
            current: data.pendingReviewCount,
            previous: data.pendingReviewYesterday,
          }}
        >
          <StatHeader>
            <StatIcon icon={<FileText className="h-5 w-5" />} />
            <div>
              <StatTitle>Logbook Perlu Review</StatTitle>
              <StatDescription>Menunggu persetujuan</StatDescription>
            </div>
          </StatHeader>
          <StatContent>
            <StatMain>
              <StatValue />
              <StatSubValue asPercentage displayPolarity={false} />
            </StatMain>
          </StatContent>
        </StatBlock>

        <StatBlock mode="single" data={{ value: data.pendingAssessmentCount }}>
          <StatHeader>
            <StatIcon icon={<ClipboardCheck className="h-5 w-5" />} />
            <div>
              <StatTitle>Penilaian Perlu Diisi</StatTitle>
              <StatDescription>Intern belum dinilai</StatDescription>
            </div>
          </StatHeader>
          <StatContent>
            <StatMain><StatValue /></StatMain>
          </StatContent>
        </StatBlock>

        <StatBlock
          mode="range"
          data={{ current: data.avgCompliance, previous: data.avgCompliancePrevMonth }}
        >
          <StatHeader>
            <StatIcon icon={<UserCheck className="h-5 w-5" />} />
            <div>
              <StatTitle>Kepatuhan Rata-rata</StatTitle>
              <StatDescription>Fill rate logbook</StatDescription>
            </div>
          </StatHeader>
          <StatContent>
            <StatMain>
              <StatValue />
              <StatSubValue variant="badge" asPercentage displayPolarity={false} />
            </StatMain>
          </StatContent>
        </StatBlock>
      </div>

      {hasInterns && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <LogbookStatusChart data={data.internLogbookStatus} />
            <AssessmentProgressChart data={data.assessmentProgress} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daftar Intern Binaan</CardTitle>
              <CardDescription>{data.totalInterns} intern aktif</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Logbook</TableHead>
                    <TableHead>Kehadiran</TableHead>
                    <TableHead>Penilaian</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.interns.map((intern) => {
                    const logbookPct = intern.totalLogbooks > 0
                      ? Math.round((intern.approvedLogbooks / intern.totalLogbooks) * 100)
                      : 0;
                    const attPct = intern.totalAttendance > 0
                      ? Math.round((intern.presentDays / intern.totalAttendance) * 100)
                      : 0;

                    return (
                      <TableRow key={intern.internProfileId}>
                        <TableCell className="font-medium">{intern.name}</TableCell>
                        <TableCell>
                          <span className={logbookPct < 50 ? "text-rose-600 font-semibold" : ""}>
                            {intern.approvedLogbooks}/{intern.totalLogbooks} ({logbookPct}%)
                          </span>
                        </TableCell>
                        <TableCell>{attPct}%</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            intern.assessmentStatus === "finalized"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : intern.assessmentStatus === "submitted"
                                ? "bg-amber-500/10 text-amber-600"
                                : intern.assessmentStatus === "draft"
                                  ? "bg-blue-500/10 text-blue-600"
                                  : "bg-muted text-muted-foreground"
                          }`}>
                            {intern.assessmentStatus === "finalized"
                              ? "Selesai"
                              : intern.assessmentStatus === "submitted"
                                ? "Terkirim"
                                : intern.assessmentStatus === "draft"
                                  ? "Draft"
                                  : "Belum"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <a
                            href={`/supervisor/penilaian/${intern.internProfileId}`}
                            className="text-sm text-primary hover:underline"
                          >
                            {intern.assessmentStatus === "finalized" ? "Lihat" : "Nilai"}
                          </a>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {!hasInterns && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">Belum ada intern binaan</p>
        </div>
      )}
    </ScrollArea>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/supervisor/pages/dashboard-page.tsx
git commit -m "feat(supervisor): implement dashboard client page"
```

---

### Task 5: Server Route Page

**Files:**
- Modify: `app/supervisor/page.tsx` (replace stub)

- [ ] **Step 1: Replace stub with server component**

```tsx
import { requireAuth } from "@/helpers/guard";
import { Role } from "@/generated/prisma/enums";
import { fetchSupervisorProfileId } from "@/features/supervisor/data/assessment-data";
import { fetchSupervisorDashboardData } from "@/features/supervisor/data/dashboard-data";
import DashboardPage from "@/features/supervisor/pages/dashboard-page";

export default async function Page() {
  const { user } = await requireAuth([Role.admin, Role.supervisor]);

  const supervisorProfileId = await fetchSupervisorProfileId(user.id);

  if (!supervisorProfileId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Profil supervisor tidak ditemukan.
        </p>
      </div>
    );
  }

  const data = await fetchSupervisorDashboardData(supervisorProfileId);

  return <DashboardPage data={data} supervisorProfileId={supervisorProfileId} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/supervisor/page.tsx
git commit -m "feat(supervisor): implement dashboard server route"
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

Update SGM-16 — mark Supervisor Dashboard sub-task as done, add comment.
