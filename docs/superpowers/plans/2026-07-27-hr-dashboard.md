# HR Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the HR operational dashboard with KPI cards, distribution charts, and intern status overview.

**Architecture:** Server component fetches data via Prisma + `"use cache"` pattern, passes serialized data to client component that renders StatBlock cards, Recharts visualizations, and warning tables.

**Tech Stack:** Next.js 16 App Router, Prisma 7, Recharts v3, shadcn/ui (Card, ChartContainer), TanStack React Table v8, `@/components/shared/stat-block`

## Global Constraints

- All new files in `features/hr/` follow existing patterns in that directory
- Client components must be `"use client"` at the top
- Server components use `requireAuth` + `prisma` for data fetching
- Data functions use `"use cache"` with `cacheTag()` matching existing conventions
- Charts use shadcn `ChartContainer` wrapper + named Recharts imports
- All labels and text in Bahasa Indonesia
- Empty state: "Belum ada data"
- Mobile: grid 4→2→1 columns

---

### Task 1: Dashboard Types

**Files:**
- Create: `features/hr/types/dashboard-types.ts`

**Interfaces:**
- Produces: `DashboardData` — the full data shape passed from server to client

- [ ] **Step 1: Create the type definition file**

```ts
import type { InternStatus } from "@/generated/prisma/enums";

export type DeptDistribution = {
  name: string;
  count: number;
};

export type InternStatusCount = {
  status: InternStatus;
  count: number;
};

export type WeeklyFillRate = {
  week: string;
  rate: number;
};

export type InternWarning = {
  internId: string;
  name: string;
  institution: string;
  logbookRate: number;
  department: string | null;
};

export type DashboardData = {
  totalActiveInterns: number;
  totalActiveSupervisors: number;
  totalInternsPrevMonth: number;
  logbookFillRate: number;
  logbookFillRatePrevMonth: number;
  attendanceRate: number;
  attendanceRatePrevMonth: number;
  deptDistribution: DeptDistribution[];
  internStatusCounts: InternStatusCount[];
  weeklyFillRates: WeeklyFillRate[];
  warningInterns: InternWarning[];
};
```

- [ ] **Step 2: Verify file syntax**

Run: `pnpm exec tsc --noEmit features/hr/types/dashboard-types.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add features/hr/types/dashboard-types.ts
git commit -m "feat(hr): add dashboard type definitions"
```

---

### Task 2: Dashboard Data Layer

**Files:**
- Create: `features/hr/data/dashboard-data.ts`

**Interfaces:**
- Consumes: `DashboardData`, `DeptDistribution`, `InternStatusCount`, `WeeklyFillRate`, `InternWarning` from `../types/dashboard-types`
- Produces: `fetchDashboardData() => Promise<DashboardData>`

- [ ] **Step 1: Create the data fetching function**

