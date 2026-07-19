import { requireAuth } from "@/helpers/guard";
import { Role } from "@/generated/prisma/enums";

export default async function LogbookPage() {
  await requireAuth([Role.admin, Role.intern]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold tracking-tight">Logbook</h1>
      <p className="text-sm text-muted-foreground">
        Catat kegiatan harian magang Anda
      </p>
    </div>
  );
}
