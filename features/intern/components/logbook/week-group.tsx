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

export function WeekGroup({
  value,
  label,
  rangeStart,
  rangeEnd,
  children,
}: WeekGroupProps) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="hover:no-underline hover:bg-card/50 rounded-md py-2.5 gap-2 flex items-center">
        <div className="flex items-center min-w-0 gap-2">
          <h3 className="text-sm font-semibold tracking-wider uppercase text-nowrap">
            {label}
          </h3>
          {rangeStart && rangeEnd && (
            <span className="text-xs text-muted-foreground text-nowrap">
              {format(rangeStart, "d MMM", { locale: id })} -{" "}
              {format(rangeEnd, "d MMM", { locale: id })}
            </span>
          )}
        </div>
        <Separator orientation="horizontal" className="flex-1" />
      </AccordionTrigger>
      <AccordionContent className="pt-2">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">{children}</div>
      </AccordionContent>
    </AccordionItem>
  );
}