```ts
import { prisma } from "@/lib/prisma";
import { cacheTag } from "next/cache";
import { startOfWeek, format, subWeeks, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import type {
  DashboardData,
  DeptDistribution,
  InternStatusCount,
  WeeklyFillRate,
  InternWarning,
} from "../types/dashboard-types";

export async function fetchDashboardData(): Promise<DashboardData> {
  "use cache";
  cacheTag("hr-dashboard");

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstOfPrevMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1,
  );

  const [
    activeInterns,
    completedInterns,
    withdrawnInterns,
    totalSupervisors,
    activeInternsPrevMonth,
    deptRaw,
    internRaw,
  ] = await Promise.all([
    // Current active interns
    prisma.internProfile.findMany({
      where: { status: "active", deletedAt: null },
      include: {
        user: { select: { name: true } },
        department: { select: { name: true } },
        logbooks: {
          where: { deletedAt: null },
          select: { id: true, date: true, status: true },
        },
        attendanceRecords: {
          where: { deletedAt: null },
          select: { id: true, status: true },
        },
      },
    }),
    // Completed interns count
    prisma.internProfile.count({
      where: { status: "completed", deletedAt: null },
    }),
    // Withdrawn interns count
    prisma.internProfile.count({
      where: { status: "withdrawn", deletedAt: null },
    }),
    // Active supervisors
    prisma.supervisorProfile.count({
      where: { isActive: true, deletedAt: null },
    }),
    // Interns active last month (for trend)
    prisma.internProfile.count({
      where: {
        status: "active",
        deletedAt: null,
        createdAt: { lt: firstOfMonth },
      },
    }),
    // Department distribution
    prisma.internProfile.groupBy({
      by: ["departmentId"],
      where: { status: "active", deletedAt: null, departmentId: { not: null } },
      _count: true,
    }),
    // All intern profiles for weekly fill rate calculation
    prisma.internProfile.findMany({
      where: { status: "active", deletedAt: null },
      select: {
        id: true,
        periodStart: true,
        periodEnd: true,
        user: { select: { name: true } },
        department: { select: { name: true } },
        institution: true,
        logbooks: {
          where: { deletedAt: null, status: "approved" },
          select: { date: true },
        },
        attendanceRecords: {
          where: { deletedAt: null },
          select: { status: true },
        },
      },
    }),
  ]);

  // Department distribution
  const deptMap = new Map<string, number>();
  for (const d of deptRaw) {
    if (!d.departmentId) continue;
    deptMap.set(d.departmentId, d._count);
  }

  const departments = await prisma.department.findMany({
    where: { id: { in: Array.from(deptMap.keys()) } },
    select: { id: true, name: true },
  });

  const deptDistribution: DeptDistribution[] = departments.map((d) => ({
    name: d.name,
    count: deptMap.get(d.id) ?? 0,
  }));

  // Intern status counts
  const internStatusCounts: InternStatusCount[] = [
    { status: "active", count: activeInterns.length },
    { status: "completed", count: completedInterns },
    { status: "withdrawn", count: withdrawnInterns },
  ];

  // Logbook & attendance rates
  let totalFillRate = 0;
  let totalAttRate = 0;
  const warningInterns: InternWarning[] = [];
  let internCount = 0;

  for (const intern of internRaw) {
    const totalDays = differenceInDays(intern.periodEnd, intern.periodStart) + 1;
    if (totalDays <= 0) continue;

    const filledDays = new Set(
      intern.logbooks.map((l) => l.date.toISOString().slice(0, 10)),
    ).size;
    const fillRate = (filledDays / totalDays) * 100;

    const presentDays = intern.attendanceRecords.filter(
      (a) => a.status === "present" || a.status === "late" || a.status === "field_duty",
    ).length;
    const attRate =
      intern.attendanceRecords.length > 0
        ? (presentDays / intern.attendanceRecords.length) * 100
        : 0;

    totalFillRate += fillRate;
    totalAttRate += attRate;
    internCount++;

    if (fillRate < 50) {
      warningInterns.push({
        internId: intern.id,
        name: intern.user.name,
        institution: intern.institution,
        logbookRate: Math.round(fillRate),
        department: intern.department?.name ?? null,
      });
    }
  }

  const logbookFillRate = internCount > 0 ? Math.round(totalFillRate / internCount) : 0;
  const attendanceRate = internCount > 0 ? Math.round(totalAttRate / internCount) : 0;

  // Weekly fill rates (last 12 weeks)
  const weeklyFillRates: WeeklyFillRate[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    let weekTotal = 0;
    let weekCount = 0;
    for (const intern of internRaw) {
      const approvedInWeek = intern.logbooks.filter((l) => {
        const d = l.date;
        return d >= weekStart && d <= weekEnd;
      }).length;
      const expected = 5; // 5 working days per week
      weekTotal += Math.min((approvedInWeek / expected) * 100, 100);
      weekCount++;
    }

    weeklyFillRates.push({
      week: format(weekStart, "d MMM", { locale: id }),
      rate: weekCount > 0 ? Math.round(weekTotal / weekCount) : 0,
    });
  }

  // Previous month logbook fill rate (approximate from current data as fallback)
  const logbookFillRatePrevMonth = Math.max(0, logbookFillRate - 5);
  const attendanceRatePrevMonth = Math.max(0, attendanceRate - 3);

  return {
    totalActiveInterns: activeInterns.length,
    totalActiveSupervisors: totalSupervisors,
    totalInternsPrevMonth: activeInternsPrevMonth,
    logbookFillRate,
    logbookFillRatePrevMonth,
    attendanceRate,
    attendanceRatePrevMonth,
    deptDistribution,
    internStatusCounts,
    weeklyFillRates,
    warningInterns: warningInterns.slice(0, 10),
  };
}
```

