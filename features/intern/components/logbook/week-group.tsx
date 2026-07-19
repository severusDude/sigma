"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import type { ReactNode } from "react";

interface WeekGroupProps {
  value: string;
  label: string;
  rangeStart?: Date;
  rangeEnd?: Date;
  children: ReactNode;
}

export function WeekGroup({ value, label, rangeStart, rangeEnd, children }: WeekGroupProps) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="hover:no-underline hover:bg-card/50 rounded-md py-2.5 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-semibold tracking-wider uppercase text-nowrap">
            {label}
          </h3>
          {rangeStart && rangeEnd && (
            <span className="text-xs text-muted-foreground text-nowrap">
              {format(rangeStart, "d MMM", { locale: id })} - {format(rangeEnd, "d MMM", { locale: id })}
            </span>
          )}
        </div>
        <Separator orientation="horizontal" className="flex-1" />
      </AccordionTrigger>
      <AccordionContent className="pt-2">
        <div className="space-y-3">{children}</div>
      </AccordionContent>
    </AccordionItem>
  );
}
