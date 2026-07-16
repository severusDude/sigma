"use client";

import { useState } from "react";

import { PlusIcon } from "lucide-react";

import { SortOption } from "@/lib/types/sort";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { FilterCategory } from "@/lib/types/filter";
import { InternStatus } from "@/generated/prisma/enums";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DataTable } from "@/components/shared/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { Intern } from "../types/intern-types";
import { createColumns } from "../components/intern/columns";
import { DetailDialog } from "../components/intern/detail-dialog";
import { DeleteDialog } from "../components/intern/delete-dialog";
import { CreateInternForm } from "../components/intern/create-form";
import { UpdateInternForm } from "../components/intern/update-form";

interface InternPageProps {
  interns: Intern[];
  departments: { id: string; name: string }[];
}

const filterOptions: FilterCategory[] = [
  {
    id: "status",
    label: "Status",
    options: [
      { label: "Aktif", value: InternStatus.active },
      { label: "Selesai", value: InternStatus.completed },
      { label: "Ditarik", value: InternStatus.withdrawn },
    ],
  },
];

const sortOptions: SortOption[] = [
  { id: "name", label: "Nama" },
  { id: "institution", label: "Institusi" },
  { id: "period", label: "Periode" },
  { id: "supervisor", label: "Supervisor" },
  { id: "status", label: "Status" },
];

export default function InternPage({ interns, departments }: InternPageProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [updateIntern, setUpdateIntern] = useState<Intern | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteIntern, setDeleteIntern] = useState<Intern | null>(null);

  const columns = createColumns({
    onView: (row) => setDetailId(row.id),
    onUpdate: (row) => setUpdateIntern(row),
    onDelete: (row) => setDeleteIntern(row),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Manajemen Intern
          </h1>
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
        data={interns ?? []}
        filterCategories={filterOptions}
        sortOptions={sortOptions}
      />

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="h-screen max-w-screen md:min-w-[calc(100%-52rem)] md:h-fit gap-0">
          <DialogHeader className="sticky pb-4 -mx-6 space-y-4 border-b">
            <div className="px-6">
              <DialogTitle className="text-2xl font-semibold tracking-tight text-primary">
                Tambah Intern Baru
              </DialogTitle>
              <DialogDescription>
                Lengkapi data diri peserta magang
              </DialogDescription>
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(100vh-12rem)] -mr-6 pr-6">
            <div className="pt-6">
              <CreateInternForm
                departmentOptions={departments}
                onSuccess={() => setCreateOpen(false)}
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog
        open={!!updateIntern}
        onOpenChange={(open) => !open && setUpdateIntern(null)}
      >
        <DialogContent className="h-screen max-w-screen md:min-w-[calc(100%-52rem)] md:h-fit gap-0">
          <DialogHeader className="sticky pb-4 -mx-6 space-y-4 border-b">
            <div className="px-6">
              <DialogTitle className="text-2xl font-semibold tracking-tight text-primary">
                Update Intern
              </DialogTitle>
              <DialogDescription>
                Perbarui data peserta magang
              </DialogDescription>
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(100vh-12rem)] -mr-6 pr-6">
            <div className="pt-6">
              {updateIntern && (
                <UpdateInternForm
                  intern={updateIntern}
                  departmentOptions={departments}
                  onSuccess={() => setUpdateIntern(null)}
                />
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <DetailDialog internId={detailId} onClose={() => setDetailId(null)} />

      {/* Delete Dialog */}
      <DeleteDialog
        intern={deleteIntern}
        onClose={() => setDeleteIntern(null)}
      />
    </div>
  );
}
