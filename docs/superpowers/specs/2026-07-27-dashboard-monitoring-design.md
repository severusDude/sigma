# Dashboard & Monitoring — Design Spec

**Feature**: F11 — Dashboard & Monitoring  
**Issue**: SGM-16  
**Sprint**: 2  
**Dependencies**: F6 (Logbook), F9 (Penilaian)  
**Roles**: Intern, Supervisor, HR, Admin (separate)

---

## 1. Design Principles

- **5-7 KPIs max** per dashboard — focus on actionable data
- **Context always shown** — comparisons, trends, targets per card
- **Consistent color coding** — green (baik), red (perlu perhatian), yellow (warning)
- **StatBlock component** — existing shared component for KPI cards
- **Recharts v3** — AreaChart, BarChart, PieChart for visualizations
- **TanStack Table** — for data tables (Supervisor intern list)
- **Responsive** — grid adapts 4→2→1 columns on mobile
- **Empty state** — "Belum ada data" when no data available
- **Loading state** — Loader2 spinner for async data

---

## 2. Intern Dashboard

**Route**: `/intern`  
**Client component**: `features/intern/pages/dashboard-page.tsx`  
**Server component**: `app/intern/page.tsx`

### 2.1 Layout

```
┌──────────────────────────────────────────────────────┐
│  Header: Selamat datang, [Nama]   Status badge       │
├──────────┬──────────┬──────────┬─────────────────────┤
│  Hari    │ Logbook  │ Hadir    │ Rata-rata           │
│  Aktif   │ Terisi   │          │ Penilaian           │
├──────────┴──────────┴──────────┴─────────────────────┤
│ ┌─────────────────────┐  ┌─────────────────────────┐ │
│ │ Progress Logbook    │  │ Info Pembimbing         │ │
│ │ (AreaChart)         │  │ Supervisor, Divisi,     │ │
│ │                     │  │ Periode                 │ │
│ └─────────────────────┘  └─────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ Aktivitas Terbaru (list notifikasi/activity feed)    │
└──────────────────────────────────────────────────────┘
```

### 2.2 KPI Cards

| # | Label | Data Source | Format | Trend |
|---|-------|------------|--------|-------|
| 1 | Hari Aktif | `periodStart → periodEnd` via `dayjs.diff` | `"Hari ke-45 dari 90"` | — |
| 2 | Logbook Terisi | `COUNT(logbook) / total_hari` | `"12/20 (60%)"` | vs minggu lalu |
| 3 | Kehadiran | `COUNT(attendance WHERE present) / total` | `"15/18 (83%)"` | vs bulan lalu |
| 4 | Rata-rata Penilaian | `AVG(assessmentComponent.score)` | `"82 (Baik)"` | — |

### 2.3 Data Queries

```ts
// app/intern/page.tsx — Server Component
const internProfile = await prisma.internProfile.findUnique({
  where: { userId: user.id },
  include: {
    department: true,
    supervisorAssignments: {
      where: { endedAt: null },
      include: { supervisorProfile: { include: { user: true } } },
    },
    logbooks: { select: { id: true, date: true, status: true } },
    attendanceRecords: { select: { id: true, status: true } },
    assessments: {
      where: { status: "finalized" },
      include: { components: true },
    },
  },
});
```

### 2.4 Charts

- **Progress Logbook (AreaChart)** — logbook entries per ISO week, stacked by status (approved, pending, revision)

### 2.5 States

- **Empty** — `"Belum ada data logbook"` with CTA to fill logbook
- **Loading** — `Loader2` spinner per card
- **Error** — `"Gagal memuat data"` with retry button

---

## 3. Supervisor Dashboard

**Route**: `/supervisor`  
**Client component**: `features/supervisor/pages/dashboard-page.tsx`  
**Server component**: `app/supervisor/page.tsx`

### 3.1 Layout

```
┌──────────────────────────────────────────────────────┐
│  Dashboard Supervisor               [Periode filter] │
├──────────┬──────────┬──────────┬─────────────────────┤
│ Intern   │ Logbook  │ Penilaian│ Rata-rata           │
│ Binaan   │ Perlu    │ Perlu    │ Kepatuhan           │
│          │ Review   │ Diisi    │                     │
├──────────┴──────────┴──────────┴─────────────────────┤
│ ┌─────────────────────┐  ┌─────────────────────────┐ │
│ │ Status Logbook      │  │ Progress Penilaian      │ │
│ │ per Intern (Bar)    │  │ (Radial / Pie)          │ │
│ └─────────────────────┘  └─────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ Daftar Intern Binaan — TanStack Table                │
│ Kolom: Nama | Logbook | Hadir | Nilai | Aksi        │
└──────────────────────────────────────────────────────┘
```

### 3.2 KPI Cards

| # | Label | Data Source | Format | Trend |
|---|-------|------------|--------|-------|
| 1 | Intern Binaan | `COUNT(supervisorAssignments WHERE endedAt=null)` | `12` | — |
| 2 | Logbook Perlu Review | `COUNT(logbooks WHERE status=pending_review AND intern.supervisor=me)` | `5 🟡` | vs kemarin |
| 3 | Penilaian Perlu Diisi | `COUNT(interns WITHOUT submitted assessment)` | `3 🔴` | — |
| 4 | Rata-rata Kepatuhan | `AVG(logbook_fill_rate) of all mentored interns` | `78%` | vs bulan lalu |

### 3.3 Data Queries

```ts
// app/supervisor/page.tsx
const supervisorProfile = await prisma.supervisorProfile.findUnique({
  where: { userId: user.id },
  include: {
    internAssignments: {
      where: { endedAt: null },
      include: {
        internProfile: {
          include: {
            user: { select: { name: true, image: true } },
            logbooks: { select: { status: true } },
            attendanceRecords: { select: { status: true } },
            assessments: { select: { status: true } },
          },
        },
      },
    },
  },
});
```