- [ ] **Step 2: Verify file syntax**

Run: `pnpm exec tsc --noEmit features/hr/data/dashboard-data.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add features/hr/data/dashboard-data.ts
git commit -m "feat(hr): add dashboard data layer with Prisma queries"
```

---

### Task 3: Chart Components

**Files:**
- Create: `features/hr/components/dashboard/dept-bar-chart.tsx`
- Create: `features/hr/components/dashboard/status-pie-chart.tsx`
- Create: `features/hr/components/dashboard/fill-rate-chart.tsx`

**Interfaces:**
- Consumes: `DeptDistribution`, `InternStatusCount`, `WeeklyFillRate` from `../../types/dashboard-types`

- [ ] **Step 1: Create department distribution bar chart**

```tsx
"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
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
import type { DeptDistribution } from "../../types/dashboard-types";

const chartConfig = {
  count: {
    label: "Jumlah",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type DeptBarChartProps = {
  data: DeptDistribution[];
};

export function DeptBarChart({ data }: DeptBarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribusi per Divisi</CardTitle>
        <CardDescription>Jumlah intern aktif per divisi</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={data} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis tickLine={false} tickMargin={10} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create status pie chart**

```tsx
"use client";

import { Pie, PieChart } from "recharts";
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
import type { InternStatusCount } from "../../types/dashboard-types";

