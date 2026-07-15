import { createSoftDeleteExtension } from "@candoimage/prisma-extension-soft-delete";

const SOFT_DELETE_MODELS = [
  "Department",
  "InternProfile",
  "SupervisorProfile",
  "Issue",
  "Logbook",
  "Attendance",
  "GuidanceSession",
  "Assessment",
  "Document",
  "Guide",
] as const;

const modelConfigs: Record<string, boolean> = {};
for (const name of SOFT_DELETE_MODELS) {
  modelConfigs[name] = true;
}

const defaultConfig = {
  field: "deletedAt" as const,
  createValue: (deleted: boolean) => (deleted ? new Date() : null),
};

export function createSoftDeleteExt() {
  return createSoftDeleteExtension({
    models: modelConfigs,
    defaultConfig,
  });
}
