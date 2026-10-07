"use client";

import { useState } from "react";

import { Users, FileClock, CircleCheck } from "lucide-react";

import { SortOption } from "@/lib/types/sort";
import { FilterCategory } from "@/lib/types/filter";
import { InternStatus } from "@/generated/prisma/enums";
import { DataTable } from "@/components/shared/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  StatBlock,
  StatContent,
  StatDescription,
  StatHeader,
  StatIcon,
  StatMain,
  StatTitle,
  StatValue,
} from "@/components/shared/stat-block";

import type { SupervisedIntern } from "../types/intern-types";
import { createColumns } from "../components/intern/columns";
import { DetailDialog } from "../components/intern/detail-dialog";

interface InternPageProps {
  active: SupervisedIntern[];
  history: SupervisedIntern[];
}

const filterOptions: FilterCategory<SupervisedIntern>[] = [
  {
    id: "internStatus",
    label: "Status",
    options: [
      { label: "Aktif", value: InternStatus.active },
      { label: "Selesai", value: InternStatus.completed },
      { label: "Ditarik", value: InternStatus.withdrawn },
    ],
  },
];

const sortOptions: SortOption<SupervisedIntern>[] = [
  { id: "name", label: "Nama" },
  { id: "institution", label: "Institusi" },
  { id: "periodStart", label: "Periode" },
];

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export default function InternPage({ active, history }: InternPageProps) {
  const [detailId, setDetailId] = useState<string | null>(null);

  const columns = createColumns({
    onView: (row) => setDetailId(row.internProfileId),
  });

  const selected =
    [...active, ...history].find((i) => i.internProfileId === detailId) ??
    null;

  const pendingReview = active.reduce((sum, i) => sum + i.pendingLogbooks, 0);
  const totalApproved = active.reduce((sum, i) => sum + i.approvedLogbooks, 0);
  const totalLogbooks = active.reduce((sum, i) => sum + i.totalLogbooks, 0);
  const avgCompliance =
    totalLogbooks > 0 ? Math.round((totalApproved / totalLogbooks) * 100) : 0;

  if (active.length === 0 && history.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            Intern Bimbingan
          </h1>
          <p className="text-sm text-muted-foreground">
            Daftar peserta magang yang Anda bimbing
          </p>
        </header>
        <EmptyState message="Belum ada intern bimbingan. Hubungi HR untuk penempatan." />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0 max-h-[calc(100vh-5rem)] overflow-y-auto mx-auto space-y-8 pr-2">
      <div className="space-y-6 contents">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            Intern Bimbingan
          </h1>
          <p className="text-sm text-muted-foreground">
            Daftar peserta magang yang Anda bimbing
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatBlock mode="single" data={{ value: active.length }}>
            <StatHeader>
              <StatIcon icon={<Users className="w-5 h-5" />} />
              <div>
                <StatTitle>Intern Aktif</StatTitle>
                <StatDescription>Sedang dibimbing</StatDescription>
              </div>
            </StatHeader>
            <StatContent>
              <StatMain>
                <StatValue />
              </StatMain>
            </StatContent>
          </StatBlock>

          <StatBlock mode="single" data={{ value: pendingReview }}>
            <StatHeader>
              <StatIcon icon={<FileClock className="w-5 h-5" />} />
              <div>
                <StatTitle>Menunggu Review</StatTitle>
                <StatDescription>Logbook perlu ditinjau</StatDescription>
              </div>
            </StatHeader>
            <StatContent>
              <StatMain>
                <StatValue />
              </StatMain>
            </StatContent>
          </StatBlock>

          <StatBlock mode="single" data={{ value: avgCompliance }}>
            <StatHeader>
              <StatIcon icon={<CircleCheck className="w-5 h-5" />} />
              <div>
                <StatTitle>Kepatuhan Logbook</StatTitle>
                <StatDescription>Persen disetujui dari total</StatDescription>
              </div>
            </StatHeader>
            <StatContent>
              <StatMain>
                <StatValue />
              </StatMain>
            </StatContent>
          </StatBlock>
        </div>

        <Tabs defaultValue="aktif">
          <TabsList>
            <TabsTrigger value="aktif">Aktif ({active.length})</TabsTrigger>
            <TabsTrigger value="riwayat">
              Riwayat ({history.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="aktif" className="mt-4">
            {active.length === 0 ? (
              <EmptyState message="Tidak ada intern aktif saat ini." />
            ) : (
              <DataTable<SupervisedIntern, unknown>
                columns={columns}
                data={active}
                filterCategories={filterOptions}
                sortOptions={sortOptions}
              />
            )}
          </TabsContent>

          <TabsContent value="riwayat" className="mt-4">
            {history.length === 0 ? (
              <EmptyState message="Belum ada riwayat bimbingan." />
            ) : (
              <DataTable<SupervisedIntern, unknown>
                columns={columns}
                data={history}
                filterCategories={filterOptions}
                sortOptions={sortOptions}
              />
            )}
          </TabsContent>
        </Tabs>

        <DetailDialog
          intern={selected}
          onClose={() => setDetailId(null)}
        />
      </div>
    </div>
  );
}
