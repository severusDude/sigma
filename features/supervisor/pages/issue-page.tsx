"use client";

import { useState, useMemo } from "react";
import { PlusIcon, FileTextIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { getIssues } from "../actions/issue-actions";
import type { Issue } from "../types/issue-types";
import { IssueCard } from "../components/issue/issue-card";
import { FiltersBar } from "../components/issue/filters-bar";
import { CreateIssueForm } from "../components/issue/create-form";
import { UpdateIssueForm } from "../components/issue/update-form";
import { DetailDialog } from "../components/issue/detail-dialog";
import { DeleteDialog } from "../components/issue/delete-dialog";

interface InternOption {
  id: string;
  name: string;
}

interface IssuePageProps {
  internOptions: InternOption[];
}

export default function IssuePage({ internOptions }: IssuePageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInterns, setSelectedInterns] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [viewingIssueId, setViewingIssueId] = useState<string | null>(null);
  const [deletingIssue, setDeletingIssue] = useState<Issue | null>(null);

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ["issues"],
    queryFn: async () => {
      const res = await getIssues();
      if (!res.success) throw new Error(res.error);
      return res.data ?? [];
    },
  });

  const filtered = useMemo(() => {
    let result = issues;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((issue) =>
        issue.title.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((issue) => issue.status === statusFilter);
    }

    if (selectedInterns.length > 0) {
      result = result.filter(
        (issue) =>
          issue.internProfileId &&
          selectedInterns.includes(issue.internProfileId),
      );
    }

    return result;
  }, [issues, searchQuery, statusFilter, selectedInterns]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Rencana Kegiatan
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola rencana kegiatan untuk intern bimbingan
          </p>
        </div>
        <Button className="shrink-0 space-x-2" onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-4" />
          <span>Buat Baru</span>
        </Button>
      </header>

      <FiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        selectedInterns={selectedInterns}
        onInternsChange={setSelectedInterns}
        internOptions={internOptions}
      />

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-16 rounded animate-pulse bg-muted" />
                <div className="size-7 rounded animate-pulse bg-muted" />
              </div>
              <div className="h-5 w-full rounded animate-pulse bg-muted" />
              <div className="h-5 w-3/4 rounded animate-pulse bg-muted" />
              <div className="space-y-2.5 pt-2">
                <div className="h-4 w-32 rounded animate-pulse bg-muted" />
                <div className="h-4 w-40 rounded animate-pulse bg-muted" />
                <div className="h-4 w-24 rounded animate-pulse bg-muted" />
              </div>
              <div className="h-9 w-full rounded animate-pulse bg-muted" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <FileTextIcon className="size-12 text-muted-foreground/40" />
          <div>
            {searchQuery || statusFilter !== "all" || selectedInterns.length > 0 ? (
              <>
                <p className="font-medium">Tidak ada hasil</p>
                <p className="text-sm text-muted-foreground">
                  Coba ubah filter atau kata kunci pencarian
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">Belum ada rencana kegiatan</p>
                <p className="text-sm text-muted-foreground">
                  Buat rencana kegiatan pertama untuk intern bimbingan
                </p>
                <Button
                  variant="outline"
                  className="mt-2 space-x-2"
                  onClick={() => setCreateOpen(true)}
                >
                  <PlusIcon className="size-4" />
                  <span>Buat Rencana Kegiatan</span>
                </Button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onView={(iss) => setViewingIssueId(iss.id)}
              onEdit={(iss) => setEditingIssue(iss)}
              onDelete={(iss) => setDeletingIssue(iss)}
            />
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Rencana Kegiatan</DialogTitle>
            <DialogDescription>
              Buat rencana kegiatan baru untuk intern bimbingan
            </DialogDescription>
          </DialogHeader>
          <CreateIssueForm
            internOptions={internOptions}
            onSuccess={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingIssue}
        onOpenChange={(open) => !open && setEditingIssue(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Rencana Kegiatan</DialogTitle>
            <DialogDescription>
              Ubah rencana kegiatan yang sudah ada
            </DialogDescription>
          </DialogHeader>
          {editingIssue && (
            <UpdateIssueForm
              issue={editingIssue}
              internOptions={internOptions}
              onSuccess={() => setEditingIssue(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <DetailDialog
        issueId={viewingIssueId}
        onClose={() => setViewingIssueId(null)}
      />

      <DeleteDialog
        issue={deletingIssue}
        onClose={() => setDeletingIssue(null)}
      />
    </div>
  );
}
