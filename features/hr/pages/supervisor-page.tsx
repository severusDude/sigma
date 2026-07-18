"use client";

import { useState } from "react";

import { PlusIcon, UserPlusIcon, ArrowLeftRightIcon, InfoIcon } from "lucide-react";

import { SortOption } from "@/lib/types/sort";
import { Button } from "@/components/ui/button";
import { FilterCategory } from "@/lib/types/filter";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { DataTable } from "@/components/shared/data-table";
import { ResponsiveModal } from "@/components/shared/responsive-modal";

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
import { AssignDialog } from "../components/supervisor/assign-dialog";
import { ReassignAllDialog } from "../components/supervisor/reassign-all-dialog";

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
  const [reassignAllOpen, setReassignAllOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Manajemen Supervisor
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola data supervisor dan bimbingan
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setReassignAllOpen(true)} variant="outline" className="gap-2">
            <ArrowLeftRightIcon className="size-4" />
            <span className="hidden md:inline">Reassign Massal</span>
          </Button>
          <Button onClick={() => setAssignOpen(true)} variant="secondary" className="gap-2">
            <UserPlusIcon className="size-4" />
            <span className="hidden md:inline">Assign Intern</span>
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <PlusIcon className="size-4" />
            <span className="hidden md:inline">Tambah Supervisor</span>
          </Button>
        </div>
      </div>

      <Alert className="hidden md:grid">
        <InfoIcon />
        <AlertTitle>Informasi</AlertTitle>
        <AlertDescription>
          Silakan isi data supervisor dan lakukan penempatan intern pada supervisor yang tersedia.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between md:gap-2">
        <div className="w-full md:w-2/3">
          <DataTable
            columns={columns}
            data={supervisors ?? []}
            filterCategories={filterOptions}
            sortOptions={sortOptions}
          />
        </div>
        <div className="hidden md:block md:w-1/3">
          <QuickAssignCard
            interns={unassignedInterns}
            supervisors={activeSupervisors}
          />
        </div>
      </div>

      {/* Create Dialog/Drawer */}
      <ResponsiveModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Tambah Supervisor Baru"
        description="Lengkapi data supervisor"
      >
        <CreateSupervisorForm onSuccess={() => setCreateOpen(false)} />
      </ResponsiveModal>

      {/* Update Dialog/Drawer */}
      <ResponsiveModal
        open={!!updateSupervisor}
        onOpenChange={(open) => !open && setUpdateSupervisor(null)}
        title="Update Supervisor"
        description="Perbarui data supervisor"
      >
        {updateSupervisor && (
          <UpdateSupervisorForm
            supervisor={updateSupervisor}
            onSuccess={() => setUpdateSupervisor(null)}
          />
        )}
      </ResponsiveModal>

      {/* Reassign All Dialog */}
      <ReassignAllDialog
        open={reassignAllOpen}
        onClose={() => setReassignAllOpen(false)}
        supervisors={activeSupervisors}
      />

      {/* Assign Dialog */}
      <AssignDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        interns={unassignedInterns}
        supervisors={activeSupervisors}
      />

      {/* Detail Dialog */}
      <DetailDialog
        supervisorId={detailId}
        onClose={() => setDetailId(null)}
        supervisors={activeSupervisors}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        supervisor={deleteSupervisor}
        onClose={() => setDeleteSupervisor(null)}
      />
    </div>
  );
}
