"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { NotebookPenIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CtaCardProps {
  onCreate: () => void;
}

export function CtaCard({ onCreate }: CtaCardProps) {
  const today = format(new Date(), "EEEE, d MMMM yyyy", { locale: id });

  return (
    <Card className="border-2 border-dashed border-outline-variant/50 hover:border-primary transition-colors ring-0">
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <NotebookPenIcon className="size-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Logbook Hari Ini</p>
          <p className="text-xs text-muted-foreground">{today}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Anda belum mengisi logbook hari ini. Yuk, catat kegiatan magang Anda!
          </p>
        </div>
        <Button onClick={onCreate} className="gap-2 shrink-0">
          <PlusIcon className="size-4" />
          Tambah Logbook
        </Button>
      </CardContent>
    </Card>
  );
}
