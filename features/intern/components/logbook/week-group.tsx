"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronDownIcon } from "lucide-react";
import type { ReactNode } from "react";

interface WeekGroupProps {
  label: string;
  children: ReactNode;
}

export function WeekGroup({ label, children }: WeekGroupProps) {
  const getWeekRange = (targetDate = new Date()) => {
    const date = new Date(targetDate);
    const day = date.getDay(); // 0 is Sunday, 1 is Monday, etc.

    // If today is Sunday (0), Monday was 6 days ago.
    // Otherwise, calculate the distance back to Monday.
    const diffToMonday = day === 0 ? -6 : 1 - day;

    // Set to Monday at midnight
    const start = new Date(date);
    start.setDate(date.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);

    // Set to Sunday at the end of the day (Monday + 6 days)
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  return (
    <Accordion className="max-w-full space-y-3 overflow-x-clip">
      <AccordionItem>
        <AccordionTrigger className="flex items-center justify-between gap-2 mb-2 hover:no-underline hover:bg-card/50">
          <div className="flex items-center justify-start gap-1">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-nowrap">
              {label}
            </h3>
            <span className="text-muted-foreground text-nowrap">
              (
              {getWeekRange().start.toLocaleDateString("id-ID", {
                month: "long",
                day: "numeric",
              })}{" "}
              -
              {getWeekRange().end.toLocaleDateString("id-ID", {
                month: "long",
                day: "numeric",
              })}
              )
            </span>
          </div>
          <Separator orientation="horizontal" className="flex flex-1" />
        </AccordionTrigger>
        <AccordionContent className="space-y-3">{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
