-- DropIndex
DROP INDEX "assessment_internProfileId_idx";

-- DropIndex
DROP INDEX "assessment_status_idx";

-- DropIndex
DROP INDEX "assessment_supervisorProfileId_idx";

-- DropIndex
DROP INDEX "attendance_date_idx";

-- DropIndex
DROP INDEX "attendance_internProfileId_idx";

-- DropIndex
DROP INDEX "attendance_status_idx";

-- DropIndex
DROP INDEX "document_documentType_idx";

-- DropIndex
DROP INDEX "document_internProfileId_idx";

-- DropIndex
DROP INDEX "guidance_session_internProfileId_idx";

-- DropIndex
DROP INDEX "guidance_session_status_idx";

-- DropIndex
DROP INDEX "guidance_session_supervisorProfileId_idx";

-- DropIndex
DROP INDEX "guide_isPublished_idx";

-- DropIndex
DROP INDEX "intern_profile_status_idx";

-- DropIndex
DROP INDEX "issue_internProfileId_idx";

-- DropIndex
DROP INDEX "issue_status_idx";

-- DropIndex
DROP INDEX "issue_supervisorProfileId_idx";

-- DropIndex
DROP INDEX "logbook_date_idx";

-- DropIndex
DROP INDEX "logbook_internProfileId_idx";

-- DropIndex
DROP INDEX "logbook_issueId_idx";

-- DropIndex
DROP INDEX "logbook_status_idx";

-- DropIndex
DROP INDEX "supervisor_profile_isActive_idx";

-- DropIndex
DROP INDEX "supervisor_profile_nip_idx";

-- CreateIndex
CREATE INDEX "assessment_internProfileId_deletedAt_idx" ON "assessment"("internProfileId", "deletedAt");

-- CreateIndex
CREATE INDEX "assessment_supervisorProfileId_deletedAt_idx" ON "assessment"("supervisorProfileId", "deletedAt");

-- CreateIndex
CREATE INDEX "assessment_status_deletedAt_idx" ON "assessment"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "attendance_internProfileId_deletedAt_idx" ON "attendance"("internProfileId", "deletedAt");

-- CreateIndex
CREATE INDEX "attendance_date_deletedAt_idx" ON "attendance"("date", "deletedAt");

-- CreateIndex
CREATE INDEX "attendance_status_deletedAt_idx" ON "attendance"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "document_internProfileId_deletedAt_idx" ON "document"("internProfileId", "deletedAt");

-- CreateIndex
CREATE INDEX "document_documentType_deletedAt_idx" ON "document"("documentType", "deletedAt");

-- CreateIndex
CREATE INDEX "guidance_session_internProfileId_deletedAt_idx" ON "guidance_session"("internProfileId", "deletedAt");

-- CreateIndex
CREATE INDEX "guidance_session_supervisorProfileId_deletedAt_idx" ON "guidance_session"("supervisorProfileId", "deletedAt");

-- CreateIndex
CREATE INDEX "guidance_session_status_deletedAt_idx" ON "guidance_session"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "guide_isPublished_deletedAt_idx" ON "guide"("isPublished", "deletedAt");

-- CreateIndex
CREATE INDEX "intern_profile_status_deletedAt_idx" ON "intern_profile"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "issue_supervisorProfileId_deletedAt_idx" ON "issue"("supervisorProfileId", "deletedAt");

-- CreateIndex
CREATE INDEX "issue_internProfileId_deletedAt_idx" ON "issue"("internProfileId", "deletedAt");

-- CreateIndex
CREATE INDEX "issue_status_deletedAt_idx" ON "issue"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "logbook_internProfileId_deletedAt_idx" ON "logbook"("internProfileId", "deletedAt");

-- CreateIndex
CREATE INDEX "logbook_issueId_deletedAt_date_idx" ON "logbook"("issueId", "deletedAt", "date" DESC);

-- CreateIndex
CREATE INDEX "logbook_date_deletedAt_idx" ON "logbook"("date", "deletedAt");

-- CreateIndex
CREATE INDEX "logbook_status_deletedAt_idx" ON "logbook"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "supervisor_profile_nip_deletedAt_idx" ON "supervisor_profile"("nip", "deletedAt");

-- CreateIndex
CREATE INDEX "supervisor_profile_isActive_deletedAt_idx" ON "supervisor_profile"("isActive", "deletedAt");