### 3.4 Table Columns (TanStack Table)

| Column | Accessor | Type |
|--------|----------|------|
| Nama | `user.name` | text + avatar |
| Logbook | `logbooks.filter(approved).length / total` | progress bar |
| Kehadiran | `attendanceRecords.filter(present).length / total` | percentage |
| Status Penilaian | `assessments[0]?.status ?? "belum"` | badge |
| Aksi | — | button group |

### 3.5 States

- **No interns** — `"Belum ada intern binaan"` with illustration
- **Loading** — skeleton per section

---

## 4. HR Dashboard

**Route**: `/hr/dashboard`  
**Client component**: `features/hr/pages/dashboard-page.tsx`  
**Server component**: `app/hr/dashboard/page.tsx`

### 4.1 Layout

```
┌──────────────────────────────────────────────────────┐
│  Dashboard HR                         [Bulan Ini ▼] │
├──────────┬──────────┬──────────┬─────────────────────┤
│ Intern   │Supervisor│ Logbook  │ Kehadiran           │
│ Aktif    │ Aktif    │ Filling  │ Rata-rata           │
│ 45 ▲ 5   │ 12       │ 72% ▼ 3%│ 85% ▲ 2%            │
├──────────┴──────────┴──────────┴─────────────────────┤
│ ┌─────────────────────┐  ┌─────────────────────────┐ │
│ │ Distribusi Intern   │  │ Status Intern           │ │
│ │ per Divisi (Bar)    │  │ (Pie: Aktif/Selesai/   │ │
│ │                     │  │  Dicabut)               │ │
│ └─────────────────────┘  └─────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ Tren Logbook Filling Rate (AreaChart — mingguan)     │
├──────────────────────────────────────────────────────┤
│ Tabel Intern dengan logbook rate < 50% (warning)     │
└──────────────────────────────────────────────────────┘
```

### 4.2 KPI Cards

| # | Label | Data Source | Format | Trend |
|---|-------|------------|--------|-------|
| 1 | Intern Aktif | `COUNT(internProfile WHERE status=active)` | `45` | +5 vs bulan lalu |
| 2 | Supervisor Aktif | `COUNT(supervisorProfile WHERE isActive)` | `12` | — |
| 3 | Logbook Filling | `AVG(filled_days / total_days) across active interns` | `72%` | ▼ 3% |
| 4 | Kehadiran Rata-rata | `AVG(present_days / total_days)` | `85%` | ▲ 2% |

### 4.3 Data Queries

```ts
// app/hr/dashboard/page.tsx
const [interns, supervisors, deptStats] = await Promise.all([
  prisma.internProfile.findMany({
    where: { status: "active" },
    include: {
      user: { select: { name: true } },
      department: true,
      logbooks: { select: { status: true, date: true } },
      attendanceRecords: { select: { status: true } },
    },
  }),
  prisma.supervisorProfile.count({ where: { isActive: true } }),
  prisma.internProfile.groupBy({
    by: ["departmentId"],
    where: { status: "active" },
    _count: true,
  }),
]);
```

### 4.4 Charts

- **BarChart** — Jumlah intern per divisi/department
- **PieChart** — Status interns (active / completed / withdrawn)
- **AreaChart** — Logbook filling rate trend (weekly rolling 12 weeks)

### 4.5 States

- **Empty** — `"Belum ada data magang"`
- **Loading** — full page skeleton

---

## 5. Data Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Route Page (Server)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │  requireAuth([Role.hr, Role.admin])               │  │
│  │  prisma queries → serialize dates                 │  │
│  │  return <ClientComponent data={serialized} />     │  │
│  └───────────────────────────────────────────────────┘  │
│                          ↓                               │
│                Client Component ("use client")           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  useQuery / useSuspenseQuery (TanStack Query)     │  │
│  │  StatBlock, Recharts, TanStack Table              │  │
│  │  Loading / Empty / Error states                   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 6. Shared Components Used

| Component | Usage |
|-----------|-------|
| `StatBlock` (stat-block.tsx) | All KPI cards |
| `Card` (shadcn/ui) | Chart containers, info cards |
| `ChartContainer` (shadcn/ui) | Recharts wrapper |
| `DataTable` (shared) | Supervisor intern table |
| `SearchInput` | Table search |
| `ResponsiveModal` | Detail views (mobile) |
| `Skeleton` (shadcn/ui) | Loading states |

## 7. File Structure

```
features/
├── intern/
│   ├── pages/dashboard-page.tsx      ← client component
│   └── components/dashboard/         ← chart sub-components
├── supervisor/
│   ├── pages/dashboard-page.tsx      ← client component
│   └── components/dashboard/         ← chart sub-components
├── hr/
│   ├── pages/dashboard-page.tsx      ← client component
│   └── components/dashboard/         ← chart sub-components
app/
├── intern/page.tsx                   ← server component
├── supervisor/page.tsx               ← server component
└── hr/dashboard/page.tsx             ← server component
```

## 8. Edge Cases

- **Data kosong** — Tampilkan `"Belum ada data"` dengan ilustrasi
- **Koneksi lambat** — Skeleton loading per section, bukan spinner global
- **Mobile** — Grid 4→2→1 kolom, chart full-width, table jadi card list
- **Error fetching** — `"Gagal memuat data"` dengan tombol `Coba Lagi`
- **No supervisor assigned** — Intern dashboard tetap jalan, bagian supervisor menunjukkan `"Belum ada pembimbing"`
- **Periode sudah berakhir** — Tampilkan banner peringatan "Periode magang telah berakhir"