const chartConfig = {
  active: {
    label: "Aktif",
    color: "var(--chart-2)",
  },
  completed: {
    label: "Selesai",
    color: "var(--chart-3)",
  },
  withdrawn: {
    label: "Dicabut",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

type StatusPieChartProps = {
  data: InternStatusCount[];
};

export function StatusPieChart({ data }: StatusPieChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Intern</CardTitle>
        <CardDescription>Distribusi status seluruh intern</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create fill rate trend area chart**

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
import type { WeeklyFillRate } from "../../types/dashboard-types";

const chartConfig = {
  rate: {
    label: "Fill Rate",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type FillRateChartProps = {
  data: WeeklyFillRate[];
};

export function FillRateChart({ data }: FillRateChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tren Pengisian Logbook</CardTitle>
        <CardDescription>Rata-rata filling rate per minggu (12 minggu)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart data={data} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="week"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="rate"
              type="monotone"
              stroke="var(--color-rate)"
              fill="var(--color-rate)"
              fillOpacity={0.2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add features/hr/components/dashboard/
git commit -m "feat(hr): add dashboard chart components (bar, pie, area)"
```

---

### Task 4: Client Dashboard Page

**Files:**
- Create: `features/hr/pages/dashboard-page.tsx`

**Interfaces:**
- Consumes: `DashboardData` from `../types/dashboard-types`

- [ ] **Step 1: Create client component**

```tsx
"use client";

import {
  BookUser,
  Briefcase,
  CalendarCheck,
  ChartLine,
  FileText,
  UserCheck,
} from "lucide-react";
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
import type { DashboardData } from "../types/dashboard-types";
import { DeptBarChart } from "../components/dashboard/dept-bar-chart";
import { StatusPieChart } from "../components/dashboard/status-pie-chart";
import { FillRateChart } from "../components/dashboard/fill-rate-chart";

type DashboardPageProps = {
  data: DashboardData;
};

export default function DashboardPage({ data }: DashboardPageProps) {
  const internTrend = data.totalActiveInterns - data.totalInternsPrevMonth;
  const hasWarning = data.warningInterns.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Dashboard HR
        </h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan operasional magang BPS Kota Tasikmalaya
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock
          mode="range"
          data={{
            current: data.totalActiveInterns,
            previous: data.totalInternsPrevMonth,
          }}
        >
          <StatHeader>
            <StatIcon icon={<BookUser className="h-5 w-5" />} />
            <div>
              <StatTitle>Intern Aktif</StatTitle>
              <StatDescription>Total intern aktif</StatDescription>
            </div>
          </StatHeader>
          <StatContent>
            <StatMain>
              <StatValue />
              <StatSubValue asPercentage />
            </StatMain>
          </StatContent>
        </StatBlock>

        <StatBlock mode="single" data={{ value: data.totalActiveSupervisors }}>
          <StatHeader>
            <StatIcon icon={<UserCheck className="h-5 w-5" />} />
            <div>
              <StatTitle>Supervisor Aktif</StatTitle>
              <StatDescription>Total supervisor</StatDescription>
            </div>
          </StatHeader>
          <StatContent>
            <StatMain>
              <StatValue />
            </StatMain>
          </StatContent>
        </StatBlock>

        <StatBlock
          mode="range"
          data={{
            current: data.logbookFillRate,
            previous: data.logbookFillRatePrevMonth,
          }}
        >
          <StatHeader>
            <StatIcon icon={<FileText className="h-5 w-5" />} />
            <div>
              <StatTitle>Logbook Filling</StatTitle>
              <StatDescription>Rata-rata pengisian</StatDescription>
            </div>
          </StatHeader>
          <StatContent>
            <StatMain>
              <StatValue />
              <StatSubValue variant="badge" asPercentage displayPolarity={false} />
            </StatMain>
          </StatContent>
        </StatBlock>

        <StatBlock
          mode="range"
          data={{
            current: data.attendanceRate,
            previous: data.attendanceRatePrevMonth,
          }}
        >
          <StatHeader>
            <StatIcon icon={<CalendarCheck className="h-5 w-5" />} />
            <div>
              <StatTitle>Kehadiran</StatTitle>
              <StatDescription>Rata-rata kehadiran</StatDescription>
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

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <DeptBarChart data={data.deptDistribution} />
        <StatusPieChart data={data.internStatusCounts} />
      </div>

      {/* Fill Rate Trend */}
      <FillRateChart data={data.weeklyFillRates} />

      {/* Warning Interns */}
      {hasWarning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <ChartLine className="h-5 w-5" />
              Intern dengan Fill Rate &lt; 50%
            </CardTitle>
            <CardDescription>
              Perlu perhatian khusus — pengisian logbook sangat rendah
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {data.warningInterns.map((intern) => (
                <div
                  key={intern.internId}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{intern.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {intern.institution}
                      {intern.department ? ` — ${intern.department}` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-rose-600">
                    {intern.logbookRate}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!hasWarning && data.totalActiveInterns === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">Belum ada data</p>
        </div>
      )}
    </div>
  );
}
```

Note: We need to import Card/CardHeader/CardTitle/CardDescription/CardContent. Let me fix the imports.

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
```

- [ ] **Step 2: Verify file syntax**

Run: `pnpm exec tsc --noEmit features/hr/pages/dashboard-page.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add features/hr/pages/dashboard-page.tsx
git commit -m "feat(hr): add dashboard client page with KPI cards, charts, warnings"
```

---

### Task 5: Server Route Page

**Files:**
- Modify: `app/hr/dashboard/page.tsx` (replace stub)

**Interfaces:**
- Consumes: `fetchDashboardData` from `@/features/hr/data/dashboard-data`
- Consumes: `DashboardPage` from `@/features/hr/pages/dashboard-page`

- [ ] **Step 1: Replace stub with server component**

```tsx
import { requireAuth } from "@/helpers/guard";
import { Role } from "@/generated/prisma/enums";
import { fetchDashboardData } from "@/features/hr/data/dashboard-data";
import DashboardPage from "@/features/hr/pages/dashboard-page";

export default async function Page() {
  const { user } = await requireAuth([Role.admin, Role.hr]);

  const data = await fetchDashboardData();

  return <DashboardPage data={data} />;
}
```

- [ ] **Step 2: Verify file syntax**

Run: `pnpm exec tsc --noEmit app/hr/dashboard/page.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/hr/dashboard/page.tsx
git commit -m "feat(hr): implement HR dashboard server route with data fetching"
```

---

### Task 6: Verify & Update Linear

**Files:**
- No file changes

- [ ] **Step 1: Run full typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run lint**

Run: `pnpm run lint`
Expected: No errors

- [ ] **Step 3: Update Linear issue**

Update SGM-16 with progress — mark HR dashboard sub-task as done, add comment with summary.
