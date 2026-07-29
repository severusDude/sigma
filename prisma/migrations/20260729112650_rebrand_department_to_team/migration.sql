-- DropForeignKey
ALTER TABLE "intern_profile" DROP CONSTRAINT IF EXISTS "intern_profile_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "issue" DROP CONSTRAINT IF EXISTS "issue_departmentId_fkey";

-- Rename department table to team
ALTER TABLE "department" RENAME TO "team";

-- Rename FK columns in intern_profile and issue
ALTER TABLE "intern_profile" RENAME COLUMN "departmentId" TO "teamId";
ALTER TABLE "issue" RENAME COLUMN "departmentId" TO "teamId";

-- AlterTable: add teamId to supervisor_profile
ALTER TABLE "supervisor_profile" ADD COLUMN "teamId" TEXT;

-- Custom SupervisorProfile data migration
-- Ensure UMUM team exists (from department data if present, or create placeholder)

-- If UMUM still doesn't exist (no department named UMUM), create it
INSERT INTO "team" (id, name, description, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'UMUM', NULL, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "team" WHERE name = 'UMUM');

-- Set all existing supervisors to UMUM team
UPDATE "supervisor_profile" SET "teamId" = (SELECT id FROM "team" WHERE name = 'UMUM');

-- Make teamId NOT NULL after data migration
ALTER TABLE "supervisor_profile" ALTER COLUMN "teamId" SET NOT NULL;

-- Add foreign key constraint for supervisor_profile
ALTER TABLE "supervisor_profile" ADD CONSTRAINT "supervisor_profile_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "team"(id) ON DELETE RESTRICT;

-- Drop the old field column
ALTER TABLE "supervisor_profile" DROP COLUMN IF EXISTS "field";

-- AddForeignKey for intern_profile
ALTER TABLE "intern_profile" ADD CONSTRAINT "intern_profile_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "team"(id) ON DELETE SET NULL;

-- AddForeignKey for issue
ALTER TABLE "issue" ADD CONSTRAINT "issue_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "team"(id) ON DELETE SET NULL;

