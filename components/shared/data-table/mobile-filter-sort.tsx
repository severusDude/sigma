"use client";

import { useState } from "react";

import { ArrowDownAZ, ArrowUpAZ, Filter, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ActiveFilter, FilterCategory } from "@/lib/types/filter";
import type { ActiveSort, SortDirection, SortOption } from "@/lib/types/sort";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ─── Chip ─────────────────────────────────────────────────────────────────────

interface ChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function Chip({ label, isActive, onClick }: ChipProps) {
  return (
    <Button
      variant="outline"
      className={cn(
        "w-fit rounded-lg",
        isActive && "border-primary text-primary",
      )}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface MobileFilterSortProps<TData> {
  // Filter
  filterCategories: FilterCategory<TData>[];
  activeFilters: ActiveFilter<TData>[];
  onAddFilter: (filter: ActiveFilter<TData>) => void;
  onRemoveFilter: (categoryId: keyof TData) => void;
  onClearAllFilters: () => void;
  // Sort
  sortOptions: SortOption<TData>[];
  activeSort: ActiveSort<TData> | null;
  onSortChange: (sort: ActiveSort<TData> | null) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DIRECTIONS: {
  value: SortDirection;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "asc",
    label: "Ascending",
    icon: <ArrowUpAZ className="w-4 h-4 text-muted-foreground" />,
  },
  {
    value: "desc",
    label: "Descending",
    icon: <ArrowDownAZ className="w-4 h-4 text-muted-foreground" />,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function MobileFilterSort<TData>({
  filterCategories,
  activeFilters,
  onAddFilter,
  onRemoveFilter,
  onClearAllFilters,
  sortOptions,
  activeSort,
  onSortChange,
}: MobileFilterSortProps<TData>) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const totalActive = activeFilters.length + (activeSort ? 1 : 0);

  const isOptionActive = (catId: keyof TData, value: string) =>
    activeFilters.some((f) => f.categoryId === catId && f.value === value);

  const handleFilterToggle = (
    cat: FilterCategory<TData>,
    optValue: string,
    optLabel: string,
  ) => {
    if (isOptionActive(cat.id, optValue)) {
      onRemoveFilter(cat.id);
    } else {
      onAddFilter({
        categoryId: cat.id,
        categoryLabel: cat.label,
        value: optValue,
        valueLabel: optLabel,
      });
    }
  };

  const handleDirectionChange = (direction: SortDirection) => {
    if (activeSort) {
      onSortChange({ ...activeSort, direction });
    } else {
      const first = sortOptions[0];
      if (first)
        onSortChange({
          columnId: first.id,
          columnLabel: first.label,
          direction,
        });
    }
  };

  const handleColumnChange = (opt: SortOption<TData>) => {
    onSortChange({
      columnId: opt.id,
      columnLabel: opt.label,
      direction: activeSort?.direction ?? "asc",
    });
  };

  return (
    <Sheet open={open && isMobile} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="icon" className="relative shrink-0">
            <Filter size={16} />
            {totalActive > 0 && (
              <Badge className="absolute -right-1.5 -top-1.5 h-4 min-w-4 rounded-full px-1 text-xs">
                {totalActive}
              </Badge>
            )}
          </Button>
        }
      />

      <SheetContent
        side="bottom"
        className="px-4 pt-3 pb-6 rounded-t-xl"
        showCloseButton={false}
      >
        {/* Header */}
        <SheetHeader className="p-0 mb-3">
          <SheetTitle className="flex items-center justify-between">
            <span className="text-base font-semibold">Filter & Sort</span>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X size={16} />
            </Button>
          </SheetTitle>
        </SheetHeader>

        {/* Tabs */}
        <Tabs defaultValue="filter">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="filter" className="flex-1 gap-1.5">
              Filter
              {activeFilters.length > 0 && (
                <Badge
                  variant="secondary"
                  className="h-4 px-1 text-xs rounded-full min-w-4"
                >
                  {activeFilters.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sort" className="flex-1 gap-1.5">
              Sort
              {activeSort && (
                <Badge
                  variant="secondary"
                  className="h-4 px-1 text-xs rounded-full min-w-4"
                >
                  1
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Filter Tab ── */}
          <TabsContent value="filter" className="mt-0">
            {filterCategories.length === 0 ? (
              <p className="py-6 text-sm text-center text-muted-foreground">
                Tidak ada filter tersedia.
              </p>
            ) : (
              <>
                <Accordion className="w-full">
                  {filterCategories.map((cat) => {
                    const activeForCat = activeFilters.find(
                      (f) => f.categoryId === cat.id,
                    );

                    return (
                      <AccordionItem
                        key={String(cat.id)}
                        value={String(cat.id)}
                      >
                        <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                          <span className="flex items-center gap-2">
                            {cat.label}
                            {activeForCat && (
                              <Badge
                                variant="secondary"
                                className="h-4 px-1 text-xs font-normal rounded-sm"
                              >
                                {activeForCat.valueLabel}
                              </Badge>
                            )}
                          </span>
                        </AccordionTrigger>

                        <AccordionContent className="pt-0 pb-3">
                          <div className="flex w-full gap-1">
                            {cat.options.map((opt) => {
                              const active = isOptionActive(cat.id, opt.value);

                              return (
                                <Chip
                                  key={opt.value}
                                  label={opt.label}
                                  isActive={active}
                                  onClick={() =>
                                    handleFilterToggle(
                                      cat,
                                      opt.value,
                                      opt.label,
                                    )
                                  }
                                />
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>

                {activeFilters.length > 0 && (
                  <Button onClick={onClearAllFilters} variant="ghost">
                    Hapus semua filter
                  </Button>
                )}
              </>
            )}
          </TabsContent>

          {/* ── Sort Tab ── */}
          <TabsContent value="sort" className="mt-0 space-y-5">
            {/* Sort Order */}
            <div>
              <p className="mb-2 text-xs font-medium tracking-wider uppercase text-muted-foreground">
                Sort Order
              </p>
              <div className="flex w-full gap-1">
                {DIRECTIONS.map(({ value, label }) => {
                  const active = (activeSort?.direction ?? "asc") === value;

                  return (
                    <Chip
                      key={value}
                      label={label}
                      isActive={active}
                      onClick={() => handleDirectionChange(value)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Column */}
            <div>
              <p className="mb-2 text-xs font-medium tracking-wider uppercase text-muted-foreground">
                Column
              </p>
              <div className="flex w-full gap-1">
                {sortOptions.map((opt) => {
                  const active = activeSort?.columnId === opt.id;

                  return (
                    <Chip
                      key={String(opt.id)}
                      label={opt.label}
                      isActive={active}
                      onClick={() => handleColumnChange(opt)}
                    />
                  );
                })}
              </div>
            </div>

            {activeSort && (
              <Button
                onClick={() => onSortChange(null)}
                className="w-full ghost"
              >
                Hapus sort
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
