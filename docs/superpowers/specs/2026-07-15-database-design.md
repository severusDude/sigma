# Database Design — SIGMA (Sistem Informasi Management Magang)

**Version**: 1.0
**Status**: Draft
**Last Updated**: 2026-07-15

---

## 1. Design Principles

| Principle | Description |
|-----------|-------------|
| **camelCase columns** | All column names are camelCase (e.g., `firstName`, `dateOfBirth`) |
| **lowercase tables** | All table names via `@@map("snake_case_name")` |
| **Timestamps** | `createdAt` and `updatedAt` on every model |
| **Soft delete** | `deletedAt DateTime?` on business models; filtered via Prisma middleware |
| **Polymorphic attachments** | Single `Attachment` table via `attachableType` + `attachableId` |
| **UUID-style IDs** | `cuid()` for all new models; Better-Auth models use UUID strings |
| **Indexes** | Foreign keys, status fields, and date ranges indexed |

---

## 2. Model Overview

```
Core/Auth (Better-Auth managed)
├── User
├── Session
├── Account
├── Verification

Audit
└── AuditLog

Masters
├── Department              # Bidang/divisi
├── InternProfile           # 1:1 with User for Intern role
├── SupervisorProfile       # 1:1 with User for Supervisor role
└── InternSupervisor        # Assignment history (Intern ↔ Supervisor)

Operations
├── Issue                   # "Rencana Kegiatan" created by Supervisor
├── Logbook                 # Daily entries linked to Issue
├── Attendance              # Check-in/out (QR/GPS/manual)
├── GuidanceSession         # Bimbingan requests & records
├── Assessment              # Penilaian with components
└── AssessmentComponent     # Individual score per criteria

Documents
├── Document                # Generated certificates, letters
├── DocumentTemplate        # Configurable PDF templates
└── Guide                   # Internship guides & PDFs

System
├── Notification            # In-app notifications
└── SystemConfig            # Key-value configuration

Cross-cutting
└── Attachment              # Polymorphic file storage
```

---

## 3. Entity-Relationship Diagram (Text)

```
User (Better-Auth)
 ├── 1:1 ── InternProfile (nik, institution, periodStart, periodEnd, status)
 │            ├── * ── InternSupervisor ── * ── SupervisorProfile (nip, field, isActive)
 │            ├── * ── Issue (title, description, status)
 │            ├── * ── Logbook (date, activity, duration, status)
 │            ├── * ── Attendance (date, checkIn, checkOut, method, status)
 │            ├── * ── GuidanceSession (topic, status)
 │            ├── * ── Assessment (period, status, finalScore)
 │            └── * ── Document (documentType, documentNumber, status)
 │
 └── 1:1 ── SupervisorProfile
              ├── * ── Issue (created issues for interns)
              ├── * ── GuidanceSession (guided sessions)
              └── * ── Assessment (given assessments)

Department
 └── * ── InternProfile (placement)
 └── * ── Issue (department context)

Attachment (polymorphic)
 └── attachableType: logbook | document | guide
 └── attachableId: references the entity UUID
```

---

## 4. Schema Details

### 4.1 Enums

| Enum | Values | Used By |
|------|--------|---------|
| `Role` | admin, hr, supervisor, intern | User |
| `InternStatus` | active, completed, withdrawn | InternProfile |
| `IssueStatus` | active, completed, cancelled | Issue |
| `LogbookStatus` | pending_review, approved, revision | Logbook |
| `AttendanceMethod` | qr, gps, manual | Attendance |
| `AttendanceStatus` | present, late, absent, permission, field_duty | Attendance |
| `GuidanceStatus` | requested, scheduled, completed, cancelled, no_show | GuidanceSession |
| `AssessmentStatus` | draft, submitted, finalized | Assessment |
| `DocumentType` | certificate, assessment_report, attendance_report, assignment_letter, completion_letter | Document, DocumentTemplate |
| `AttachableType` | logbook, document, guide | Attachment |
| `NotificationType` | info, warning, reminder, approval | Notification |

### 4.2 Core / Auth (Better-Auth)

These models are managed by Better-Auth and must not be modified except to add relation fields.

**User** — Central user account. Relations added:
- `internProfile InternProfile?` (1:1)
- `supervisorProfile SupervisorProfile?` (1:1)
- `notifications Notification[]`
- `auditLogs AuditLog[]`

**Session**, **Account**, **Verification** — Untouched Better-Auth models.

### 4.3 Audit

**AuditLog** — Append-only activity log.
- `action` — The operation performed (e.g., "intern.create", "assessment.finalize")
- `actorId` — References User who performed the action
- `targetId`, `targetType` — The affected entity
- `metadata` — JSON payload with change details
- No `updatedAt` or `deletedAt` (immutable)

### 4.4 Masters

**Department** — Bidang/divisi within BPS.
- Soft-deletable
- Referenced by InternProfile (placement) and Issue (context)

**InternProfile** — 1:1 extension of User for Intern role.
- `nik` (NIK — unique, required), `institution`, `phone`, `email`
- `periodStart`, `periodEnd` — Internship period
- `status` — active / completed / withdrawn
- `deletedAt` for soft delete

**SupervisorProfile** — 1:1 extension of User for Supervisor role.
- `nip` (NIP — unique, required), `field`, `phone`, `email`
- `maxInterns` — Maximum number of interns (default 5)
- `isActive` — Can be temporarily deactivated
- `deletedAt` for soft delete

**InternSupervisor** — Assignment junction with history tracking.
- `assignedAt`, `endedAt?`, `reason?` — Track assignment lifecycle
- Multiple rows per intern = assignment history

### 4.5 Operations

