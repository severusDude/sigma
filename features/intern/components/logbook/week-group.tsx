"use client";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { ReactNode } from "react";

interface WeekGroupProps {
  value: string;
  label: string;
  children: ReactNode;
}

export function WeekGroup({ value, label, children }: WeekGroupProps) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="hover:no-underline hover:bg-card/50 rounded-md px-3 py-2.5">
        <h3 className="text-sm font-semibold tracking-wider uppercase">
          {label}
        </h3>
      </AccordionTrigger>
      <AccordionContent className="pt-2">
        <div className="space-y-3">{children}</div>
      </AccordionContent>
    </AccordionItem>
  );
}
