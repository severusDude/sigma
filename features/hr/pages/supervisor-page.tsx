"use client";

import { useState } from "react";

import { PlusIcon } from "lucide-react";

import { SortOption } from "@/lib/types/sort";
import { Button } from "@/components/ui/button";
import { FilterCategory } from "@/lib/types/filter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DataTable } from "@/components/shared/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type {
  Supervisor,
  UnassignedIntern,
  ActiveSupervisorOption,
} from "../types/supervisor-types";
import { createColumns } from "../components/supervisor/columns";
import { DetailDialog } from "../components/supervisor/detail-dialog";
import { DeleteDialog } from "../components/supervisor/delete-dialog";
import { CreateSupervisorForm } from "../components/supervisor/create-form";
import { UpdateSupervisorForm } from "../components/supervisor/update-form";
import { QuickAssignCard } from "../components/supervisor/quick-assign-card";

interface SupervisorPageProps {
  supervisors: Supervisor[];
  unassignedInterns: UnassignedIntern[];
  activeSupervisors: ActiveSupervisorOption[];
}

const filterOptions: FilterCategory[] = [
  {
    id: "isActive",
    label: "Status",
    options: [
      { label: "Aktif", value: "true" },
      { label: "Nonaktif", value: "false" },
    ],
  },
];

const sortOptions: SortOption[] = [
  { id: "name", label: "Nama" },
  { id: "field", label: "Bidang" },
  { id: "internCount", label: "Jumlah Intern" },
  { id: "isActive", label: "Status" },
];

export default function SupervisorPage({
  supervisors,
  unassignedInterns,
  activeSupervisors,
}: SupervisorPageProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [updateSupervisor, setUpdateSupervisor] = useState<Supervisor | null>(
    null,
  );
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteSupervisor, setDeleteSupervisor] = useState<Supervisor | null>(
    null,
  );

  const columns = createColumns({
    onView: (row) => setDetailId(row.id),
    onUpdate: (row) => setUpdateSupervisor(row),
    onDelete: (row) => setDeleteSupervisor(row),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Manajemen Supervisor
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola data supervisor dan bimbingan
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <PlusIcon className="size-4" />
          Tambah Supervisor
        </Button>
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="w-2/3">
          <DataTable
            columns={columns}
            data={supervisors ?? []}
            filterCategories={filterOptions}
            sortOptions={sortOptions}
          />
        </div>
        <div className="w-1/3">
          <QuickAssignCard
            interns={unassignedInterns}
            supervisors={activeSupervisors}
          />
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="h-screen max-w-screen md:min-w-[calc(100%-32rem)] md:h-fit gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 space-y-1 border-b">
            <DialogTitle className="text-2xl font-semibold tracking-tight text-primary">
              Tambah Supervisor Baru
            </DialogTitle>
            <DialogDescription>Lengkapi data supervisor</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(100vh-12rem)]">
            <div className="px-6 py-6">
              <CreateSupervisorForm onSuccess={() => setCreateOpen(false)} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog
        open={!!updateSupervisor}
        onOpenChange={(open) => !open && setUpdateSupervisor(null)}
      >
        <DialogContent className="h-screen max-w-screen md:min-w-[calc(100%-32rem)] md:h-fit gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 space-y-1 border-b">
            <DialogTitle className="text-2xl font-semibold tracking-tight text-primary">
              Update Supervisor
            </DialogTitle>
            <DialogDescription>Perbarui data supervisor</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(100vh-12rem)]">
            <div className="px-6 py-6">
              {updateSupervisor && (
                <UpdateSupervisorForm
                  supervisor={updateSupervisor}
                  onSuccess={() => setUpdateSupervisor(null)}
                />
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <DetailDialog supervisorId={detailId} onClose={() => setDetailId(null)} />

      {/* Delete Dialog */}
      <DeleteDialog
        supervisor={deleteSupervisor}
        onClose={() => setDeleteSupervisor(null)}
      />
    </div>
  );
}