**Issue** — "Rencana Kegiatan" created by Supervisor (renamed from Task per PRD update).
- Linked to `supervisorProfileId` (creator) and optionally `internProfileId` (assignee)
- `title`, `description`, `startDate`, `endDate`, `status`
- Soft-deletable

**Logbook** — Daily activity entry by Intern.
- Linked to `internProfileId` and optionally `issueId`
- `date`, `activity`, `duration` (minutes), `status`, `notes`
- Status flow: `pending_review` → `approved` | `revision` → (resubmit) → `pending_review`
- Attachment: photos via polymorphic `Attachment`
- Soft-deletable

**Attendance** — Digital check-in/out.
- `date`, `checkIn`, `checkOut`, `status`, `method` (qr/gps/manual)
- `latitude`, `longitude` for geofence verification
- Soft-deletable

**GuidanceSession** — Bimbingan requests and records.
- `topic`, `description`, `proposedDate`, `scheduledDate`, `status`
- `outcome` — Supervisor's notes after session
- `meetingLink` — For online sessions
- Soft-deletable

**Assessment** — Structured evaluation.
- `periodStart`, `periodEnd`, `status` (draft → submitted → finalized)
- `finalScore`, `finalGrade` — Calculated after finalization
- `finalizedAt`, `finalizedBy` — Audit trail for finalization
- Has many `AssessmentComponent`
- Soft-deletable

**AssessmentComponent** — Individual scoring criteria.
- `name` — e.g., "Disiplin & Kehadiran", "Kualitas Kerja"
- `weight` — Percentage weight (default 20.0)
- `score` — 0-100 scale
- No soft delete (components are deleted with parent)

### 4.6 Documents

**Document** — Generated output documents.
- `documentType` — certificate / assessment_report / attendance_report / assignment_letter / completion_letter
- `documentNumber` — Unique, auto-generated
- `fileUrl`, `qrCode`, `metadata` — Storage, verification, and extensible data
- `status` — draft / published / archived
- Soft-deletable

**DocumentTemplate** — Configurable templates for PDF generation.
- `documentType` + `name` unique constraint
- `content` — Template markup
- `variables` — JSON array of variable names for the template

**Guide** — Internship guides and information pages.
- `title`, `description`, `isPublished`
- Attachment: PDF files via polymorphic `Attachment`
- Soft-deletable

### 4.7 System

**Notification** — In-app notification.
- `userId` → User, `title`, `body`, `type`, `isRead`, `link`
- No update or soft delete (immutable after creation)

**SystemConfig** — Key-value configuration store.
- `key` unique, `value`, `description`
- Timestamps for change tracking

### 4.8 Cross-cutting

**Attachment** — Polymorphic file storage (no Prisma-level FK relation — resolved at application layer via `attachableType` + `attachableId`).
- `attachableType` — Enum: logbook, document, guide
- `attachableId` — UUID of the owning entity
- `fileName`, `fileUrl`, `mimeType`, `fileSize`
- No soft delete (attachments cascade with parent)
- Composite index on `(attachableType, attachableId)`

---

## 5. Soft Delete Implementation

All business models (Department, InternProfile, SupervisorProfile, Issue, Logbook, Attendance, GuidanceSession, Assessment, Document, Guide) include:

```prisma
deletedAt DateTime?
```

Prisma middleware in `lib/prisma.ts` automatically appends `where: { deletedAt: null }` to `findUnique`, `findFirst`, and `findMany` queries for these models. To include deleted records, use `findFirst({ where: { deletedAt: { not: null } } })` or raw queries.

Models NOT soft-deleted:
- `AuditLog` — Append-only; never deleted
- `Notification` — Immutable; cleaned up via TTL
- `AssessmentComponent` — Cascade-deleted with parent Assessment
- `Attachment` — Cascade-deleted with parent entity
- `SystemConfig` — Configuration; manual cleanup
- Better-Auth models — Managed by Better-Auth

---

## 6. Polymorphic Attachment Pattern

```prisma
model Attachment {
  id             String          @id @default(cuid())
  attachableType AttachableType
  attachableId   String
  fileName       String
  fileUrl        String
  mimeType       String?
  fileSize       Int?
  createdAt      DateTime        @default(now())

  @@index([attachableType, attachableId])
  @@map("attachment")
}
```

Usage:
- **Logbook**: `attachableType = "logbook"`, `attachableId = logbook.id` (max 3 photos per entry)
- **Document**: `attachableType = "document"`, `attachableId = document.id` (generated PDF files)
- **Guide**: `attachableType = "guide"`, `attachableId = guide.id` (guide PDF attachments)

File storage uses Cloudinary (existing integration). The `fileUrl` stores the Cloudinary URL.

---

## 7. Naming Convention Reference

| Type | Convention | Example |
|------|-----------|---------|
| Column | camelCase | `periodStart`, `documentType` |
| Table | snake_case (via `@@map`) | `intern_profile`, `assessment_component` |
| Enum values | snake_case | `pending_review`, `field_duty` |
| Relations | camelCase | `internProfile`, `supervisorProfile` |

---

## 8. Indexing Strategy

- **Foreign keys**: Indexed on every FK column for join performance
- **Status filters**: Indexed on status columns for dashboard queries
- **Date ranges**: Indexed on `periodStart/periodEnd` on InternProfile, `date` on Logbook/Attendance
- **Composite**: `(attachableType, attachableId)` on Attachment, `(userId, isRead)` on Notification
- **Unique**: Email, username, NIK, NIP, documentNumber, config key

---

## 9. Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-07-15 | 1.0 | Initial database design — all models for F2-F15 with soft delete, polymorphic attachments, camelCase naming |
