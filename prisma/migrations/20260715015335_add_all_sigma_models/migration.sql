-- CreateEnum
CREATE TYPE "InternStatus" AS ENUM ('active', 'completed', 'withdrawn');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('active', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "LogbookStatus" AS ENUM ('pending_review', 'approved', 'revision');

-- CreateEnum
CREATE TYPE "AttendanceMethod" AS ENUM ('qr', 'gps', 'manual');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'late', 'absent', 'permission', 'field_duty');

-- CreateEnum
CREATE TYPE "GuidanceStatus" AS ENUM ('requested', 'scheduled', 'completed', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('draft', 'submitted', 'finalized');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('certificate', 'assessment_report', 'attendance_report', 'assignment_letter', 'completion_letter');

-- CreateEnum
CREATE TYPE "AttachableType" AS ENUM ('logbook', 'document', 'guide');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('info', 'warning', 'reminder', 'approval');

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetId" TEXT,
    "targetType" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intern_profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "InternStatus" NOT NULL DEFAULT 'active',
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "intern_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supervisor_profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nip" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "maxInterns" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "supervisor_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intern_supervisor" (
    "id" TEXT NOT NULL,
    "internProfileId" TEXT NOT NULL,
    "supervisorProfileId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intern_supervisor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue" (
    "id" TEXT NOT NULL,
    "supervisorProfileId" TEXT NOT NULL,
    "internProfileId" TEXT,
    "departmentId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "IssueStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logbook" (
    "id" TEXT NOT NULL,
    "internProfileId" TEXT NOT NULL,
    "issueId" TEXT,
    "date" DATE NOT NULL,
    "activity" TEXT NOT NULL,
    "duration" SMALLINT NOT NULL,
    "status" "LogbookStatus" NOT NULL DEFAULT 'pending_review',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "logbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "internProfileId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "status" "AttendanceStatus" NOT NULL DEFAULT 'present',
    "method" "AttendanceMethod" NOT NULL DEFAULT 'qr',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guidance_session" (
    "id" TEXT NOT NULL,
    "internProfileId" TEXT NOT NULL,
    "supervisorProfileId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT,
    "proposedDate" TIMESTAMP(3),
    "scheduledDate" TIMESTAMP(3),
    "status" "GuidanceStatus" NOT NULL DEFAULT 'requested',
    "outcome" TEXT,
    "meetingLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "guidance_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment" (
    "id" TEXT NOT NULL,
    "internProfileId" TEXT NOT NULL,
    "supervisorProfileId" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'draft',
    "finalScore" DOUBLE PRECISION,
    "finalGrade" TEXT,
    "finalizedAt" TIMESTAMP(3),
    "finalizedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_component" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    "score" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" TEXT NOT NULL,
    "internProfileId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "qrCode" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_template" (
    "id" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "guide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "type" "NotificationType" NOT NULL DEFAULT 'info',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachment" (
    "id" TEXT NOT NULL,
    "attachableType" "AttachableType" NOT NULL,
    "attachableId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE INDEX "audit_log_actorId_idx" ON "audit_log"("actorId");

-- CreateIndex
CREATE INDEX "audit_log_createdAt_idx" ON "audit_log"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "intern_profile_userId_key" ON "intern_profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "intern_profile_nik_key" ON "intern_profile"("nik");

-- CreateIndex
CREATE INDEX "intern_profile_status_idx" ON "intern_profile"("status");

-- CreateIndex
CREATE INDEX "intern_profile_periodStart_periodEnd_idx" ON "intern_profile"("periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "supervisor_profile_userId_key" ON "supervisor_profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "supervisor_profile_nip_key" ON "supervisor_profile"("nip");

-- CreateIndex
CREATE INDEX "supervisor_profile_nip_idx" ON "supervisor_profile"("nip");

-- CreateIndex
CREATE INDEX "supervisor_profile_isActive_idx" ON "supervisor_profile"("isActive");

-- CreateIndex
CREATE INDEX "intern_supervisor_internProfileId_idx" ON "intern_supervisor"("internProfileId");

-- CreateIndex
CREATE INDEX "intern_supervisor_supervisorProfileId_idx" ON "intern_supervisor"("supervisorProfileId");

-- CreateIndex
CREATE INDEX "issue_supervisorProfileId_idx" ON "issue"("supervisorProfileId");

-- CreateIndex
CREATE INDEX "issue_internProfileId_idx" ON "issue"("internProfileId");

-- CreateIndex
CREATE INDEX "issue_status_idx" ON "issue"("status");

-- CreateIndex
CREATE INDEX "logbook_internProfileId_idx" ON "logbook"("internProfileId");

-- CreateIndex
CREATE INDEX "logbook_issueId_idx" ON "logbook"("issueId");

-- CreateIndex
CREATE INDEX "logbook_date_idx" ON "logbook"("date");

-- CreateIndex
CREATE INDEX "logbook_status_idx" ON "logbook"("status");

-- CreateIndex
CREATE INDEX "attendance_internProfileId_idx" ON "attendance"("internProfileId");

-- CreateIndex
CREATE INDEX "attendance_date_idx" ON "attendance"("date");

-- CreateIndex
CREATE INDEX "attendance_status_idx" ON "attendance"("status");

-- CreateIndex
CREATE INDEX "guidance_session_internProfileId_idx" ON "guidance_session"("internProfileId");

-- CreateIndex
CREATE INDEX "guidance_session_supervisorProfileId_idx" ON "guidance_session"("supervisorProfileId");

-- CreateIndex
CREATE INDEX "guidance_session_status_idx" ON "guidance_session"("status");

-- CreateIndex
CREATE INDEX "assessment_internProfileId_idx" ON "assessment"("internProfileId");

-- CreateIndex
CREATE INDEX "assessment_supervisorProfileId_idx" ON "assessment"("supervisorProfileId");

-- CreateIndex
CREATE INDEX "assessment_status_idx" ON "assessment"("status");

-- CreateIndex
CREATE INDEX "assessment_component_assessmentId_idx" ON "assessment_component"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "document_documentNumber_key" ON "document"("documentNumber");

-- CreateIndex
CREATE INDEX "document_internProfileId_idx" ON "document"("internProfileId");

-- CreateIndex
CREATE INDEX "document_documentType_idx" ON "document"("documentType");

-- CreateIndex
CREATE INDEX "document_documentNumber_idx" ON "document"("documentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "document_template_documentType_name_key" ON "document_template"("documentType", "name");

-- CreateIndex
CREATE INDEX "guide_isPublished_idx" ON "guide"("isPublished");

-- CreateIndex
CREATE INDEX "notification_userId_isRead_idx" ON "notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notification_createdAt_idx" ON "notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- CreateIndex
CREATE INDEX "attachment_attachableType_attachableId_idx" ON "attachment"("attachableType", "attachableId");

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intern_profile" ADD CONSTRAINT "intern_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intern_profile" ADD CONSTRAINT "intern_profile_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisor_profile" ADD CONSTRAINT "supervisor_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intern_supervisor" ADD CONSTRAINT "intern_supervisor_internProfileId_fkey" FOREIGN KEY ("internProfileId") REFERENCES "intern_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intern_supervisor" ADD CONSTRAINT "intern_supervisor_supervisorProfileId_fkey" FOREIGN KEY ("supervisorProfileId") REFERENCES "supervisor_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue" ADD CONSTRAINT "issue_supervisorProfileId_fkey" FOREIGN KEY ("supervisorProfileId") REFERENCES "supervisor_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue" ADD CONSTRAINT "issue_internProfileId_fkey" FOREIGN KEY ("internProfileId") REFERENCES "intern_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue" ADD CONSTRAINT "issue_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logbook" ADD CONSTRAINT "logbook_internProfileId_fkey" FOREIGN KEY ("internProfileId") REFERENCES "intern_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logbook" ADD CONSTRAINT "logbook_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_internProfileId_fkey" FOREIGN KEY ("internProfileId") REFERENCES "intern_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guidance_session" ADD CONSTRAINT "guidance_session_internProfileId_fkey" FOREIGN KEY ("internProfileId") REFERENCES "intern_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guidance_session" ADD CONSTRAINT "guidance_session_supervisorProfileId_fkey" FOREIGN KEY ("supervisorProfileId") REFERENCES "supervisor_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment" ADD CONSTRAINT "assessment_internProfileId_fkey" FOREIGN KEY ("internProfileId") REFERENCES "intern_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment" ADD CONSTRAINT "assessment_supervisorProfileId_fkey" FOREIGN KEY ("supervisorProfileId") REFERENCES "supervisor_profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_component" ADD CONSTRAINT "assessment_component_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_internProfileId_fkey" FOREIGN KEY ("internProfileId") REFERENCES "intern_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
