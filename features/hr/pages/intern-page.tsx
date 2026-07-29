"use client";

import { useState } from "react";

import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { SortOption } from "@/lib/types/sort";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { deactivateIntern } from "../actions/intern-actions";
import { DetailDialog } from "../components/intern/detail-dialog";
import { DeleteDialog } from "../components/intern/delete-dialog";
import { CreateInternForm } from "../components/intern/create-form";
import { UpdateInternForm } from "../components/intern/update-form";
import { ChangePasswordDialog } from "../components/shared/change-password-dialog";

interface InternPageProps {
  interns: Intern[];
  teams: { id: string; name: string }[];
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

export default function InternPage({ interns, teams }: InternPageProps) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [updateIntern, setUpdateIntern] = useState<Intern | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteIntern, setDeleteIntern] = useState<Intern | null>(null);
  const [changePasswordUser, setChangePasswordUser] = useState<Intern | null>(null);

  const { mutateAsync: doDeactivate } = useMutation({
    mutationKey: ["deactivate-intern"],
    mutationFn: async (intern: Intern) => {
      const res = await deactivateIntern(intern.id);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interns"] });
    },
  });

  async function handleDeactivate(intern: Intern) {
    if (intern.internProfile?.status !== "active") {
      toast.error("Intern sudah tidak aktif");
      return;
    }

    const confirmed = window.confirm(
      `Nonaktifkan intern "${intern.name}"?\n\nStatus akan berubah menjadi "Ditarik" dan akun tidak bisa login.`,
    );
    if (!confirmed) return;

    const promise = doDeactivate(intern);
    toast.promise(promise, {
      loading: "Menonaktifkan intern...",
      success: "Intern berhasil dinonaktifkan",
      error: (err) =>
        err instanceof Error ? err.message : "Gagal menonaktifkan intern",
    });
  }

  const columns = createColumns({
    onView: (row) => setDetailId(row.id),
    onUpdate: (row) => setUpdateIntern(row),
    onDelete: (row) => setDeleteIntern(row),
    onDeactivate: handleDeactivate,
    onChangePassword: (row) => setChangePasswordUser(row),
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
          <DialogHeader className="sticky pb-4 -mx-4 space-y-4 border-b">
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
                teamOptions={teams}
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
          <DialogHeader className="sticky pb-4 -mx-4 space-y-4 border-b">
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
                  teamOptions={teams}
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

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        userId={changePasswordUser?.id ?? ""}
        userName={changePasswordUser?.name ?? ""}
        open={!!changePasswordUser}
        onOpenChange={(open) => { if (!open) setChangePasswordUser(null); }}
      />
    </div>
  );
}
