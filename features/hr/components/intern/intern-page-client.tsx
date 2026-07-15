"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable } from "@/components/shared/data-table";
import { getInterns } from "../../actions/intern-actions";
import { createColumns } from "./columns";
import { CreateInternForm } from "./create-form";
import { UpdateInternForm } from "./update-form";
import { DetailDialog } from "./detail-dialog";
import { DeleteDialog } from "./delete-dialog";
import type { InternRow } from "../../types/intern-types";
import type { InternWithRelations } from "../../types/intern-types";

interface InternClientPageProps {
  departments: { id: string; name: string }[];
}

export function InternClientPage({ departments }: InternClientPageProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editIntern, setEditIntern] = useState<InternWithRelations | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteIntern, setDeleteIntern] = useState<InternRow | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["interns"],
    queryFn: async () => {
      const res = await getInterns();
      if (!res.success) throw new Error(res.error);
      return res.data ?? [];
    },
  });

  const columns = createColumns({
    onView: (row) => setDetailId(row.id),
    onEdit: (row) => setEditIntern(row.internProfile),
    onDelete: (row) => setDeleteIntern(row),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Intern</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data peserta magang
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <PlusIcon className="size-4" />
          Tambah Intern
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data ?? []}
        filterCategories={[
          {
            id: "status",
            label: "Status",
            options: [
              { label: "Aktif", value: "active" },
              { label: "Selesai", value: "completed" },
              { label: "Ditarik", value: "withdrawn" },
            ],
          },
        ]}
      />

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Intern Baru</DialogTitle>
          </DialogHeader>
          <CreateInternForm
            departmentOptions={departments}
            onSuccess={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editIntern} onOpenChange={(open) => !open && setEditIntern(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Intern</DialogTitle>
          </DialogHeader>
          {editIntern && (
            <UpdateInternForm
              intern={editIntern}
              departmentOptions={departments}
              onSuccess={() => setEditIntern(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <DetailDialog internId={detailId} onClose={() => setDetailId(null)} />

      {/* Delete Dialog */}
      <DeleteDialog intern={deleteIntern} onClose={() => setDeleteIntern(null)} />
    </div>
  );
}
